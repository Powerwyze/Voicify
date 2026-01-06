import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { syncAgentToVapi } from '@/lib/vapi-sync'

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

    // Get agent details
    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (fetchError || !agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Sync agent to Vapi
    let vapiAssistantId = agent.vapi_assistant_id
    try {
      const result = await syncAgentToVapi(agent)
      vapiAssistantId = result.assistantId || agent.vapi_assistant_id

      if (!vapiAssistantId) {
        throw new Error('No assistant ID returned from Vapi')
      }
    } catch (error: any) {
      console.error('Failed to sync to Vapi:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to sync to Vapi' },
        { status: 500 }
      )
    }

    // Update agent with Vapi assistant ID
    if (vapiAssistantId && vapiAssistantId !== agent.vapi_assistant_id) {
      const { error: updateError } = await supabase
        .from('agents')
        .update({ vapi_assistant_id: vapiAssistantId })
        .eq('id', agentId)

      if (updateError) {
        console.error('Failed to update agent:', updateError)
        throw updateError
      }
    }

    return NextResponse.json({
      success: true,
      vapiAssistantId,
      agent: { ...agent, vapi_assistant_id: vapiAssistantId }
    })
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

