import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentPublicId = searchParams.get('publicId')

    if (!agentPublicId) {
      return NextResponse.json(
        { success: false, error: 'Agent public ID is required' },
        { status: 400 }
      )
    }

    // First check if agent exists with this slug (regardless of status)
    const { data: agentCheck } = await supabase
      .from('agents')
      .select('id, slug, status')
      .eq('slug', agentPublicId)
      .single()

    // If no agent found at all
    if (!agentCheck) {
      console.error(`Agent not found with slug: ${agentPublicId}`)
      return NextResponse.json(
        { success: false, error: `Agent not found with slug: ${agentPublicId}` },
        { status: 404 }
      )
    }

    // If agent exists but not published
    if (agentCheck.status !== 'published') {
      console.error(`Agent found but not published. Status: ${agentCheck.status}`)
      return NextResponse.json(
        { success: false, error: `This agent is not published yet. Current status: ${agentCheck.status}` },
        { status: 403 }
      )
    }

    // Get full agent with venue and organization info
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select(`
        id,
        name,
        slug,
        bio,
        tier,
        voice,
        personality,
        system_prompt,
        first_message,
        important_facts,
        status,
        venue_id,
        organization_id,
        landing_spec,
        venues (
          id,
          display_name,
          kind,
          background_image_url
        ),
        organizations (
          id,
          name
        )
      `)
      .eq('slug', agentPublicId)
      .eq('status', 'published')
      .single()

    if (agentError || !agent) {
      console.error('Error fetching full agent data:', agentError)
      return NextResponse.json(
        { success: false, error: 'Error loading agent data' },
        { status: 500 }
      )
    }

    // Get supported languages from voice data
    // For now, we'll derive this from tier
    let supportedLanguages = ['English']
    if (agent.tier >= 2) {
      supportedLanguages = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese']
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        slug: agent.slug,
        bio: agent.bio,
        tier: agent.tier,
        venue: agent.venues,
        organization: agent.organizations,
        supportedLanguages,
        voice: agent.voice,
        personality: agent.personality,
        systemPrompt: agent.system_prompt,
        firstMessage: agent.first_message,
        landing_spec: agent.landing_spec
      }
    })
  } catch (error: any) {
    console.error('Visitor agent fetch error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
