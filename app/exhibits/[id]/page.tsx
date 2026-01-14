'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { generateQRCode } from '@/lib/qr'
import { Download, RefreshCw, Upload, XCircle, CheckCircle2, Clock } from 'lucide-react'

export default function ExhibitDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [agent, setAgent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrShape, setQrShape] = useState<'square' | 'circle'>('square')
  const [regenerating, setRegenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    fetchAgent()
  }, [params.id])

  useEffect(() => {
    if (agent) {
      generateQR()
    }
  }, [agent, qrShape])

  const fetchAgent = async () => {
    const { data } = await supabase
      .from('agents')
      .select('*, venues(display_name), organizations(name)')
      .eq('id', params.id)
      .single()

    if (data) {
      setAgent(data)
    }
    setLoading(false)
  }

  const generateQR = async () => {
    if (!agent) return

    const url = `${window.location.origin}/visitor/${agent.slug}`
    const qr = await generateQRCode(url, qrShape)
    setQrCode(qr)
  }

  const handleRegenerateQR = async () => {
    setRegenerating(true)
    await generateQR()
    setTimeout(() => setRegenerating(false), 500)
  }

  const handleDownloadQR = () => {
    if (!qrCode || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = 400
    canvas.height = 460

    // Draw background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw QR code
    const img = new Image()
    img.onload = () => {
      if (qrShape === 'circle') {
        // Circular mask
        ctx.save()
        ctx.beginPath()
        ctx.arc(200, 200, 180, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(img, 20, 20, 360, 360)
        ctx.restore()
      } else {
        // Square
        ctx.drawImage(img, 0, 0, 400, 400)
      }

      // Draw agent name at bottom
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 24px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(agent.name, 200, 440)

      // Download
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${agent.slug}-qr-code.png`
        a.click()
        URL.revokeObjectURL(url)
      })
    }
    img.src = qrCode
  }

  const handlePublishToggle = async () => {
    if (!agent) return

    setPublishing(true)

    try {
      // If unpublishing, just update the status directly
      if (agent.status === 'published') {
        const { error } = await supabase
          .from('agents')
          .update({ status: 'draft' })
          .eq('id', params.id)

        if (error) throw error
        setAgent({ ...agent, status: 'draft' })
        setPublishing(false)
        return
      }

      // If publishing, use the API endpoint to handle sync and billing
      const response = await fetch('/api/agents/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: params.id })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to publish')
      }

      // Successfully published - agent and landing page are now live!
      setAgent({ ...agent, ...result.agent })
      alert('Agent published successfully! Your landing page is now live and accessible to visitors.')
    } catch (error: any) {
      console.error('Publish error:', error)
      alert(`Failed to publish: ${error.message}`)
    } finally {
      setPublishing(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this exhibit?')) return

    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', params.id)

    if (!error) {
      router.push('/exhibits')
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-5xl">
          <p>Loading...</p>
        </main>
      </>
    )
  }

  if (!agent) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-5xl">
          <p>Agent not found</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{agent.name}</h1>
            <p className="text-muted-foreground mt-1">
              /{agent.slug} • {agent.venues?.display_name}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant={agent.status === 'published' ? 'default' : 'secondary'}>
              {agent.status}
            </Badge>
            <Badge variant="outline">Tier {agent.tier}</Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>Agent settings and behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Bio</h4>
                  <p className="text-sm text-muted-foreground">{agent.bio || 'Not set'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Personality</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {agent.personality || 'Not set'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Voice</h4>
                  <p className="text-sm text-muted-foreground">{agent.voice || 'Not set'}</p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => router.push(`/exhibits/new?id=${params.id}`)}
                >
                  Edit Configuration
                </Button>
              </CardContent>
            </Card>

            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Status Timeline</CardTitle>
                <CardDescription>Publishing history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(agent.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {agent.first_published_at && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Upload className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">First Published</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(agent.first_published_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      agent.status === 'published' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {agent.status === 'published' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Current Status</p>
                      <p className="text-xs text-muted-foreground capitalize">{agent.status}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code */}
            <Card>
              <CardHeader>
                <CardTitle>QR Code</CardTitle>
                <CardDescription>Visitor access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {qrCode && (
                  <div className="relative">
                    <img
                      src={qrCode}
                      alt="QR Code"
                      className={`w-full ${qrShape === 'circle' ? 'rounded-full' : 'rounded-lg'}`}
                      style={qrShape === 'circle' ? { clipPath: 'circle(45%)' } : {}}
                    />
                  </div>
                )}

                {/* Shape Toggle */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={qrShape === 'square' ? 'default' : 'outline'}
                    onClick={() => setQrShape('square')}
                    className="flex-1"
                  >
                    Square
                  </Button>
                  <Button
                    size="sm"
                    variant={qrShape === 'circle' ? 'default' : 'outline'}
                    onClick={() => setQrShape('circle')}
                    className="flex-1"
                  >
                    Circle
                  </Button>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleDownloadQR}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PNG
                  </Button>
                  <Button
                    onClick={handleRegenerateQR}
                    variant="outline"
                    className="w-full"
                    disabled={regenerating}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
                    Regenerate
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  {window.location.origin}/visitor/{agent.slug}
                </p>
              </CardContent>
            </Card>

            {/* Publishing */}
            <Card>
              <CardHeader>
                <CardTitle>Publishing</CardTitle>
                <CardDescription>Control availability</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push(`/exhibits/${params.id}/test`)}
                >
                  Test Agent
                </Button>
                {agent.status !== 'published' ? (
                  <Button
                    className="w-full"
                    onClick={handlePublishToggle}
                    disabled={publishing}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {publishing ? 'Publishing...' : 'Publish Agent'}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={handlePublishToggle}
                    disabled={publishing}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {publishing ? 'Unpublishing...' : 'Unpublish'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Danger Zone */}
        <Card className="mt-6 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>Permanent actions that cannot be undone</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Exhibit
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Hidden canvas for QR download */}
      <canvas ref={canvasRef} className="hidden" />
    </>
  )
}
