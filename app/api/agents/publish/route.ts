import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { syncAgentToElevenLabs } from '@/lib/elevenlabs-sync'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId } = body

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    // Get agent details with venue info
    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('*, venues(display_name)')
      .eq('id', agentId)
      .single()

    if (fetchError || !agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Add venue name to agent object for system prompt
    if (agent.venues) {
      agent.venue = agent.venues.display_name
    }

    // Update status to published and set first_published_at if needed
    const updateData: any = { status: 'published' }

    // Set first_published_at if this is the first time publishing
    if (!agent.first_published_at) {
      updateData.first_published_at = new Date().toISOString()
    }

    // TODO: Re-enable ElevenLabs sync when API keys are configured
    // For now, skip sync to allow publishing without API keys
    // let elevenLabsAgentId = agent.elevenlabs_agent_id
    // try {
    //   const result = await syncAgentToElevenLabs(agent)
    //   elevenLabsAgentId = result.agentId || agent.elevenlabs_agent_id
    //   if (elevenLabsAgentId && elevenLabsAgentId !== agent.elevenlabs_agent_id) {
    //     updateData.elevenlabs_agent_id = elevenLabsAgentId
    //   }
    // } catch (error: any) {
    //   console.error('Failed to sync to ElevenLabs:', error)
    // }

    const { data: updatedAgent, error: updateError } = await supabase
      .from('agents')
      .update(updateData)
      .eq('id', agentId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      throw updateError
    }

    return NextResponse.json({
      success: true,
      requiresBilling: false,
      agent: updatedAgent
    })
  } catch (error: any) {
    console.error('Publish error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
