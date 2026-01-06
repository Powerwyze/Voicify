/**
 * ElevenLabs Agent Sync Utility
 *
 * Syncs PowerWyze agents to ElevenLabs Conversational AI
 */

export async function syncAgentToElevenLabs(agent: any) {
  // Build system prompt from agent configuration
  const systemPrompt = buildSystemPrompt(agent)

  const payload = {
    name: agent.name,
    voiceId: agent.voice || '21m00Tcm4TlvDq8ikWAM',
    systemPrompt,
    firstMessage: agent.welcome_message || `Hello! I'm ${agent.name}. How can I help you today?`
  }

  // Check if agent already has an ElevenLabs agent ID
  if (agent.elevenlabs_agent_id) {
    // Update existing agent
    return await updateElevenLabsAgent(agent.elevenlabs_agent_id, payload)
  } else {
    // Create new agent
    return await createElevenLabsAgent(payload)
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

async function createElevenLabsAgent(payload: any) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/elevenlabs/create-agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create ElevenLabs agent')
  }

  return await response.json()
}

async function updateElevenLabsAgent(agentId: string, payload: any) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/elevenlabs/update-agent`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId, ...payload })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update ElevenLabs agent')
  }

  return await response.json()
}
