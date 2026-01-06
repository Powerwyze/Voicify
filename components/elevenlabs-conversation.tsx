'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Conversation } from '@elevenlabs/client'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Volume2, Loader2, Phone, PhoneOff } from 'lucide-react'

type ConversationProps = {
  agentId: string
  onError?: (error: string) => void
  onStatusChange?: (status: 'idle' | 'connecting' | 'connected' | 'disconnected') => void
}

export function ElevenLabsConversation({ agentId, onError, onStatusChange }: ConversationProps) {
  const [transcript, setTranscript] = useState<string[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const conversationRef = useRef<any>(null)

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession().catch(() => {})
      }
    }
  }, [])

  const startConversation = useCallback(async () => {
    try {
      setStatus('connecting')
      onStatusChange?.('connecting')
      setTranscript([])

      // Request microphone permission
      console.log('Requesting microphone permission...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('Microphone permission granted, stream:', stream.id)

      // Close the stream - SDK will handle its own
      stream.getTracks().forEach(track => track.stop())

      // Start conversation directly with agentId (public agent)
      console.log('Starting ElevenLabs session with agentId:', agentId)
      
      const conversation = await Conversation.startSession({
        agentId: agentId,
        onConnect: () => {
          console.log('✓ ElevenLabs SDK: Connected!')
          setStatus('connected')
          onStatusChange?.('connected')
        },
        onDisconnect: () => {
          console.log('✓ ElevenLabs SDK: Disconnected')
          setStatus('disconnected')
          onStatusChange?.('disconnected')
          conversationRef.current = null
        },
        onMessage: (message: any) => {
          console.log('ElevenLabs SDK Message:', message)
          if (message.source === 'user') {
            setTranscript(prev => [...prev, `You: ${message.message}`])
          } else if (message.source === 'ai') {
            setTranscript(prev => [...prev, `Agent: ${message.message}`])
          }
        },
        onError: (error: any) => {
          console.error('ElevenLabs SDK Error:', error)
          const errorMsg = typeof error === 'string' ? error : error?.message || 'Unknown error'
          onError?.(errorMsg)
          setStatus('idle')
          onStatusChange?.('idle')
        },
        onModeChange: (mode: any) => {
          console.log('ElevenLabs SDK Mode change:', mode)
          setIsSpeaking(mode?.mode === 'speaking')
        },
      })

      conversationRef.current = conversation
      console.log('✓ Conversation session created, ID:', conversation.getId?.())
    } catch (error: any) {
      console.error('Failed to start conversation:', error)
      onError?.(error.message || 'Failed to start conversation')
      setStatus('idle')
      onStatusChange?.('idle')
    }
  }, [agentId, onError, onStatusChange])

  const stopConversation = useCallback(async () => {
    try {
      if (conversationRef.current) {
        await conversationRef.current.endSession()
        conversationRef.current = null
      }
      setStatus('disconnected')
      onStatusChange?.('disconnected')
    } catch (error: any) {
      console.error('Failed to stop conversation:', error)
    }
  }, [onStatusChange])

  const toggleMute = useCallback(() => {
    if (conversationRef.current) {
      if (isMuted) {
        conversationRef.current.setVolume?.({ volume: 1 })
      } else {
        conversationRef.current.setVolume?.({ volume: 0 })
      }
      setIsMuted(!isMuted)
    }
  }, [isMuted])

  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'

  return (
    <div className="space-y-4">
      {/* Connection Controls */}
      <div className="flex items-center gap-2">
        {!isConnected ? (
          <Button
            onClick={startConversation}
            disabled={isConnecting}
            className="flex-1"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Phone className="w-4 h-4 mr-2" />
                Start Conversation
              </>
            )}
          </Button>
        ) : (
          <>
            <Button
              onClick={stopConversation}
              variant="destructive"
              className="flex-1"
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              End Conversation
            </Button>
            <Button
              onClick={toggleMute}
              variant="outline"
              size="icon"
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          </>
        )}
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500 animate-pulse' : 
          isConnecting ? 'bg-yellow-500 animate-pulse' : 
          'bg-gray-400'
        }`} />
        <span className="text-muted-foreground">
          {isConnected ? 'Connected - Speak now' : 
           isConnecting ? 'Connecting...' : 
           'Not connected'}
        </span>
        {isConnected && isSpeaking && (
          <div className="flex items-center gap-1 text-blue-500">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>Agent speaking...</span>
          </div>
        )}
      </div>

      {/* Transcript */}
      {transcript.length > 0 && (
        <div className="border rounded-lg p-3 max-h-48 overflow-y-auto bg-muted/50">
          <div className="text-xs font-medium mb-2 text-muted-foreground">Transcript</div>
          <div className="space-y-1 text-sm">
            {transcript.map((line, i) => (
              <p key={i} className={line.startsWith('You:') ? 'text-blue-600' : 'text-green-600'}>
                {line}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="text-xs text-muted-foreground">
        Agent ID: {agentId}
      </div>
    </div>
  )
}
