import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { GoogleGenAI } from '@google/genai'

const InputSchema = z.object({
  ownerPrompt: z.string().min(10),
  agentName: z.string().min(1).max(80),
  defaults: z
    .object({
      title: z.string().optional(),
      primary: z.string().optional(),
      background: z.string().optional(),
      text: z.string().optional(),
    })
    .optional(),
})

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
    const { ownerPrompt, agentName, defaults } = InputSchema.parse(body)

    const system = `You convert natural descriptions into a LandingSpec JSON for a museum AI exhibit with GSAP animations.

Output ONLY valid JSON matching this EXACT structure:

{
  "version": 1,
  "title": "Agent Name",
  "subtitle": "optional short subtitle",
  "theme": {
    "primary": "#111827",
    "background": "#FFFFFF",
    "text": "#111827"
  },
  "animationConfig": {
    "enabled": true,
    "orchestration": {
      "mode": "sequence",
      "staggerDelay": 0.2
    },
    "scrollTrigger": {
      "enabled": true,
      "smooth": true
    }
  },
  "blocks": [
    {
      "id": "intro-1",
      "type": "paragraph",
      "text": "Welcome text here",
      "animation": {
        "preset": "fadeIn",
        "trigger": { "type": "onload" },
        "enabled": true
      }
    }
  ],
  "imagePrompt": "a detailed image prompt based on the description"
}

ANIMATION GUIDELINES:

1. Animation Presets (use these):
   - "fadeIn": Fade in from transparent
   - "slideUp": Slide up from below with fade
   - "slideDown": Slide down from above
   - "slideLeft": Slide from left
   - "slideRight": Slide from right
   - "scaleIn": Scale up from small
   - "rotateIn": Rotate in with fade
   - "none": No animation

2. Orchestration Modes:
   - "sequence": Blocks animate one after another (storytelling)
   - "stagger": Cascading delay (for lists)
   - "parallel": All at once

3. Trigger Types:
   - "onload": Animate when page loads (use for hero/first elements)
   - "viewport": Animate when element enters viewport (use for scrollable content, threshold 0.3-0.5)
   - "scroll": Advanced scroll-based

4. Best Practices:
   - First block: "fadeIn" with "onload" trigger
   - Feature lists: "slideUp" with "viewport" trigger, threshold 0.3
   - CTAs: "scaleIn" for emphasis
   - Set "once": true for most viewport animations
   - Use 1-3 blocks typically, keep it minimal

5. Block Types:
   - paragraph: {"id": "p1", "type": "paragraph", "text": "..."}
   - bulletList: {"id": "list1", "type": "bulletList", "items": ["..."]}
   - cta: {"id": "cta1", "type": "cta", "label": "...", "href": "..."}

CONTENT RULES:
- Use ONLY hex colors (#RRGGBB format)
- Create 1-3 content blocks with meaningful exhibit information
- Mobile-first, high-contrast, bold colors for Art Deco aesthetic
- Choose rich, luxurious colors (gold #FFD700, navy #000080, emerald #50C878, burgundy #800020, teal #008080)
- IMPORTANT: Generate an "imagePrompt" field with a vivid, detailed description for hero image
  - Include artistic style hints like "oil painting", "digital art", "photograph"
  - Be specific about visual elements, mood, and atmosphere
- Each block MUST have a unique "id" field
- Each block SHOULD have animation metadata`

    const userPrompt = [
      `Agent Name: ${agentName}`,
      defaults?.title ? `Default Title: ${defaults.title}` : '',
      defaults?.primary ? `Default Primary: ${defaults.primary}` : '',
      defaults?.background ? `Default Background: ${defaults.background}` : '',
      defaults?.text ? `Default Text: ${defaults.text}` : '',
      'Owner Description:',
      ownerPrompt,
    ]
      .filter(Boolean)
      .join('\n')

    // Use the Google GenAI SDK for text generation
    const ai = new GoogleGenAI({ apiKey: geminiKey })
    
    console.log('Generating landing spec with Gemini...')
    
    const textResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `${system}\n\n${userPrompt}`,
      config: {
        temperature: 0.7,
        responseMimeType: 'application/json'
      }
    })

    const raw = textResponse.text ?? '{}'
    console.log('Gemini response:', raw.substring(0, 200))
    
    let spec: any
    try {
      spec = JSON.parse(raw)
    } catch {
      spec = {}
    }
    
    // Clamp to minimal safe defaults
    spec.version ??= 1
    spec.title ??= agentName
    spec.theme ??= {}
    spec.theme.primary = safeHex(spec.theme?.primary, '#111827')
    spec.theme.background = safeHex(spec.theme?.background, '#FFFFFF')
    spec.theme.text = safeHex(spec.theme?.text, '#111827')

    // Ensure blocks array exists
    if (!Array.isArray(spec.blocks)) {
      spec.blocks = [{
        id: 'default-1',
        type: 'paragraph',
        text: `Welcome to ${agentName}.`,
        animation: {
          preset: 'fadeIn',
          trigger: { type: 'onload' },
          enabled: true
        }
      }]
    }

    // Add default animation config if missing
    if (!spec.animationConfig) {
      spec.animationConfig = {
        enabled: true,
        orchestration: {
          mode: 'sequence',
          staggerDelay: 0.2
        },
        scrollTrigger: {
          enabled: true,
          smooth: true
        }
      }
    }

    // Ensure all blocks have IDs and default animations
    spec.blocks = spec.blocks.map((block: any, index: number) => {
      if (!block.id) {
        block.id = `block-${index + 1}`
      }
      if (!block.animation) {
        block.animation = {
          preset: index === 0 ? 'fadeIn' : 'slideUp',
          trigger: {
            type: index === 0 ? 'onload' : 'viewport',
            threshold: 0.3,
            once: true
          },
          enabled: true
        }
      }
      return block
    })

    // Generate hero image using description from user
    const imagePrompt = spec.imagePrompt || ownerPrompt
    delete spec.imagePrompt // Remove from final spec

    try {
      const fullImagePrompt = `Create a beautiful, artistic image for a museum exhibit landing page. Subject: ${imagePrompt}. Style: ${agentName} themed, art deco inspired, elegant and sophisticated, museum quality, professional photography or digital art, dramatic lighting, rich colors.`
      console.log('Generating hero image with Gemini:', fullImagePrompt.substring(0, 100) + '...')
      
      let heroImageUrl: string | null = null
      
      // Try Gemini image generation with gemini-2.5-flash-image
      try {
        const imageResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: fullImagePrompt,
        })

        // Extract image from response
        for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            const imageData = part.inlineData.data
            const mimeType = part.inlineData.mimeType || 'image/png'
            heroImageUrl = `data:${mimeType};base64,${imageData}`
            console.log('Gemini hero image generated successfully')
            break
          }
        }
      } catch (geminiImageError: any) {
        console.log('Gemini image generation failed:', geminiImageError.message)
      }
      
      // Fallback to Pollinations.ai if Gemini fails
      if (!heroImageUrl) {
        console.log('Using Pollinations.ai fallback for hero image')
        const encodedPrompt = encodeURIComponent(fullImagePrompt)
        heroImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true`
      }
      
      // Add hero to spec
      spec.hero = {
        imageUrl: heroImageUrl,
        overlay: true
      }
      
      console.log('Hero image set:', heroImageUrl ? (heroImageUrl.startsWith('data:') ? 'Gemini base64 image' : heroImageUrl.substring(0, 50)) : 'none')
    } catch (imageError: any) {
      console.error('Image generation failed, continuing without hero:', imageError.message)
    }

    return NextResponse.json({ spec }, { status: 200 })
  } catch (error: any) {
    console.error('Error generating landing spec:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate landing spec' },
      { status: 500 }
    )
  }
}

function safeHex(x?: string, fallback = '#111827') {
  return /^#[0-9A-Fa-f]{6}$/.test(x ?? '') ? x! : fallback
}
