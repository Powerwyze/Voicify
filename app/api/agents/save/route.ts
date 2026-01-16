import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, agentData, capabilitiesData } = body

    let result
    let delta: Record<string, any> = {}

    if (agentId) {
      // Update existing agent
      const { data: existingAgent } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single()

      // Calculate delta
      if (existingAgent) {
        Object.keys(agentData).forEach((key) => {
          if (JSON.stringify(existingAgent[key]) !== JSON.stringify(agentData[key])) {
            delta[key] = agentData[key]
          }
        })
      }

      const { data, error } = await supabase
        .from('agents')
        .update(agentData)
        .eq('id', agentId)
        .select()
        .single()

      if (error) throw error
      result = data

      // Update capabilities if Tier 3 and capabilities provided
      if (agentData.tier === 3 && capabilitiesData) {
        await supabase
          .from('agent_capabilities')
          .upsert({
            agent_id: agentId,
            ...capabilitiesData,
          })
      }
    } else {
      // Create new agent
      const { data, error } = await supabase
        .from('agents')
        .insert(agentData)
        .select()
        .single()

      if (error) throw error
      result = data
      delta = agentData

      // Insert capabilities if Tier 3
      if (agentData.tier === 3 && capabilitiesData) {
        await supabase
          .from('agent_capabilities')
          .insert({
            agent_id: result.id,
            ...capabilitiesData,
          })
      }
    }

    // Sync with Vapi - create/update assistant (skip if using ElevenLabs)
    // Note: Vapi sync is optional for now - you can create agents without it
    try {
      // Skip Vapi sync if no API key configured
      const vapiApiKey = process.env.NEXT_PRIVATE_VAPI_API_KEY || process.env.VAPI_API_KEY
      if (!vapiApiKey) {
        console.log('Vapi API key not configured - skipping assistant sync')
      } else {
        const vapiConfig = {
          agentId: result.id,
          vapiAssistantId: result.vapi_assistant_id,
          name: result.name,
          bio: result.bio,
          tier: result.tier,
          voiceId: result.voice,
          personality: result.personality,
          systemPrompt: result.system_prompt,
          firstMessage: result.first_message,
          importantFacts: result.important_facts || [],
          endScript: result.end_script || '',
          organizationId: result.organization_id,
          venueId: result.venue_id,
          canSendEmail: capabilitiesData?.can_send_email || false,
          canSendSms: capabilitiesData?.can_send_sms || false,
          canTakeOrders: capabilitiesData?.can_take_orders || false,
          canPostSocial: capabilitiesData?.can_post_social || false,
        }

        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          process.env.NEXT_PUBLIC_BASE_URL ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

        const vapiResponse = await fetch(`${baseUrl}/api/vapi/assistant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vapiConfig)
        })

        if (vapiResponse.ok) {
          const vapiData = await vapiResponse.json()

          // Update agent with vapi_assistant_id
          if (vapiData.vapiAssistantId && vapiData.vapiAssistantId !== result.vapi_assistant_id) {
            await supabase
              .from('agents')
              .update({ vapi_assistant_id: vapiData.vapiAssistantId })
              .eq('id', result.id)

            result.vapi_assistant_id = vapiData.vapiAssistantId
          }
        } else {
          const errorText = await vapiResponse.text()
          console.error('Vapi sync failed:', errorText)
          // Don't fail the whole operation if Vapi sync fails
        }
      }
    } catch (vapiError) {
      console.error('Vapi sync error:', vapiError)
      // Don't fail the whole operation if Vapi sync fails
    }

    return NextResponse.json({ success: true, agent: result })
  } catch (error: any) {
    console.error('Save error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
