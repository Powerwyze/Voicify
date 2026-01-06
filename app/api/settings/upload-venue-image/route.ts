import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookie or header
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')

    let accessToken = null

    if (authHeader) {
      accessToken = authHeader.replace('Bearer ', '')
    } else if (cookieHeader) {
      // Extract token from cookie
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
      console.error('Auth error:', userError)
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
      console.error('Venue lookup error:', venueError)
      return NextResponse.json(
        { success: false, error: 'Venue not found' },
        { status: 404 }
      )
    }

    // Check if user owns the organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('owner_user_id')
      .eq('id', venue.organization_id)
      .single()

    if (orgError || !org || org.owner_user_id !== user.id) {
      console.error('Organization lookup error:', orgError)
      return NextResponse.json(
        { success: false, error: 'Not authorized to update this venue' },
        { status: 403 }
      )
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${venueId}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('venue-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { success: false, error: 'Failed to upload image' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('venue-images')
      .getPublicUrl(filePath)

    // Update venue with background image URL using raw SQL to bypass schema cache
    const { error: updateError } = await supabase.rpc('exec_sql', {
      query: `UPDATE venues SET background_image_url = '${publicUrl}' WHERE id = '${venueId}'`
    })

    // If RPC doesn't work, try direct update
    if (updateError) {
      console.log('RPC failed, trying direct update:', updateError.message)

      // Use raw SQL via REST API
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/venues?id=eq.${venueId}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ background_image_url: publicUrl })
      })

      if (!updateResponse.ok) {
        console.error('REST API update failed:', await updateResponse.text())
        return NextResponse.json(
          { success: false, error: 'Failed to update venue - schema cache issue. Please refresh Supabase schema.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl
    })
  } catch (error: any) {
    console.error('Upload venue image error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
