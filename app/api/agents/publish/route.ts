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

    // Check if first publish (need to redirect to billing)
    if (!agent.first_published_at) {
      return NextResponse.json({
        success: true,
        requiresBilling: true,
        agent
      })
    }

    // Sync agent to ElevenLabs Conversational AI
    let elevenLabsAgentId = agent.elevenlabs_agent_id
    try {
      const result = await syncAgentToElevenLabs(agent)
      elevenLabsAgentId = result.agentId || agent.elevenlabs_agent_id
    } catch (error: any) {
      console.error('Failed to sync to ElevenLabs:', error)
      // Continue publishing even if ElevenLabs sync fails
    }

    // Update status to published and store ElevenLabs agent ID
    const updateData: any = { status: 'published' }
    if (elevenLabsAgentId && elevenLabsAgentId !== agent.elevenlabs_agent_id) {
      updateData.elevenlabs_agent_id = elevenLabsAgentId
    }

    const { error: updateError } = await supabase
      .from('agents')
      .update(updateData)
      .eq('id', agentId)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      requiresBilling: false,
      agent: { ...agent, ...updateData }
    })
  } catch (error: any) {
    console.error('Publish error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
