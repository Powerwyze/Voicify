import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const {
      messages,
      model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
      temperature = 1.0, // Gemini 3 is optimized for temperature 1.0
    } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'messages array is required' },
        { status: 400 }
      )
    }

    // Map chat-style messages to Gemini "contents" format
    const contents = messages.map((m: any) => {
      const role = m.role === 'assistant' ? 'model' : 'user'
      const text = typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
      return { role, parts: [{ text }] }
    })

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature }
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Gemini API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to get AI response', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    const message =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).join('\n')

    return NextResponse.json({
      success: true,
      message
    })
  } catch (error: any) {
    console.error('Error in Gemini chat:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

