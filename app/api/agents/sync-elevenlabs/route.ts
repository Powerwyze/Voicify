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

    // Sync agent to ElevenLabs Conversational AI
    let elevenLabsAgentId = agent.elevenlabs_agent_id
    try {
      const result = await syncAgentToElevenLabs(agent)
      elevenLabsAgentId = result.agentId || agent.elevenlabs_agent_id

      if (!elevenLabsAgentId) {
        throw new Error('No agent ID returned from ElevenLabs')
      }
    } catch (error: any) {
      console.error('Failed to sync to ElevenLabs:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to sync to ElevenLabs' },
        { status: 500 }
      )
    }

    // Update agent with ElevenLabs agent ID
    if (elevenLabsAgentId && elevenLabsAgentId !== agent.elevenlabs_agent_id) {
      const { error: updateError } = await supabase
        .from('agents')
        .update({ elevenlabs_agent_id: elevenLabsAgentId })
        .eq('id', agentId)

      if (updateError) {
        console.error('Failed to update agent:', updateError)
        throw updateError
      }
    }

    return NextResponse.json({
      success: true,
      elevenLabsAgentId,
      agent: { ...agent, elevenlabs_agent_id: elevenLabsAgentId }
    })
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
