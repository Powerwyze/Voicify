'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Upload, Loader2, Save, ImageIcon } from 'lucide-react'

interface OrganizationData {
  id: string
  name: string
  owner_user_id: string
}

interface VenueData {
  id: string
  display_name: string
  kind: string
  background_image_url?: string
}

export default function SettingsPage() {
  const [organization, setOrganization] = useState<OrganizationData | null>(null)
  const [venue, setVenue] = useState<VenueData | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Form state
  const [organizationName, setOrganizationName] = useState('')
  const [venueName, setVenueName] = useState('')
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserEmail(user.email || '')

      // Get organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_user_id', user.id)
        .single()

      if (orgError) throw orgError

      setOrganization(orgData)
      setOrganizationName(orgData.name)

      // Get venue
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select('*')
        .eq('organization_id', orgData.id)
        .limit(1)
        .single()

      if (!venueError && venueData) {
        setVenue(venueData)
        setVenueName(venueData.display_name)
        setBackgroundImageUrl(venueData.background_image_url || null)
        setImagePreview(venueData.background_image_url || null)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadImage = async () => {
    if (!imageFile || !venue) return

    try {
      setUploading(true)

      const formData = new FormData()
      formData.append('file', imageFile)
      formData.append('venueId', venue.id)

      const response = await fetch('/api/settings/upload-venue-image', {
        method: 'POST',
        body: formData,
        credentials: 'include' // Include cookies for authentication
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload image')
      }

      setBackgroundImageUrl(result.imageUrl)
      setImagePreview(result.imageUrl)
      setImageFile(null)

      alert('Venue background image uploaded successfully!')
      fetchData() // Refresh data
    } catch (error: any) {
      console.error('Error uploading image:', error)
      alert(error.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!organization) return

    try {
      setSaving(true)

      const response = await fetch('/api/settings/update-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizationName,
          venueName
        }),
        credentials: 'include' // Include cookies for authentication
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to save settings')
      }

      alert('Settings saved successfully!')
      fetchData() // Refresh data
    } catch (error: any) {
      console.error('Error saving settings:', error)
      alert(error.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your organization profile and venue settings
          </p>
        </div>

        <div className="space-y-6">
          {/* Organization Details */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Update your organization name and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userEmail}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Your account email cannot be changed here
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Enter organization name"
                />
              </div>
            </CardContent>
          </Card>

          {/* Venue Settings */}
          {venue && (
            <Card>
              <CardHeader>
                <CardTitle>Venue Settings</CardTitle>
                <CardDescription>
                  Configure your {venue.kind} venue and landing page background
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="venue-name">Venue Name</Label>
                  <Input
                    id="venue-name"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="Enter venue name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Landing Page Background Image</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    This image will be used as the background for all agent landing pages in this venue
                  </p>

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-dashed border-muted mb-3">
                      <img
                        src={imagePreview}
                        alt="Venue background preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {!imagePreview && (
                    <div className="flex items-center justify-center w-full h-48 rounded-lg border-2 border-dashed border-muted mb-3">
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">No background image set</p>
                      </div>
                    </div>
                  )}

                  {/* File Input */}
                  <div className="flex gap-3">
                    <Input
                      id="venue-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleUploadImage}
                      disabled={!imageFile || uploading}
                      variant="secondary"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
