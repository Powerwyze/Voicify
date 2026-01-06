'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Mic, MicOff, Volume2, MessageSquare, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type LogEntry = {
  timestamp: string
  type: 'info' | 'success' | 'error' | 'warning'
  message: string
  details?: any
}

export default function TestAgentPage() {
  // State
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [voiceId, setVoiceId] = useState('21m00Tcm4TlvDq8ikWAM') // Default voice (Rachel)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [apiStatus, setApiStatus] = useState({
    elevenlabs: 'unknown',
    gemini: 'unknown'
  })
  const [testText, setTestText] = useState('Hello! This is a test of the ElevenLabs voice synthesis system.')

  // Refs
  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // Add log entry
  const addLog = (type: LogEntry['type'], message: string, details?: any) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details
    }
    setLogs(prev => [...prev, entry])
    console.log(`[${entry.timestamp}] ${type.toUpperCase()}: ${message}`, details || '')
  }

  // Test API keys on mount
  useEffect(() => {
    testAPIKeys()
  }, [])

  const testAPIKeys = async () => {
    addLog('info', 'Testing API connectivity...')

    // Test Gemini
    try {
      addLog('info', 'Testing Gemini API...')
      const geminiRes = await fetch('/api/chat/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'test' }]
        })
      })

      if (geminiRes.ok) {
        setApiStatus(prev => ({ ...prev, gemini: 'connected' }))
        addLog('success', 'Gemini API connected successfully')
      } else {
        const error = await geminiRes.text()
        setApiStatus(prev => ({ ...prev, gemini: 'error' }))
        addLog('error', 'Gemini API connection failed', error)
      }
    } catch (error: any) {
      setApiStatus(prev => ({ ...prev, gemini: 'error' }))
      addLog('error', 'Gemini API test failed', error.message)
    }

    // Test ElevenLabs
    try {
      addLog('info', 'Testing ElevenLabs API...')
      const elevenlabsRes = await fetch('/api/tts/elevenlabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: voiceId,
          text: 'test'
        })
      })

      if (elevenlabsRes.ok) {
        setApiStatus(prev => ({ ...prev, elevenlabs: 'connected' }))
        addLog('success', 'ElevenLabs API connected successfully')
      } else {
        const error = await elevenlabsRes.text()
        setApiStatus(prev => ({ ...prev, elevenlabs: 'error' }))
        addLog('error', 'ElevenLabs API connection failed', error)
      }
    } catch (error: any) {
      setApiStatus(prev => ({ ...prev, elevenlabs: 'error' }))
      addLog('error', 'ElevenLabs API test failed', error.message)
    }
  }

  const startListening = () => {
    addLog('info', 'Initializing speech recognition...')

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      addLog('error', 'Speech recognition not supported in this browser')
      alert('Speech recognition not supported in this browser. Please use Chrome or Edge.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      addLog('success', 'Speech recognition started - speak now!')
      setIsListening(true)
    }

    recognition.onresult = async (event: any) => {
      const userText = event.results[0][0].transcript
      const confidence = event.results[0][0].confidence
      setTranscript(userText)
      addLog('success', `Recognized speech (${Math.round(confidence * 100)}% confidence): "${userText}"`)

      // Get AI response
      addLog('info', 'Sending message to Gemini...')
      const aiResponse = await getAIResponse(userText)
      if (aiResponse) {
        setResponse(aiResponse)
        addLog('success', `AI response received: "${aiResponse.substring(0, 50)}..."`)
        await speakText(aiResponse)
      }
    }

    recognition.onerror = (event: any) => {
      addLog('error', `Speech recognition error: ${event.error}`, event)
      setIsListening(false)
    }

    recognition.onend = () => {
      addLog('info', 'Speech recognition ended')
      setIsListening(false)
    }

    recognition.start()
    recognitionRef.current = recognition
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      addLog('info', 'Stopping speech recognition...')
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  const getAIResponse = async (userText: string) => {
    try {
      addLog('info', 'Requesting AI response...', { userText })

      const res = await fetch('/api/chat/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a helpful museum guide assistant. Keep responses brief and engaging, under 3 sentences.' },
            { role: 'user', content: userText }
          ]
        })
      })

      if (!res.ok) {
        const errorText = await res.text()
        addLog('error', 'Gemini API request failed', { status: res.status, error: errorText })
        return null
      }

      const data = await res.json()
      addLog('success', 'AI response received successfully')
      return data.message
    } catch (error: any) {
      addLog('error', 'Error getting AI response', error.message)
      return null
    }
  }

  const speakText = async (text: string) => {
    try {
      setIsPlaying(true)
      addLog('info', 'Starting text-to-speech synthesis...', { text, voiceId })

      // Initialize audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 16000 })
        addLog('info', 'Audio context initialized')
      }

      // Get TTS audio from ElevenLabs
      addLog('info', 'Requesting audio from ElevenLabs...')
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

      if (!res.ok) {
        const errorText = await res.text()
        addLog('error', 'ElevenLabs API request failed', { status: res.status, error: errorText })
        setIsPlaying(false)
        return
      }

      addLog('success', 'Audio data received from ElevenLabs')
      const audioData = await res.arrayBuffer()
      addLog('info', `Audio buffer size: ${audioData.byteLength} bytes`)

      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData)
      addLog('success', `Audio decoded successfully - Duration: ${audioBuffer.duration.toFixed(2)}s`)

      // Play audio
      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContextRef.current.destination)
      source.onended = () => {
        addLog('success', 'Audio playback completed')
        setIsPlaying(false)
      }
      source.start()
      addLog('info', 'Audio playback started')
    } catch (error: any) {
      addLog('error', 'Error during speech synthesis', error.message)
      setIsPlaying(false)
    }
  }

  const testVoice = async () => {
    addLog('info', '=== Starting voice test ===')
    await speakText(testText)
  }

  const clearLogs = () => {
    setLogs([])
    addLog('info', 'Logs cleared')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500">Connected</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
      default:
        return <MessageSquare className="h-4 w-4 text-blue-500 flex-shrink-0" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Agent Test Console</h1>
          <p className="text-muted-foreground">Test ElevenLabs voice agents with full debugging</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            {/* API Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  API Status
                </CardTitle>
                <CardDescription>Real-time API connection status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Gemini</span>
                  {getStatusBadge(apiStatus.gemini)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">ElevenLabs</span>
                  {getStatusBadge(apiStatus.elevenlabs)}
                </div>
                <Button onClick={testAPIKeys} variant="outline" className="w-full" size="sm">
                  <Loader2 className="h-4 w-4 mr-2" />
                  Retest APIs
                </Button>
              </CardContent>
            </Card>

            {/* Voice Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Voice Configuration</CardTitle>
                <CardDescription>Configure the ElevenLabs voice</CardDescription>
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

                <div>
                  <label className="block text-sm font-medium mb-2">Test Text</label>
                  <Input
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    placeholder="Enter text to test"
                  />
                </div>

                <Button onClick={testVoice} disabled={isPlaying} className="w-full">
                  <Volume2 className="h-4 w-4 mr-2" />
                  {isPlaying ? 'Playing...' : 'Test Voice'}
                </Button>
              </CardContent>
            </Card>

            {/* Voice Conversation */}
            <Card>
              <CardHeader>
                <CardTitle>Voice Conversation</CardTitle>
                <CardDescription>Talk to the AI agent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={isListening ? stopListening : startListening}
                  variant={isListening ? 'destructive' : 'default'}
                  className="w-full"
                  disabled={isPlaying}
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

                {transcript && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                      <p className="text-sm font-medium text-blue-900">You said:</p>
                      <p className="text-sm text-blue-800">{transcript}</p>
                    </CardContent>
                  </Card>
                )}

                {response && (
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-4">
                      <p className="text-sm font-medium text-green-900">AI Response:</p>
                      <p className="text-sm text-green-800">{response}</p>
                    </CardContent>
                  </Card>
                )}

                {isPlaying && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Playing audio...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Debug Logs */}
          <div className="space-y-6">
            <Card className="h-[800px] flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Debug Console</CardTitle>
                    <CardDescription>Real-time system logs and debugging</CardDescription>
                  </div>
                  <Button onClick={clearLogs} variant="outline" size="sm">
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto bg-slate-950 text-slate-50 rounded-lg p-4 font-mono text-xs">
                  {logs.length === 0 ? (
                    <p className="text-slate-400">No logs yet. Start testing to see debug output...</p>
                  ) : (
                    <div className="space-y-2">
                      {logs.map((log, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-slate-500 flex-shrink-0">[{log.timestamp}]</span>
                          {getLogIcon(log.type)}
                          <div className="flex-1 min-w-0">
                            <span className={
                              log.type === 'error' ? 'text-red-400' :
                              log.type === 'success' ? 'text-green-400' :
                              log.type === 'warning' ? 'text-yellow-400' :
                              'text-slate-300'
                            }>
                              {log.message}
                            </span>
                            {log.details && (
                              <pre className="text-slate-500 mt-1 text-xs overflow-x-auto">
                                {typeof log.details === 'string'
                                  ? log.details
                                  : JSON.stringify(log.details, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
