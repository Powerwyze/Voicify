'use client'

import { useEffect, useRef, useState } from 'react'
import Vapi from '@vapi-ai/web'
import { Button } from './ui/button'
import { Phone, PhoneOff, Loader2, Volume2 } from 'lucide-react'

interface VapiVisitorProps {
  config: {
    tier: number
    provider: string
    sessionToken: string
    vapiAssistantId?: string
    config: {
      name: string
      voice: string
      personality: string
      systemPrompt: string
      firstMessage: string
    }
  }
  onEnd: () => void
}

export function VapiVisitor({ config, onEnd }: VapiVisitorProps) {
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<string[]>([])
  const vapiRef = useRef<Vapi | null>(null)

  useEffect(() => {
    // Support all tiers with Vapi
    if (config.provider !== 'vapi') {
      setError('This agent provider is not supported')
      return
    }

    // Initialize Vapi instance
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPI_KEY || process.env.NEXT_PUBLIC_VAPI_API_KEY

    if (!publicKey) {
      setError('Voice service not configured')
      return
    }

    vapiRef.current = new Vapi(publicKey)

    // Set up event listeners
    vapiRef.current.on('call-start', () => {
      console.log('Call started')
      setCallStatus('connected')
      setError(null)
    })

    vapiRef.current.on('call-end', () => {
      console.log('Call ended')
      setCallStatus('disconnected')
    })

    vapiRef.current.on('error', (error: any) => {
      console.error('Vapi error:', error)
      setError(error.message || 'Call failed')
      setCallStatus('idle')
    })

    vapiRef.current.on('speech-start', () => {
      console.log('User started speaking')
    })

    vapiRef.current.on('speech-end', () => {
      console.log('User stopped speaking')
    })

    vapiRef.current.on('message', (message: any) => {
      console.log('Message:', message)
      if (message.type === 'transcript' && message.transcript) {
        setTranscript(prev => [...prev, `${message.role}: ${message.transcript}`])
      }
    })

    // Auto-start call
    startCall()

    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop()
      }
    }
  }, [])

  const startCall = async () => {
    if (!vapiRef.current) return

    setCallStatus('connecting')
    setError(null)

    try {
      // Use assistant ID if available (preferred method)
      if (config.vapiAssistantId) {
        await vapiRef.current.start(config.vapiAssistantId)
      } else {
        // Fallback: build assistant config inline
        const assistant: any = {
          name: config.config.name,
          firstMessage: config.config.firstMessage || `Hello! I'm ${config.config.name}. How can I help you today?`,
        }

        // Model configuration based on tier - All tiers use Gemini 3 Flash
        assistant.model = {
          provider: 'google',
          model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
          messages: [
            {
              role: 'system',
              content: config.config.systemPrompt || config.config.personality || 'You are a helpful assistant.'
            }
          ]
        }
        
        if (config.tier === 1) {
          // Tier 1: Standard voice setup
          assistant.voice = {
            provider: '11labs',
            voiceId: '21m00Tcm4TlvDq8ikWAM' // 11Labs Rachel voice
          }
          assistant.transcriber = {
            provider: 'deepgram' as const,
            model: 'nova-2',
            language: 'en-US'
          }
        }
        // Tier 2 & 3: Additional capabilities handled by Vapi

        await vapiRef.current.start(assistant)
      }
    } catch (err: any) {
      console.error('Failed to start call:', err)
      setError(err.message || 'Failed to start call')
      setCallStatus('idle')
    }
  }

  const endCall = () => {
    if (vapiRef.current) {
      vapiRef.current.stop()
      setCallStatus('idle')
    }
    onEnd()
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-6 border">
        <div className="text-center space-y-4">
          {/* Status Indicator */}
          <div className="flex items-center justify-center gap-3">
            {callStatus === 'connecting' && (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <span className="text-base font-medium">Connecting...</span>
              </>
            )}
            {callStatus === 'connected' && (
              <>
                <div className="relative">
                  <Volume2 className="h-6 w-6 text-green-600" />
                  <div className="absolute -inset-1 bg-green-500/20 rounded-full animate-ping" />
                </div>
                <span className="text-base font-medium text-green-600">Call Active</span>
              </>
            )}
            {callStatus === 'idle' && (
              <span className="text-sm text-muted-foreground">Ready</span>
            )}
            {callStatus === 'disconnected' && (
              <span className="text-sm text-muted-foreground">Call ended</span>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Call Controls */}
          <div className="pt-2">
            {callStatus === 'connected' ? (
              <Button
                onClick={endCall}
                size="lg"
                variant="destructive"
                className="w-full"
              >
                <PhoneOff className="h-5 w-5 mr-2" />
                End Call
              </Button>
            ) : callStatus === 'connecting' ? (
              <Button
                disabled
                size="lg"
                className="w-full"
              >
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Connecting...
              </Button>
            ) : (
              <Button
                onClick={onEnd}
                size="lg"
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            )}
          </div>

          {/* Instructions */}
          {callStatus === 'connected' && (
            <p className="text-xs text-muted-foreground">
              Speak naturally. {config.config.name} is listening and will respond.
            </p>
          )}
        </div>
      </div>

      {/* Transcript (optional, for debugging) */}
      {transcript.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-4 max-h-40 overflow-y-auto">
          <h4 className="text-sm font-medium mb-2">Transcript</h4>
          <div className="text-xs space-y-1 text-muted-foreground">
            {transcript.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
