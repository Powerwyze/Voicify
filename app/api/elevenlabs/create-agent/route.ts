import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const {
      name,
      voiceId,
      systemPrompt,
      firstMessage,
      bargeIn = true,
      maxDurationMs = 900000,
      afterSilenceMs = 8000
    } = body

    if (!name || !voiceId || !systemPrompt) {
      return NextResponse.json(
        { error: 'name, voiceId, and systemPrompt are required' },
        { status: 400 }
      )
    }

    console.log('System Prompt Length:', systemPrompt.length)
    console.log('System Prompt Preview:', systemPrompt.substring(0, 500) + '...')

    // Create ElevenLabs conversational agent using their built-in LLM
    const payload = {
      name,
      conversation_config: {
        agent: {
          prompt: {
            prompt: systemPrompt,
            ...(firstMessage && { first_message: firstMessage }),
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
          voice_id: voiceId,
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

    console.log('Creating agent with payload:', JSON.stringify(payload, null, 2))

    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs agent creation error:', errorText)
      return NextResponse.json(
        { error: 'Failed to create ElevenLabs agent', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('New agent created:', data.agent_id)

    return NextResponse.json({
      success: true,
      agentId: data.agent_id,
      data
    })
  } catch (error: any) {
    console.error('Error creating ElevenLabs agent:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
