'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CreditCard } from 'lucide-react'
import { VapiVisitor } from '@/components/vapi-visitor'
import { ElevenLabsVisitor } from '@/components/elevenlabs-visitor'
import RenderLanding from '@/components/landing/RenderLanding'
import { LandingSpec } from '@/types/LandingSpec'

interface Agent {
  id: string
  name: string
  bio: string
  tier: number
  venue: {
    display_name: string
    kind: string
    background_image_url?: string
  }
  organization: {
    id: string
    name: string
  }
  supportedLanguages: string[]
  voice: string
  personality: string
  systemPrompt: string
  firstMessage: string
  landing_spec?: LandingSpec
}

interface PaywallInfo {
  paywallActive: boolean
  requiresPayment: boolean
  paywall?: {
    amount: number
    currency: string
    description: string
  }
}

export default function VisitorPage() {
  const params = useParams()
  const router = useRouter()
  const agentPublicId = params.agentPublicId as string

  const [agent, setAgent] = useState<Agent | null>(null)
  const [paywall, setPaywall] = useState<PaywallInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [talkActive, setTalkActive] = useState(false)
  const [sessionConfig, setSessionConfig] = useState<any>(null)
  const [visitorId, setVisitorId] = useState<string>('')
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    // Generate or retrieve visitor ID from localStorage
    let vid = localStorage.getItem('visitor_id')
    if (!vid) {
      vid = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('visitor_id', vid)
    }
    setVisitorId(vid)

    loadAgent()
  }, [agentPublicId])

  const loadAgent = async () => {
    try {
      setLoading(true)

      // Fetch agent data
      const agentRes = await fetch(`/api/visitor/agent?publicId=${agentPublicId}`)
      const agentData = await agentRes.json()

      if (!agentData.success) {
        throw new Error(agentData.error)
      }

      setAgent(agentData.agent)

      // Check paywall status
      const vid = localStorage.getItem('visitor_id')
      const paywallRes = await fetch(
        `/api/visitor/paywall?organizationId=${agentData.agent.organization.id}&visitorId=${vid}`
      )
      const paywallData = await paywallRes.json()

      if (paywallData.success) {
        setPaywall(paywallData)
      }
    } catch (error: any) {
      console.error('Error loading agent:', error)
      alert(error.message || 'Failed to load agent')
    } finally {
      setLoading(false)
    }
  }

  const handlePaywall = async () => {
    if (!agent || !paywall?.paywall) return

    setProcessingPayment(true)

    try {
      // Create Stripe checkout session for paywall
      const response = await fetch('/api/visitor/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: agent.organization.id,
          visitorId,
          amount: paywall.paywall.amount,
          currency: paywall.paywall.currency,
          description: paywall.paywall.description,
          returnUrl: window.location.href,
        }),
      })

      const data = await response.json()

      if (data.success && data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      alert(error.message || 'Payment failed')
    } finally {
      setProcessingPayment(false)
    }
  }

  const handleStartTalk = async () => {
    if (!agent) return

    try {
      // Request talk session
      const response = await fetch('/api/visitor/talk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          visitorId,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        if (response.status === 402) {
          // Payment required
          alert('Please complete payment to continue')
          return
        }
        throw new Error(data.error)
      }

      setSessionConfig(data)
      setTalkActive(true)
    } catch (error: any) {
      console.error('Talk error:', error)
      alert(error.message || 'Failed to start conversation')
    }
  }

  const handleEndTalk = () => {
    setTalkActive(false)
    setSessionConfig(null)
  }

  const handleScanAnother = () => {
    router.push('/scan-help')
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Agent not found
  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Agent Not Found</CardTitle>
            <CardDescription>
              The agent you're looking for doesn't exist or is not published.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Paywall-first: Show paywall screen if payment is required
  if (paywall?.requiresPayment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
        <Card className="max-w-md w-full border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-yellow-600" />
              Access Required
            </CardTitle>
            <CardDescription className="text-base">
              {paywall.paywall?.description ||
                `Pay once to access all exhibits from ${agent.organization.name}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-yellow-200">
              <p className="text-4xl font-bold text-gray-900">
                {paywall.paywall?.currency.toUpperCase()} $
                {((paywall.paywall?.amount || 0) / 100).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600 mt-2">One-time access fee</p>
              <p className="text-xs text-gray-500 mt-1">
                Valid until end of event window
              </p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handlePaywall}
                disabled={processingPayment}
                className="w-full"
                size="lg"
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Pay & Continue
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-gray-500">
                Secure payment powered by Stripe
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // After payment or no paywall: Show landing page or default UI
  // If agent has a custom landing_spec, render it
  if (agent.landing_spec && !talkActive) {
    return (
      <>
        <RenderLanding
          spec={agent.landing_spec}
          agentName={agent.name}
          onTalkClick={handleStartTalk}
          onScanAnotherClick={handleScanAnother}
          backgroundImage={agent.venue?.background_image_url}
        />

        {/* Talk Widget Overlay */}
        {talkActive && sessionConfig && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg">Conversation Active</CardTitle>
              </CardHeader>
              <CardContent>
                {sessionConfig.provider === 'elevenlabs' ? (
                  <ElevenLabsVisitor config={sessionConfig} onEnd={handleEndTalk} />
                ) : (
                  <VapiVisitor config={sessionConfig} onEnd={handleEndTalk} />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </>
    )
  }

  // Default landing page (if no custom landing_spec)
  const defaultSpec: LandingSpec = {
    version: 1,
    title: agent.name,
    subtitle: agent.bio || `Welcome! I'm here to help you.`,
    blocks: [
      {
        id: 'default-bio',
        type: 'paragraph',
        text: agent.bio || 'Tap below to start your guided conversation.',
      },
      {
        id: 'default-languages',
        type: 'bulletList',
        items: agent.supportedLanguages.map((lang) => `${lang} supported`),
      },
    ],
  }

  return (
    <>
      <RenderLanding
        spec={defaultSpec}
        agentName={agent.name}
        onTalkClick={handleStartTalk}
        onScanAnotherClick={handleScanAnother}
        backgroundImage={agent.venue?.background_image_url}
      />

      {/* Talk Widget Overlay */}
      {talkActive && sessionConfig && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg">Conversation Active</CardTitle>
            </CardHeader>
            <CardContent>
              {sessionConfig.provider === 'elevenlabs' ? (
                <ElevenLabsVisitor config={sessionConfig} onEnd={handleEndTalk} />
              ) : (
                <VapiVisitor config={sessionConfig} onEnd={handleEndTalk} />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
