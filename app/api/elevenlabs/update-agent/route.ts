import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest) {
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
      agentId,
      name,
      voiceId,
      systemPrompt,
      firstMessage
    } = body

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      )
    }

    // Build update payload using ElevenLabs' built-in LLM
    const updatePayload: any = {}

    if (name) updatePayload.name = name

    // Use the new conversation_config structure with built-in LLM
    if (systemPrompt || voiceId || firstMessage) {
      updatePayload.conversation_config = {
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
          voice_id: voiceId || '21m00Tcm4TlvDq8ikWAM',
          model_id: 'eleven_multilingual_v2'
        }
      }
    }

    // Always ensure localhost is in allowlist for testing
    updatePayload.platform_settings = {
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

    // Log the update payload for debugging
    console.log('=== ElevenLabs Update Payload ===')
    console.log('Agent ID:', agentId)
    console.log('Payload:', JSON.stringify(updatePayload, null, 2))
    console.log('System Prompt Length:', updatePayload.conversation_config?.agent?.prompt?.prompt?.length || 0)
    console.log('=================================')

    // Update ElevenLabs agent
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: 'PATCH',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatePayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs agent update error:', errorText)
      return NextResponse.json(
        { error: 'Failed to update ElevenLabs agent', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('Error updating ElevenLabs agent:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
