'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/header'
import { TagInput } from '@/components/tag-input'
import { ElevenLabsVoicePicker } from '@/components/elevenlabs-voice-picker'
import { getVoicesForTier, getLanguageLabel } from '@/lib/voices'
import { generateQRCode, getVisitorUrl } from '@/lib/qr'
import { Checkbox } from '@/components/ui/checkbox'
import { Play, Save, Upload, Loader2, Sparkles } from 'lucide-react'
import RenderLanding from '@/components/landing/RenderLanding'
import { LandingSpec } from '@/types/LandingSpec'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

function NewExhibitForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [venues, setVenues] = useState<any[]>([])
  const [qrPreview, setQrPreview] = useState<string | null>(null)
  const [agentId, setAgentId] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  // Form fields - Basics
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [tier, setTier] = useState<1 | 2 | 3>(1)
  const [bio, setBio] = useState('')
  const [venueId, setVenueId] = useState<string>('')

  // Form fields - Personality
  const [persona, setPersona] = useState('')
  const [doNots, setDoNots] = useState('')

  // Form fields - Content
  const [importantFacts, setImportantFacts] = useState<string[]>([])
  const [endScript, setEndScript] = useState('')

  // Form fields - Voice (ElevenLabs)
  const [voiceId, setVoiceId] = useState<string>('')
  const [voiceName, setVoiceName] = useState<string>('')
  const [voiceSettings, setVoiceSettings] = useState({
    stability: 0.55,
    similarity_boost: 0.65,
    style: 0.25,
    use_speaker_boost: true
  })

  // Form fields - QR
  const [qrShape, setQrShape] = useState<'square' | 'circle'>('square')

  // Form fields - Platform
  const [voicePlatform, setVoicePlatform] = useState<'elevenlabs' | 'vapi'>('elevenlabs')

  // Tier 3 specific
  const [canSendEmail, setCanSendEmail] = useState(false)
  const [canSendSms, setCanSendSms] = useState(false)
  const [canTakeOrders, setCanTakeOrders] = useState(false)
  const [canPostSocial, setCanPostSocial] = useState(false)
  const [functionManifest, setFunctionManifest] = useState('')

  // Landing page
  const [landingPrompt, setLandingPrompt] = useState('')
  const [landingSpec, setLandingSpec] = useState<LandingSpec | null>(null)
  const [generatingLanding, setGeneratingLanding] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        // Get tier from query param
        const tierParam = searchParams.get('tier')
        if (tierParam) {
          const tierNum = parseInt(tierParam)
          if (tierNum >= 1 && tierNum <= 3) {
            setTier(tierNum as 1 | 2 | 3)
          }
        }

        // Check for edit mode
        const idParam = searchParams.get('id')
        if (idParam) {
          setIsEditMode(true)
          setAgentId(idParam)
          await loadAgent(idParam)
        }

        // Get user and org
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('owner_user_id', user.id)
          .single()

        if (!org) {
          router.push('/onboarding')
          return
        }

        setOrganizationId(org.id)

        // Load venues
        const { data: venuesData } = await supabase
          .from('venues')
          .select('*')
          .eq('organization_id', org.id)

        if (venuesData) {
          setVenues(venuesData)
          if (venuesData.length > 0 && !venueId) {
            setVenueId(venuesData[0].id)
          }
        }

        setLoading(false)
      } catch (err) {
        console.error('Load error:', err)
        setError('Failed to load data')
        setLoading(false)
      }
    }
    loadData()
  }, [searchParams, router])

  async function loadAgent(id: string) {
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single()

    if (agentError || !agent) {
      setError('Agent not found')
      return
    }

    // Populate form fields
    setName(agent.name)
    setSlug(agent.slug)
    setTier(agent.tier)
    setBio(agent.bio || '')
    setVenueId(agent.venue_id || '')
    setPersona(agent.persona || '')
    setDoNots(agent.do_nots || '')
    setImportantFacts(agent.important_facts || [])
    setEndScript(agent.end_script || '')
    setVoiceId(agent.voice || '')
    setVoiceName(agent.voice_name || '')
    setVoiceSettings(agent.voice_settings || {
      stability: 0.55,
      similarity_boost: 0.65,
      style: 0.25,
      use_speaker_boost: true
    })
    setQrShape(agent.qr_shape || 'square')
    setVoicePlatform(agent.voice_platform || 'elevenlabs')
    setLandingSpec(agent.landing_spec || null)

    // Load capabilities if Tier 3
    if (agent.tier === 3) {
      const { data: capabilities } = await supabase
        .from('agent_capabilities')
        .select('*')
        .eq('agent_id', id)
        .single()

      if (capabilities) {
        setCanSendEmail(capabilities.can_send_email)
        setCanSendSms(capabilities.can_send_sms)
        setCanTakeOrders(capabilities.can_take_orders)
        setCanPostSocial(capabilities.can_post_social)
        setFunctionManifest(JSON.stringify(capabilities.function_manifest, null, 2))
      }
    }

    // Generate QR preview
    if (agent.public_id) {
      const url = getVisitorUrl(agent.public_id)
      const qr = await generateQRCode(url, agent.qr_shape)
      setQrPreview(qr)
    }
  }

  const validateManifest = (): boolean => {
    if (tier !== 3 || !functionManifest.trim()) return true
    try {
      JSON.parse(functionManifest)
      return true
    } catch (e) {
      return false
    }
  }

  const handleSave = async () => {
    setError(null)

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    if (!slug.trim()) {
      setError('Slug is required')
      return
    }

    if (tier === 3 && !validateManifest()) {
      setError('Function manifest must be valid JSON')
      return
    }

    setSaving(true)

    try {
      const agentData = {
        organization_id: organizationId,
        venue_id: venueId || null,
        name: name.trim(),
        slug: slug.trim(),
        tier,
        bio: bio.trim(),
        persona: persona.trim(),
        do_nots: doNots.trim(),
        important_facts: importantFacts,
        end_script: endScript.trim(),
        voice: voiceId,
        voice_name: voiceName,
        voice_settings: voiceSettings,
        qr_shape: qrShape,
        voice_platform: voicePlatform,
        status: 'draft',
      }

      let capabilitiesData = null
      if (tier === 3) {
        capabilitiesData = {
          can_send_email: canSendEmail,
          can_send_sms: canSendSms,
          can_take_orders: canTakeOrders,
          can_post_social: canPostSocial,
          function_manifest: functionManifest.trim() ? JSON.parse(functionManifest) : {},
        }
      }

      const response = await fetch('/api/agents/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agentId,
          agentData,
          capabilitiesData,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      // Generate QR preview
      if (result.agent.public_id) {
        const url = getVisitorUrl(result.agent.public_id)
        const qr = await generateQRCode(url, qrShape)
        setQrPreview(qr)
      }

      setAgentId(result.agent.id)
      setIsEditMode(true)

      // Show success feedback
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const [syncing, setSyncing] = useState(false)

  const handleTest = async () => {
    if (!agentId) {
      setError('Please save the agent first')
      return
    }

    setSyncing(true)
    setError(null)

    try {
      // Sync to the selected platform first
      const syncEndpoint = voicePlatform === 'vapi' 
        ? '/api/agents/sync-vapi' 
        : '/api/agents/sync-elevenlabs'

      const syncRes = await fetch(syncEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId })
      })

      if (!syncRes.ok) {
        const data = await syncRes.json()
        throw new Error(data.error || `Failed to sync with ${voicePlatform === 'vapi' ? 'Vapi' : 'ElevenLabs'}`)
      }

      // Redirect to the test page with the selected platform mode
      router.push(`/exhibits/${agentId}/test?mode=${voicePlatform}`)
    } catch (err: any) {
      setError(err.message || 'Failed to sync agent')
    } finally {
      setSyncing(false)
    }
  }

  const handlePublish = async () => {
    if (!agentId) {
      setError('Please save the agent first')
      return
    }

    setPublishing(true)
    setError(null)

    try {
      const response = await fetch('/api/agents/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      if (result.requiresBilling) {
        // First publish - redirect to billing
        router.push(`/billing/checkout?agentId=${agentId}`)
      } else {
        // Already paid, just published
        router.push(`/exhibits/${agentId}`)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to publish')
    } finally {
      setPublishing(false)
    }
  }

  const handleGenerateLanding = async () => {
    if (!landingPrompt.trim() || !name) {
      setError('Please enter a description and agent name first')
      return
    }

    setGeneratingLanding(true)
    setError(null)

    try {
      const response = await fetch('/api/landing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerPrompt: landingPrompt,
          agentName: name,
          defaults: {
            title: name,
          },
        }),
      })

      const result = await response.json()
      console.log('Landing generation result:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate landing page')
      }

      if (!result.spec) {
        throw new Error('No spec returned from API')
      }

      console.log('Setting landing spec:', result.spec)
      setLandingSpec(result.spec)
      setPreviewOpen(true)
    } catch (err: any) {
      console.error('Landing generation error:', err)
      setError(err.message || 'Failed to generate landing page')
    } finally {
      setGeneratingLanding(false)
    }
  }

  const handleSaveLanding = async () => {
    if (!agentId || !landingSpec) {
      setError('Please generate a landing page first')
      return
    }

    try {
      const { error } = await supabase
        .from('agents')
        .update({
          landing_spec: landingSpec,
          landing_last_generated_at: new Date().toISOString(),
        })
        .eq('id', agentId)

      if (error) throw error

      setError(null)
      setPreviewOpen(false)
    } catch (err: any) {
      setError(err.message || 'Failed to save landing page')
    }
  }

  const getTierName = (tier: number) => {
    const names = {
      1: 'Tier 1 - ElevenLabs',
      2: 'Tier 2 - ElevenLabs Pro',
      3: 'Tier 3 - Enterprise',
    }
    return names[tier as 1 | 2 | 3] || `Tier ${tier}`
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center py-8">Loading...</div>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {isEditMode ? 'Edit Exhibit' : 'Create New Exhibit'}
          </h1>
          <p className="text-muted-foreground">{getTierName(tier)}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
            <p className="font-medium">Error:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basics */}
            <Card>
              <CardHeader>
                <CardTitle>Basics</CardTitle>
                <CardDescription>Core information about your exhibit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Agent Name *</label>
                  <Input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (!isEditMode) {
                        setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
                      }
                    }}
                    placeholder="Einstein Tour Guide"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Exhibit Description (Bio) *</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Brief description of what this agent does..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Slug (URL-friendly) *</label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="einstein-tour-guide"
                    disabled={isEditMode}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {isEditMode ? 'Slug cannot be changed after creation' : 'Auto-generated from name'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tier</label>
                  <div className="flex items-center gap-2">
                    <Badge>{getTierName(tier)}</Badge>
                    <span className="text-sm text-muted-foreground">(locked from selection)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Venue</label>
                  <select
                    value={venueId}
                    onChange={(e) => setVenueId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">No venue selected</option>
                    {venues.map((venue) => (
                      <option key={venue.id} value={venue.id}>
                        {venue.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Personality */}
            <Card>
              <CardHeader>
                <CardTitle>Personality</CardTitle>
                <CardDescription>Define how your agent behaves</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Persona (Tone & Traits)</label>
                  <textarea
                    value={persona}
                    onChange={(e) => setPersona(e.target.value)}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="You are a knowledgeable and enthusiastic museum guide. You speak in a friendly, approachable tone..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Topics to Avoid</label>
                  <textarea
                    value={doNots}
                    onChange={(e) => setDoNots(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Do not discuss politics, religion, or controversial topics..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
                <CardDescription>Key information for your agent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Important Facts</label>
                  <TagInput
                    tags={importantFacts}
                    onChange={setImportantFacts}
                    placeholder="Type a fact and press Enter..."
                    maxTags={20}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Key facts the agent should know
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">How to End the Conversation</label>
                  <textarea
                    value={endScript}
                    onChange={(e) => setEndScript(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Thank you for visiting! Have a wonderful day..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Landing Page */}
            <Card>
              <CardHeader>
                <CardTitle>Landing Page</CardTitle>
                <CardDescription>
                  Describe your landing page and let AI generate it
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Describe your landing page
                  </label>
                  <textarea
                    value={landingPrompt}
                    onChange={(e) => setLandingPrompt(e.target.value)}
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Example: Large photo of the Champion Banyan Tree at the top, one sentence about its history, dark blue buttons, and a short bullet list of key facts..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Describe colors, layout, text, and images for your visitor landing page
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerateLanding}
                    disabled={generatingLanding || !landingPrompt.trim() || !name}
                    variant="outline"
                    className="flex-1"
                  >
                    {generatingLanding ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate with AI
                      </>
                    )}
                  </Button>

                  {landingSpec && (
                    <Button
                      onClick={() => setPreviewOpen(true)}
                      variant="secondary"
                    >
                      Preview
                    </Button>
                  )}
                </div>

                {landingSpec && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm font-medium text-green-800">
                      ✓ Landing page generated
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Last generated: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voice - ElevenLabs */}
            <Card>
              <CardHeader>
                <CardTitle>Voice</CardTitle>
                <CardDescription>
                  Select from 100+ ElevenLabs voices with multilingual support
                </CardDescription>
              </CardHeader>
              <CardContent>
                {voiceId && voiceName && (
                  <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-md">
                    <p className="text-sm font-medium">Selected: {voiceName}</p>
                    <p className="text-xs text-muted-foreground mt-1">Voice ID: {voiceId}</p>
                  </div>
                )}
                <ElevenLabsVoicePicker
                  selectedVoiceId={voiceId}
                  onVoiceSelect={(id, name, settings) => {
                    setVoiceId(id)
                    setVoiceName(name)
                    setVoiceSettings(settings)
                  }}
                />
              </CardContent>
            </Card>

            {/* Tier 3 Capabilities */}
            {tier === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Capabilities</CardTitle>
                  <CardDescription>Enable advanced functions for this agent</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email"
                      checked={canSendEmail}
                      onCheckedChange={(checked) => setCanSendEmail(checked === true)}
                    />
                    <label htmlFor="email" className="text-sm">
                      Send Email
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sms"
                      checked={canSendSms}
                      onCheckedChange={(checked) => setCanSendSms(checked === true)}
                    />
                    <label htmlFor="sms" className="text-sm">
                      Send SMS
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="orders"
                      checked={canTakeOrders}
                      onCheckedChange={(checked) => setCanTakeOrders(checked === true)}
                    />
                    <label htmlFor="orders" className="text-sm">
                      Take Orders
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="social"
                      checked={canPostSocial}
                      onCheckedChange={(checked) => setCanPostSocial(checked === true)}
                    />
                    <label htmlFor="social" className="text-sm">
                      Post to Social Media
                    </label>
                  </div>

                  <div className="pt-4">
                    <label className="block text-sm font-medium mb-1">Function Manifest (JSON)</label>
                    <textarea
                      value={functionManifest}
                      onChange={(e) => setFunctionManifest(e.target.value)}
                      className={`flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ${
                        functionManifest && !validateManifest() ? 'border-red-500' : ''
                      }`}
                      placeholder={`{\n  "functions": [\n    {\n      "name": "sendEmail",\n      "description": "Send an email",\n      "parameters": {}\n    }\n  ]\n}`}
                    />
                    {functionManifest && !validateManifest() && (
                      <p className="text-xs text-red-600 mt-1">Invalid JSON format</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* QR Options */}
            <Card>
              <CardHeader>
                <CardTitle>QR Code Options</CardTitle>
                <CardDescription>Customize your QR code appearance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <label className="block text-sm font-medium mb-2">Shape</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="qr-shape"
                        value="square"
                        checked={qrShape === 'square'}
                        onChange={(e) => setQrShape(e.target.value as 'square' | 'circle')}
                        className="h-4 w-4"
                      />
                      <span>Square</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="qr-shape"
                        value="circle"
                        checked={qrShape === 'circle'}
                        onChange={(e) => setQrShape(e.target.value as 'square' | 'circle')}
                        className="h-4 w-4"
                      />
                      <span>Circle</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Voice Platform */}
            <Card>
              <CardHeader>
                <CardTitle>Platform</CardTitle>
                <CardDescription>Choose which voice AI platform to use</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex rounded-lg border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setVoicePlatform('vapi')}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                      voicePlatform === 'vapi'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted'
                    }`}
                  >
                    Vapi
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoicePlatform('elevenlabs')}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                      voicePlatform === 'elevenlabs'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted'
                    }`}
                  >
                    ElevenLabs
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {voicePlatform === 'vapi' 
                    ? 'Vapi provides phone-quality voice conversations with low latency.'
                    : 'ElevenLabs offers premium voice quality with multilingual support.'}
                </p>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 sticky bottom-4 bg-background p-4 border rounded-lg shadow-lg">
              <Button
                onClick={handleSave}
                disabled={saving || !name || !slug}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>

              <Button
                onClick={handleTest}
                disabled={!agentId || syncing}
                variant="outline"
              >
                {syncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Test
                  </>
                )}
              </Button>

              <Button
                onClick={handlePublish}
                disabled={!agentId || publishing}
                variant="default"
              >
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Publish
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Sidebar - QR Preview */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>QR Code Preview</CardTitle>
                <CardDescription>Live preview of your exhibit QR code</CardDescription>
              </CardHeader>
              <CardContent>
                {qrPreview ? (
                  <div className="relative">
                    <img src={qrPreview} alt="QR Code" className="w-full rounded-lg" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
                        <p className="text-sm font-bold text-center">{name || 'Your Exhibit'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-sm text-muted-foreground text-center px-4">
                      QR code will appear here after saving
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Landing Page Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Landing Page Preview</DialogTitle>
            <DialogDescription>
              Preview how your landing page will look to visitors
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[600px] overflow-y-auto">
            {landingSpec ? (
              <RenderLanding
                spec={landingSpec}
                agentName={name}
                onTalkClick={() => {}}
                onScanAnotherClick={() => {}}
                isPreview={true}
              />
            ) : (
              <div className="p-8 text-center text-gray-500">
                No preview available
              </div>
            )}
          </div>
          <div className="p-4 border-t flex gap-2">
            <Button
              onClick={handleSaveLanding}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Landing Page
            </Button>
            <Button
              onClick={() => setPreviewOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function NewExhibitPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center py-8">Loading...</div>
        </main>
      </>
    }>
      <NewExhibitForm />
    </Suspense>
  )
}
