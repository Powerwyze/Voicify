import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Server is missing Supabase configuration' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get session token from cookie or header
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')

    let accessToken: string | null = null

    if (authHeader) {
      accessToken = authHeader.replace('Bearer ', '')
    } else if (cookieHeader) {
      const tokenMatch = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/)
      if (tokenMatch) {
        try {
          const tokenData = JSON.parse(decodeURIComponent(tokenMatch[1]))
          accessToken = tokenData.access_token || tokenData[0]
        } catch (e) {
          console.error('Failed to parse token from cookie:', e)
        }
      }
    }

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated - no token found' },
        { status: 401 }
      )
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: `Invalid authentication: ${userError?.message || 'No user'}` },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const venueId = formData.get('venueId') as string

    if (!file || !venueId) {
      return NextResponse.json(
        { success: false, error: 'File and venueId are required' },
        { status: 400 }
      )
    }

    // Verify user owns the organization that owns this venue
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, organization_id')
      .eq('id', venueId)
      .single()

    if (venueError || !venue) {
      return NextResponse.json(
        { success: false, error: 'Venue not found' },
        { status: 404 }
      )
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('owner_user_id')
      .eq('id', venue.organization_id)
      .single()

    if (orgError || !org || org.owner_user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to upload for this venue' },
        { status: 403 }
      )
    }

    const fileExt = (file.name.split('.').pop() || 'png').toLowerCase()
    const safeExt = ['png', 'jpg', 'jpeg', 'webp'].includes(fileExt) ? fileExt : 'png'
    const fileName = `${Date.now()}.${safeExt}`
    const filePath = `agent-landing-backgrounds/${venueId}/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('venue-images')
      .upload(filePath, buffer, {
        contentType: file.type || `image/${safeExt}`,
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { success: false, error: 'Failed to upload image' },
        { status: 500 }
      )
    }

    const { data: { publicUrl } } = supabase.storage
      .from('venue-images')
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
    })
  } catch (error: any) {
    console.error('Upload background image error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

