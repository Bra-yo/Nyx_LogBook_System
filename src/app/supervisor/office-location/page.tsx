'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ArrowLeft, MapPin as MapIcon, Printer, QrCode } from 'lucide-react'
import Link from 'next/link'

interface OfficeLocation {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  radius: number
  isActive: boolean
  qrCodeData: string
  mentorId: string | null
  mentor?: {
    user: {
      name: string
    }
  }
}

const initialFormState = {
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  radius: '500'
}

export default function MentorOfficeLocationPage() {
  const [officeLocation, setOfficeLocation] = useState<OfficeLocation | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formState, setFormState] = useState(initialFormState)

  useEffect(() => {
    fetchMentorOfficeLocation()
  }, [])

  const fetchMentorOfficeLocation = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/supervisor/office-location')

      if (!response.ok) {
        throw new Error('Failed to load office location')
      }

      const data = await response.json()
      if (data.location) {
        setOfficeLocation(data.location)
        setFormState({
          name: data.location.name,
          address: data.location.address,
          latitude: String(data.location.latitude),
          longitude: String(data.location.longitude),
          radius: String(data.location.radius)
        })
      } else {
        setOfficeLocation(null)
        setFormState(initialFormState)
      }
    } catch (error) {
      console.error('Failed to fetch office location:', error)
      toast.error('Unable to load your office location. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: keyof typeof formState, value: string) => {
    setFormState((current) => ({ ...current, [field]: value }))
  }

  const handleUseCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not available in this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateField('latitude', position.coords.latitude.toFixed(6))
        updateField('longitude', position.coords.longitude.toFixed(6))
        toast.success('Current location captured.')
      },
      () => {
        toast.error('Unable to read your device location. Check permissions.')
      },
      { enableHighAccuracy: true }
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formState.name.trim()) {
      toast.error('Office Name is required.')
      return
    }

    const payload = {
      name: formState.name.trim(),
      address: formState.address.trim(),
      latitude: Number(formState.latitude),
      longitude: Number(formState.longitude),
      radius: Number(formState.radius) || 500
    }

    if (Number.isNaN(payload.latitude) || Number.isNaN(payload.longitude)) {
      toast.error('Latitude and longitude must be numeric.')
      return
    }

    if (payload.radius < 20 || payload.radius > 10000) {
      toast.error('Radius must be between 20 and 10000 meters.')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/supervisor/office-location', {
        method: officeLocation ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || 'Unable to save office location.')
      }

      const data = await response.json()
      setOfficeLocation(data.location)
      toast.success('Office location saved successfully.')
    } catch (error) {
      console.error('Failed to save office location:', error)
      toast.error((error as Error).message || 'Failed to save office location.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[25rem]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading office location...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Office Location</h1>
          <p className="text-muted-foreground">Manage your office location and QR code.</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/supervisor">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{officeLocation ? 'Update your office location' : 'Set up your office location'}</CardTitle>
            <CardDescription>
              This location is used to generate your mentor attendance QR code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="office-name">Office Name</Label>
                  <Input
                    id="office-name"
                    value={formState.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="office-address">Address</Label>
                  <Textarea
                    id="office-address"
                    rows={3}
                    value={formState.address}
                    onChange={(event) => updateField('address', event.target.value)}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="0.000001"
                      value={formState.latitude}
                      onChange={(event) => updateField('latitude', event.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="0.000001"
                      value={formState.longitude}
                      onChange={(event) => updateField('longitude', event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="radius">Radius (meters)</Label>
                  <Input
                    id="radius"
                    type="number"
                    min={20}
                    max={10000}
                    value={formState.radius}
                    onChange={(event) => updateField('radius', event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button type="button" variant="secondary" onClick={handleUseCurrentLocation}>
                  <MapIcon className="mr-2 h-4 w-4" />
                  Use My Current Location
                </Button>
                <div className="flex flex-col gap-3 sm:flex-row">
                  {officeLocation ? (
                    <Button variant="outline" asChild>
                      <Link href="/supervisor/office-location/qr/print">
                        Print QR Code
                      </Link>
                    </Button>
                  ) : null}
                  <Button type="submit" disabled={saving}>
                    {officeLocation ? 'Update Office Location' : 'Save Office Location'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
        <div className="grid gap-6 md:grid-cols-2">
          {officeLocation ? (
            <>
              {/* Location Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapIcon className="h-5 w-5" />
                    Office Location Details
                  </CardTitle>
                  <CardDescription>
                    Current office location configuration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold">{officeLocation.name}</h4>
                    <p className="text-sm text-muted-foreground">{officeLocation.address}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Latitude:</span>
                      <div className="text-muted-foreground">{officeLocation.latitude}</div>
                    </div>
                    <div>
                      <span className="font-medium">Longitude:</span>
                      <div className="text-muted-foreground">{officeLocation.longitude}</div>
                    </div>
                    <div>
                      <span className="font-medium">Radius:</span>
                      <div className="text-muted-foreground">{officeLocation.radius} meters</div>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <div>
                        <Badge variant={officeLocation.isActive ? "default" : "secondary"}>
                          {officeLocation.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <h5 className="font-medium mb-2">QR Code Data:</h5>
                    <div className="bg-muted p-3 rounded text-xs font-mono break-all">
                      {officeLocation.qrCodeData}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    QR Code Actions
                  </CardTitle>
                  <CardDescription>
                    Print or manage your office QR code
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Print Attendance QR Code</h4>
                    <p className="text-sm text-blue-700 mb-4">
                      Print this QR code and place it at your office entrance for learners to scan during check-in.
                    </p>
                    <Button asChild className="w-full">
                      <Link href="/supervisor/office-location/qr/print">
                        <Printer className="h-4 w-4 mr-2" />
                        Print QR Code
                      </Link>
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>• Learners scan this QR code from the attendance page</p>
                    <p>• QR code is only valid within the configured GPS radius</p>
                    <p>• Print in high quality for better scanning</p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="md:col-span-2">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MapIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Office Location Set</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Complete the form above to set up your office location first.
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  Once configured, you'll be able to print your QR code here.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}