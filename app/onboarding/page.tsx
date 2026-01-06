'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

// Common US timezones for easy selection
const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [checkingExisting, setCheckingExisting] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Organization fields
  const [orgName, setOrgName] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Venue fields
  const [venueKind, setVenueKind] = useState<'museum' | 'event'>('museum')
  const [venueName, setVenueName] = useState('')
  const [venueAddress, setVenueAddress] = useState('')
  const [venueTimezone, setVenueTimezone] = useState('America/New_York')

  const [organizationId, setOrganizationId] = useState<string | null>(null)

  // Check if user already has an organization
  useEffect(() => {
    async function checkExistingOrg() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/signin')
        return
      }

      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_user_id', user.id)
        .single()

      if (org) {
        // User already has an org, skip onboarding
        router.push('/exhibits')
        return
      }

      setCheckingExisting(false)
    }
    checkExistingOrg()
  }, [router])

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('onboarding_data')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.orgName) setOrgName(data.orgName)
        if (data.termsAccepted) setTermsAccepted(data.termsAccepted)
        if (data.organizationId) {
          setOrganizationId(data.organizationId)
          setStep(2)
        }
        if (data.venueKind) setVenueKind(data.venueKind)
        if (data.venueName) setVenueName(data.venueName)
        if (data.venueAddress) setVenueAddress(data.venueAddress)
        if (data.venueTimezone) setVenueTimezone(data.venueTimezone)
      } catch (e) {
        console.error('Failed to parse saved onboarding data')
      }
    }
  }, [])

  // Save to localStorage whenever fields change
  useEffect(() => {
    const data = {
      orgName,
      termsAccepted,
      organizationId,
      venueKind,
      venueName,
      venueAddress,
      venueTimezone,
    }
    localStorage.setItem('onboarding_data', JSON.stringify(data))
  }, [orgName, termsAccepted, organizationId, venueKind, venueName, venueAddress, venueTimezone])

  // Validation for step 1
  const isStep1Valid = orgName.trim().length > 0 && termsAccepted

  // Validation for step 2
  const isStep2Valid = venueName.trim().length > 0 && venueTimezone.trim().length > 0

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isStep1Valid) return

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/signin')
        return
      }

      const { data, error: createError } = await supabase
        .from('organizations')
        .insert({
          name: orgName.trim(),
          owner_user_id: user.id,
        })
        .select()
        .single()

      if (createError) {
        setError(createError.message)
        setLoading(false)
        return
      }

      if (data) {
        setOrganizationId(data.id)
        setStep(2)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    }
    setLoading(false)
  }

  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organizationId || !isStep2Valid) return

    setLoading(true)
    setError(null)

    try {
      const { error: createError } = await supabase
        .from('venues')
        .insert({
          organization_id: organizationId,
          kind: venueKind,
          display_name: venueName.trim(),
          address: venueAddress.trim() || null,
          timezone: venueTimezone,
        })

      if (createError) {
        setError(createError.message)
        setLoading(false)
        return
      }

      // Clear localStorage on successful completion
      localStorage.removeItem('onboarding_data')
      router.push('/exhibits')
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
      setLoading(false)
    }
  }

  if (checkingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-lg">
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading...
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {step} of 2
            </span>
          </div>
          <CardTitle>
            {step === 1 ? 'Welcome to Voicify It!' : 'Set up your venue'}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "Let's start by creating your organization"
              : 'Tell us about where your AI exhibits will live'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div>
                <label htmlFor="orgName" className="block text-sm font-medium mb-1">
                  Organization name
                </label>
                <Input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g., Acme Museums"
                  className={orgName.trim().length === 0 && orgName.length > 0 ? 'border-red-300' : ''}
                />
                {orgName.trim().length === 0 && orgName.length > 0 && (
                  <p className="text-xs text-red-600 mt-1">Organization name is required</p>
                )}
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                />
                <label
                  htmlFor="terms"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the{' '}
                  <a href="#" className="text-primary hover:underline" onClick={(e) => e.preventDefault()}>
                    terms and conditions
                  </a>
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={!isStep1Valid || loading}>
                {loading ? 'Creating...' : 'Continue'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCreateVenue} className="space-y-4">
              <div>
                <label htmlFor="venueKind" className="block text-sm font-medium mb-1">
                  What type of venue is this?
                </label>
                <select
                  id="venueKind"
                  value={venueKind}
                  onChange={(e) => setVenueKind(e.target.value as 'museum' | 'event')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="museum">Museum</option>
                  <option value="event">Event</option>
                </select>
              </div>

              <div>
                <label htmlFor="venueName" className="block text-sm font-medium mb-1">
                  Venue name
                </label>
                <Input
                  id="venueName"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g., Downtown Art Museum"
                  className={venueName.trim().length === 0 && venueName.length > 0 ? 'border-red-300' : ''}
                />
                {venueName.trim().length === 0 && venueName.length > 0 && (
                  <p className="text-xs text-red-600 mt-1">Venue name is required</p>
                )}
              </div>

              <div>
                <label htmlFor="venueAddress" className="block text-sm font-medium mb-1">
                  Address <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  id="venueAddress"
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  placeholder="123 Main St, City, State"
                />
              </div>

              <div>
                <label htmlFor="venueTimezone" className="block text-sm font-medium mb-1">
                  Timezone
                </label>
                <select
                  id="venueTimezone"
                  value={venueTimezone}
                  onChange={(e) => setVenueTimezone(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="w-1/3"
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={!isStep2Valid || loading}>
                  {loading ? 'Creating...' : 'Complete setup'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
