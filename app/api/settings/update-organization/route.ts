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

    const body = await request.json()
    const { organizationName, venueName } = body

    // Get user's organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, owner_user_id')
      .eq('owner_user_id', user.id)
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Update organization name if provided
    if (organizationName) {
      const { error: updateOrgError } = await supabase
        .from('organizations')
        .update({ name: organizationName })
        .eq('id', org.id)

      if (updateOrgError) {
        console.error('Update organization error:', updateOrgError)
        return NextResponse.json(
          { success: false, error: 'Failed to update organization' },
          { status: 500 }
        )
      }
    }

    // Update venue name if provided
    if (venueName) {
      // Get the first venue for this organization (assuming one venue per org for now)
      const { data: venue } = await supabase
        .from('venues')
        .select('id')
        .eq('organization_id', org.id)
        .limit(1)
        .single()

      if (venue) {
        const { error: updateVenueError } = await supabase
          .from('venues')
          .update({ display_name: venueName })
          .eq('id', venue.id)

        if (updateVenueError) {
          console.error('Update venue error:', updateVenueError)
          return NextResponse.json(
            { success: false, error: 'Failed to update venue' },
            { status: 500 }
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    })
  } catch (error: any) {
    console.error('Update organization error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
