import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(req: NextRequest) {
  try {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
    if (!geminiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { prompt } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    console.log('Testing Gemini image generation with prompt:', prompt)
    console.log('Using model: gemini-2.5-flash-image')

    const ai = new GoogleGenAI({ apiKey: geminiKey })

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
    })

    console.log('Response received:', JSON.stringify(response, null, 2).substring(0, 500))

    const result: { text?: string; imageUrl?: string } = {}

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.text) {
        console.log('Text response:', part.text)
        result.text = part.text
      } else if (part.inlineData) {
        const imageData = part.inlineData.data
        const mimeType = part.inlineData.mimeType || 'image/png'
        console.log('Image received, mime type:', mimeType)
        result.imageUrl = `data:${mimeType};base64,${imageData}`
      }
    }

    if (!result.imageUrl && !result.text) {
      return NextResponse.json(
        { error: 'No image or text generated', rawResponse: response },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate image', details: error.toString() },
      { status: 500 }
    )
  }
}
