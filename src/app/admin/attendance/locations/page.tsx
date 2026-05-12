"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MapPin, 
  QrCode, 
  Plus, 
  Edit, 
  Trash2, 
  Download,
  Shield,
  Activity
} from "lucide-react"
import { QRCodeService } from "@/lib/qr-code"

interface OfficeLocation {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  radius: number
  isActive: boolean
  qrCodeData: string
  createdAt: Date
  updatedAt: Date
}

export default function OfficeLocationsPage() {
  const [locations, setLocations] = useState<OfficeLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<OfficeLocation | null>(null)
  const [showQRCode, setShowQRCode] = useState(false)
  const [qrCodeDataURL, setQrCodeDataURL] = useState('')

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/attendance/locations')
      if (response.ok) {
        const data = await response.json()
        setLocations(data.locations || [])
      } else {
        const text = await response.text()
        console.error('Failed to fetch locations:', text)
        // Try to parse as JSON for error message
        try {
          const errorData = JSON.parse(text)
          console.error('Error details:', errorData)
        } catch {
          console.error('Non-JSON error response:', text)
        }
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateQRCode = async (location: OfficeLocation) => {
    try {
      const dataURL = await QRCodeService.generateQRCodeDataURL(location)
      setQrCodeDataURL(dataURL)
      setSelectedLocation(location)
      setShowQRCode(true)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const handleDownloadQRCode = async (location: OfficeLocation) => {
    try {
      const buffer = await QRCodeService.generateDownloadableQRCode(location)
      const uint8Array = new Uint8Array(buffer)
      const blob = new Blob([uint8Array], { type: 'image/png' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${location.name.replace(/\s+/g, '_')}_QR_Code.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading QR code:', error)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Office Locations">
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Office Locations">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Office Locations</h2>
            <p className="text-muted-foreground">
              Manage office locations and generate QR codes for attendance tracking
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Location
          </Button>
        </div>

        {/* Locations Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {locations.map((location) => (
            <Card key={location.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{location.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={location.isActive ? "default" : "secondary"}>
                      {location.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGenerateQRCode(location)}
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>{location.address}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Location Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Latitude:</span>
                      <div className="text-muted-foreground">{location.latitude}</div>
                    </div>
                    <div>
                      <span className="font-medium">Longitude:</span>
                      <div className="text-muted-foreground">{location.longitude}</div>
                    </div>
                    <div>
                      <span className="font-medium">Radius:</span>
                      <div className="text-muted-foreground">{location.radius}m</div>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <div className="text-muted-foreground">
                        <Badge variant={location.isActive ? "default" : "secondary"}>
                          {location.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateQRCode(location)}
                      className="flex-1"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      View QR Code
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadQRCode(location)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* QR Code Modal */}
        {showQRCode && selectedLocation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  QR Code - {selectedLocation.name}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQRCode(false)}
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                {/* QR Code Display */}
                <div className="flex justify-center p-4 bg-white rounded-lg border">
                  {qrCodeDataURL ? (
                    <img 
                      src={qrCodeDataURL} 
                      alt="QR Code" 
                      className="w-64 h-64"
                    />
                  ) : (
                    <div className="w-64 h-64 bg-muted animate-pulse rounded-lg"></div>
                  )}
                </div>

                {/* Location Info */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">{selectedLocation.name}</span>
                    </div>
                    <div className="text-muted-foreground">{selectedLocation.address}</div>
                    <div className="text-xs text-muted-foreground">
                      Coordinates: {selectedLocation.latitude}, {selectedLocation.longitude}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Radius: {selectedLocation.radius} meters
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadQRCode(selectedLocation)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </Button>
                  <Button
                    onClick={() => setShowQRCode(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
