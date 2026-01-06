import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

/**
 * Image generation API using Google Gemini's image generation model
 * Falls back to Pollinations.ai if Gemini fails
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, width = 512, height = 512 } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

    if (geminiKey) {
      console.log('Using Gemini gemini-2.5-flash-image for image generation')
      
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey })
        
        // Use the working model that supports image generation
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: prompt,
        })

        // Check for image data in the response
        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              const base64Image = part.inlineData.data
              const mimeType = part.inlineData.mimeType || 'image/png'
              
              console.log('Gemini image generated successfully')
              return NextResponse.json({
                success: true,
                imageUrl: `data:${mimeType};base64,${base64Image}`,
                provider: 'gemini'
              })
            }
          }
        }
        
        console.log('Gemini response did not contain image data, using fallback')
      } catch (geminiError: any) {
        console.error('Gemini image generation failed:', geminiError.message)
        // Fall through to Pollinations fallback
      }
    }

    // Fallback: Use Pollinations.ai - free image generation, no API key needed
    console.log('Using Pollinations.ai for image generation')
    
    const enhancedPrompt = `${prompt}, professional photography, high quality, vibrant colors, suitable for museum exhibit landing page, art deco style`
    const encodedPrompt = encodeURIComponent(enhancedPrompt)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true`

    return NextResponse.json({
      success: true,
      imageUrl,
      provider: 'pollinations'
    })
  } catch (error: any) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    )
  }
}
