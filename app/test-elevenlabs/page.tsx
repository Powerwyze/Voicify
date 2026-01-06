'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Mic, MicOff, Volume2 } from 'lucide-react'

export default function TestElevenLabsPage() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [voiceId, setVoiceId] = useState('21m00Tcm4TlvDq8ikWAM') // Default voice (Rachel)

  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = async (event: any) => {
      const userText = event.results[0][0].transcript
      setTranscript(userText)

      // Get AI response
      const aiResponse = await getAIResponse(userText)
      if (aiResponse) {
        setResponse(aiResponse)
        await speakText(aiResponse)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  const getAIResponse = async (userText: string) => {
    try {
      const res = await fetch('/api/chat/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a helpful museum guide assistant. Keep responses brief and engaging.' },
            { role: 'user', content: userText }
          ]
        })
      })

      const data = await res.json()
      return data.message
    } catch (error) {
      console.error('Error getting AI response:', error)
      return null
    }
  }

  const speakText = async (text: string) => {
    try {
      setIsPlaying(true)

      // Initialize audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 16000 })
      }

      // Get TTS audio from ElevenLabs
      const res = await fetch('/api/tts/elevenlabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: voiceId,
          text: text,
          settings: {
            stability: 0.55,
            similarity_boost: 0.65,
            style: 0.25,
            use_speaker_boost: true
          }
        })
      })

      const audioData = await res.arrayBuffer()
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData)

      // Play audio
      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContextRef.current.destination)
      source.onended = () => setIsPlaying(false)
      source.start()
    } catch (error) {
      console.error('Error playing audio:', error)
      setIsPlaying(false)
    }
  }

  const testVoice = async () => {
    await speakText('Hello! I am testing the ElevenLabs voice synthesis. How does this sound?')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>ElevenLabs Test Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Voice ID</label>
              <Input
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                placeholder="Enter ElevenLabs voice ID"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default: 21m00Tcm4TlvDq8ikWAM (Rachel)
              </p>
            </div>

            <Button onClick={testVoice} disabled={isPlaying} className="w-full">
              <Volume2 className="h-4 w-4 mr-2" />
              {isPlaying ? 'Playing...' : 'Test Voice'}
            </Button>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Voice Conversation</h3>
              <Button
                onClick={isListening ? stopListening : startListening}
                variant={isListening ? 'destructive' : 'default'}
                className="w-full"
              >
                {isListening ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Start Listening
                  </>
                )}
              </Button>
            </div>

            {transcript && (
              <Card className="bg-blue-50">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium">You said:</p>
                  <p className="text-sm">{transcript}</p>
                </CardContent>
              </Card>
            )}

            {response && (
              <Card className="bg-green-50">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium">AI Response:</p>
                  <p className="text-sm">{response}</p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">API Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>ElevenLabs API:</span>
              <span className="font-mono text-xs">server-configured</span>
            </div>
            <div className="flex justify-between">
              <span>Gemini API:</span>
              <span className="font-mono text-xs">server-configured</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
