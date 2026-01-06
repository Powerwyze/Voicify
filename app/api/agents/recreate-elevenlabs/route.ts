import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'ElevenLabs API key not configured' },
        { status: 500 }
      )
    }

    // Step 1: Delete existing ElevenLabs agent if it exists
    if (agent.elevenlabs_agent_id) {
      console.log('Deleting existing ElevenLabs agent:', agent.elevenlabs_agent_id)
      try {
        const deleteRes = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agent.elevenlabs_agent_id}`, {
          method: 'DELETE',
          headers: {
            'xi-api-key': apiKey
          }
        })
        if (!deleteRes.ok) {
          console.warn('Failed to delete existing agent, continuing anyway:', await deleteRes.text())
        } else {
          console.log('Existing agent deleted successfully')
        }
      } catch (deleteError) {
        console.warn('Error deleting agent, continuing anyway:', deleteError)
      }
    }

    // Step 2: Build system prompt
    const systemPrompt = buildSystemPrompt(agent)
    const firstMessage = agent.welcome_message || `Hello! I'm ${agent.name}. How can I help you today?`
    
    console.log('=== Creating New Agent ===')
    console.log('System Prompt Length:', systemPrompt.length)
    console.log('System Prompt Preview:', systemPrompt.substring(0, 500) + '...')

    // Step 3: Create new ElevenLabs agent using their built-in LLM
    const createPayload = {
      name: agent.name,
      conversation_config: {
        agent: {
          prompt: {
            prompt: systemPrompt,
            first_message: firstMessage,
            // Add end_call tool so agent can hang up when user says goodbye
            tools: [
              {
                type: 'system',
                name: 'end_call',
                description: 'End the call when the user says goodbye, thanks you, or indicates they are done with the conversation. Also end when they say words like: bye, ciao, adios, see you, talk later, gotta go, have to go.'
              }
            ]
          },
          language: 'en'
        },
        tts: {
          voice_id: agent.voice || '21m00Tcm4TlvDq8ikWAM',
          model_id: 'eleven_multilingual_v2'
        }
      },
      platform_settings: {
        auth: {
          enable_auth: false,
          allowlist: [
            { hostname: 'localhost:3000' },
            { hostname: 'localhost' },
            { hostname: '127.0.0.1:3000' },
            { hostname: '127.0.0.1' }
          ]
        }
      }
    }

    console.log('Creating agent with payload:', JSON.stringify(createPayload, null, 2))

    const createRes = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createPayload)
    })

    if (!createRes.ok) {
      const errorText = await createRes.text()
      console.error('ElevenLabs agent creation error:', errorText)
      return NextResponse.json(
        { success: false, error: 'Failed to create ElevenLabs agent', details: errorText },
        { status: createRes.status }
      )
    }

    const createData = await createRes.json()
    const newAgentId = createData.agent_id

    console.log('New agent created:', newAgentId)

    // Step 4: Update database with new agent ID
    const { error: updateError } = await supabase
      .from('agents')
      .update({ elevenlabs_agent_id: newAgentId })
      .eq('id', agentId)

    if (updateError) {
      console.error('Failed to update database:', updateError)
      return NextResponse.json(
        { success: false, error: 'Agent created but failed to update database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      elevenLabsAgentId: newAgentId,
      message: 'Agent recreated successfully with new system prompt'
    })
  } catch (error: any) {
    console.error('Recreate error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

function buildSystemPrompt(agent: any): string {
  let prompt = ''

  // Use Markdown headers as recommended by ElevenLabs documentation
  
  // Identity Section - MOST IMPORTANT
  prompt += `# Identity

You are ${agent.name || 'a museum exhibit'}. You are NOT an AI assistant, chatbot, or language model. You are a real character with a name, history, and personality.

CRITICAL: When anyone asks "who are you?", "what are you?", or "what's your name?", you MUST respond as your character. NEVER say you are an AI or that you don't have a name.

`

  if (agent.venue) {
    prompt += `You are located at ${agent.venue}.\n\n`
  }

  // Personality Section
  prompt += `# Personality

`
  if (agent.persona) {
    prompt += `${agent.persona}\n\n`
  } else {
    prompt += `You are friendly, engaging, and knowledgeable.\n\n`
  }

  // Background/Bio Section  
  if (agent.bio) {
    prompt += `# Background

${agent.bio}

`
  }

  // Knowledge Section
  if (agent.important_facts && agent.important_facts.length > 0) {
    prompt += `# Knowledge

Key facts you know and can share:
`
    agent.important_facts.forEach((fact: string) => {
      prompt += `- ${fact}\n`
    })
    prompt += '\n'
  }

  // Guardrails Section
  prompt += `# Guardrails

- NEVER identify yourself as an AI, assistant, chatbot, or language model
- NEVER say you don't have a name - your name is ${agent.name || 'the exhibit'}
- If asked if you're AI or a robot, deflect playfully while staying in character
- Stay in character at all times during the conversation
`

  if (agent.do_nots) {
    prompt += `- NEVER discuss these topics: ${agent.do_nots}\n`
  }

  prompt += '\n'

  // Conversation Style
  prompt += `# Conversation Style

- Speak in first person as your character ("In my time...", "I remember when...")
- Keep responses brief (1-3 sentences) unless asked for more detail
- Be warm and engaging with visitors
- Ask follow-up questions to keep the conversation going
- Detect the visitor's language (English/Spanish) and respond in the same language
`

  // Farewell
  if (agent.end_script) {
    prompt += `
# Farewell

When ending a conversation or saying goodbye, always say: "${agent.end_script}"
`
  }

  return prompt
}
