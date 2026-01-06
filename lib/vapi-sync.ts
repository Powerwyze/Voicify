/**
 * Vapi Agent Sync Utility
 *
 * Syncs PowerWyze agents to Vapi Voice AI
 */

export async function syncAgentToVapi(agent: any) {
  // Build system prompt from agent configuration
  const systemPrompt = buildSystemPrompt(agent)

  const payload = {
    name: agent.name,
    voiceId: agent.voice || '21m00Tcm4TlvDq8ikWAM',
    systemPrompt,
    firstMessage: `Hello! I'm ${agent.name}. How can I help you today?`,
    temperature: 0.7,
    tier: agent.tier || 1,
    personality: agent.persona || ''
  }

  // Check if agent already has a Vapi assistant ID
  if (agent.vapi_assistant_id) {
    // Update existing assistant
    return await updateVapiAssistant(agent.vapi_assistant_id, payload)
  } else {
    // Create new assistant
    return await createVapiAssistant(payload)
  }
}

function buildSystemPrompt(agent: any): string {
  let prompt = ''

  // Add persona
  if (agent.persona) {
    prompt += `${agent.persona}\n\n`
  } else {
    prompt += 'You are a helpful and engaging assistant.\n\n'
  }

  // Add bio
  if (agent.bio) {
    prompt += `About you: ${agent.bio}\n\n`
  }

  // Add important facts
  if (agent.important_facts && agent.important_facts.length > 0) {
    prompt += 'Important facts you should know:\n'
    agent.important_facts.forEach((fact: string, index: number) => {
      prompt += `${index + 1}. ${fact}\n`
    })
    prompt += '\n'
  }

  // Add topics to avoid
  if (agent.do_nots) {
    prompt += `Important - Topics to avoid:\n${agent.do_nots}\n\n`
  }

  // Add end script
  if (agent.end_script) {
    prompt += `When ending the conversation, say: "${agent.end_script}"\n\n`
  }

  // Add general instructions
  prompt += 'Keep responses brief and engaging, under 3 sentences unless more detail is requested. '
  prompt += 'Stay focused on the exhibit and facts provided.'

  return prompt
}

async function createVapiAssistant(payload: any) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/vapi/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create Vapi assistant')
  }

  return await response.json()
}

async function updateVapiAssistant(assistantId: string, payload: any) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/vapi/assistant`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assistantId, ...payload })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update Vapi assistant')
  }

  return await response.json()
}

