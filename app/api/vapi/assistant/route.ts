import { NextRequest, NextResponse } from 'next/server'

interface AgentConfig {
  agentId?: string
  vapiAssistantId?: string
  name: string
  bio: string
  tier: 1 | 2 | 3
  voiceId: string
  personality: string
  systemPrompt?: string
  firstMessage?: string
  importantFacts: string[]
  endScript: string
  organizationId: string
  venueId: string
  canSendEmail?: boolean
  canSendSms?: boolean
  canTakeOrders?: boolean
  canPostSocial?: boolean
}

export async function POST(req: NextRequest) {
  try {
    const config: AgentConfig = await req.json()

    const vapiApiKey = process.env.NEXT_PRIVATE_VAPI_API_KEY || process.env.VAPI_API_KEY

    if (!vapiApiKey) {
      return NextResponse.json(
        { error: 'Vapi API key not configured' },
        { status: 500 }
      )
    }

    // Build Vapi assistant payload
    const assistantPayload = buildVapiAssistant(config)

    // Create or update assistant
    const url = config.vapiAssistantId
      ? `https://api.vapi.ai/assistant/${config.vapiAssistantId}`
      : 'https://api.vapi.ai/assistant'

    const method = config.vapiAssistantId ? 'PATCH' : 'POST'

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${vapiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(assistantPayload)
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Vapi API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to sync with Vapi', details: errorData },
        { status: response.status }
      )
    }

    const assistantData = await response.json()

    return NextResponse.json({
      success: true,
      vapiAssistantId: assistantData.id,
      assistant: assistantData
    })
  } catch (error: any) {
    console.error('Error syncing Vapi assistant:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

function buildVapiAssistant(config: AgentConfig) {
  const {
    name,
    bio,
    tier,
    voiceId,
    personality,
    systemPrompt,
    firstMessage,
    importantFacts,
    endScript,
    organizationId,
    venueId,
    agentId,
    canSendEmail,
    canSendSms,
    canTakeOrders,
    canPostSocial
  } = config

  // Build system prompt with guardrails
  const fullSystemPrompt = [
    systemPrompt || personality || "You are a helpful, upbeat museum exhibit guide.",
    "",
    "Guidelines:",
    "- Answer questions about the exhibit clearly and briefly",
    "- Be friendly and conversational",
    "- If you don't know something, say so politely",
    "- Avoid medical, legal, or political advice",
    "- Stay focused on the exhibit content",
    "- Only use tools you are given, and ask before using them",
    "",
    "Important Facts:",
    ...importantFacts.map(fact => `- ${fact}`),
    "",
    `End Script: ${endScript}`
  ].join("\n")

  // Voice configuration (tier-specific)
  const voice: any = {
    provider: tier === 1 ? "vapi" : "google",
    voiceId: tier === 1 ? voiceId : undefined,
  }

  if (tier === 1) {
    voice.pace = "normal"
    voice.languages = ["en", "es"]
  }

  // Model configuration - All tiers use Gemini 3 Flash
  const model: any = {
    provider: "google",
    model: process.env.GEMINI_MODEL || "gemini-3-flash-preview",
    temperature: 1.0, // Gemini 3 is optimized for temperature 1.0
    messages: [
      {
        role: "system",
        content: fullSystemPrompt
      }
    ]
  }

  // Add realtime-specific settings for tier 2/3
  if (tier === 2 || tier === 3) {
    model.modalities = ["text", "audio"]
  }

  // Build tools array (tier 3 only)
  const tools: any[] = [
    {
      type: "function",
      function: {
        name: "end_call",
        description: "Politely end the conversation and terminate the session.",
        parameters: {
          type: "object",
          properties: {
            reason: { type: "string" }
          }
        }
      }
    }
  ]

  if (tier === 3) {
    if (canSendEmail) {
      tools.push({
        type: "function",
        function: {
          name: "send_promotional_email",
          description: "Send a follow-up email with exhibit highlights and links.",
          parameters: {
            type: "object",
            properties: {
              toEmail: { type: "string", format: "email" },
              subject: { type: "string" },
              bodyText: { type: "string" }
            },
            required: ["toEmail", "subject", "bodyText"]
          }
        },
        server: {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/api/tools/email`,
          secret: process.env.TOOL_SECRET
        }
      })
    }

    if (canSendSms) {
      tools.push({
        type: "function",
        function: {
          name: "send_sms",
          description: "Send an SMS with a promo code or link.",
          parameters: {
            type: "object",
            properties: {
              toPhoneE164: { type: "string", description: "+1XXXXXXXXXX" },
              message: { type: "string" }
            },
            required: ["toPhoneE164", "message"]
          }
        },
        server: {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/api/tools/sms`,
          secret: process.env.TOOL_SECRET
        }
      })
    }

    if (canTakeOrders) {
      tools.push({
        type: "function",
        function: {
          name: "place_order",
          description: "Place a gift-shop order or hold an item for pickup.",
          parameters: {
            type: "object",
            properties: {
              sku: { type: "string" },
              quantity: { type: "integer", minimum: 1 },
              pickupName: { type: "string" }
            },
            required: ["sku", "quantity", "pickupName"]
          }
        },
        server: {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/api/tools/order`,
          secret: process.env.TOOL_SECRET
        }
      })
    }

    if (canPostSocial) {
      tools.push({
        type: "function",
        function: {
          name: "post_to_social",
          description: "Draft a social post about the exhibit.",
          parameters: {
            type: "object",
            properties: {
              network: { type: "string", enum: ["instagram", "facebook", "x"] },
              caption: { type: "string", maxLength: 280 }
            },
            required: ["network", "caption"]
          }
        },
        server: {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/api/tools/social`,
          secret: process.env.TOOL_SECRET
        }
      })
    }
  }

  // Build final assistant config
  const assistant: any = {
    name,
    model,
    voice,
    firstMessage: firstMessage || `Hello! I'm ${name}. ${bio}`,

    // End call rules
    endCallFunctionEnabled: true,
    silenceTimeoutSeconds: 8,
    maxDurationSeconds: 15 * 60,

    // Background sound & interruptions
    backgroundSound: "off",
    backchannelingEnabled: true,

    // Metadata
    metadata: {
      organizationId,
      venueId,
      agentId: agentId || null,
      tier
    }
  }

  // Add tools if any
  if (tools.length > 0) {
    assistant.model.tools = tools
  }

  // Server webhooks (for all tiers)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    assistant.serverUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/webhook`
    assistant.serverUrlSecret = process.env.VAPI_SERVER_SECRET || "default-secret"
  }

  return assistant
}
