'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ArrowLeft, Printer, QrCode, MapPin as MapIcon } from 'lucide-react'
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

export default function MentorOfficeLocationPage() {
  const [officeLocation, setOfficeLocation] = useState<OfficeLocation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMentorOfficeLocation()
  }, [])

  const fetchMentorOfficeLocation = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/supervisor/office-location')

      if (response.status === 404) {
        // No office location configured yet
        setOfficeLocation(null)
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch office location')
      }

      const data = await response.json()
      setOfficeLocation(data.location)
    } catch (error) {
      console.error('Failed to fetch office location:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading office location...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/supervisor">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Office Location</h1>
          <p className="text-muted-foreground">Manage your office location and QR code</p>
        </div>
      </div>

      {!officeLocation ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <MapIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Office Location Setup</h3>
              <p className="text-muted-foreground mb-4">
                Office location setup will be completed in the mentor onboarding phase.
              </p>
              <p className="text-sm text-muted-foreground">
                Contact your administrator to configure your office location.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
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
        </div>
      )}
    </div>
  )
}