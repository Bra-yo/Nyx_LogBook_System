'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { MapPin, QrCode, Plus, Edit, Trash2, Download, Printer } from 'lucide-react'
import { BRANDING } from '@/lib/branding'
import { QRCodeService } from '@/lib/qr-code'
import dynamic from "next/dynamic"
import Link from "next/link"

const MapPicker = dynamic(() => import("@/components/map-picker"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] rounded-lg border flex items-center justify-center text-sm text-muted-foreground">
      Loading map...
    </div>
  ),
})

export default function AdminAttendanceSettingsPage() {
  const [officeLocations, setOfficeLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [showQRCode, setShowQRCode] = useState(false)
  const [qrCodeDataURL, setQrCodeDataURL] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    radiusMeters: '5000',
    qrToken: 'BGC_ATTENDANCE_TEST_QR_2026',
    isActive: true
  })

  useEffect(() => {
    fetchOfficeLocations()
  }, [])

  const fetchOfficeLocations = async () => {
    try {
      const response = await fetch('/api/admin/attendance/locations')
      if (response.ok) {
        const data = await response.json()
        setOfficeLocations(data.locations || [])
      } else {
        const text = await response.text()
        console.error('Failed to fetch office locations:', text)
        // Try to parse as JSON for error message
        try {
          const errorData = JSON.parse(text)
          console.error('Error details:', errorData)
        } catch {
          console.error('Non-JSON error response:', text)
        }
      }
    } catch (error) {
      console.error('Failed to fetch office locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateQRCode = async (location: any) => {
    try {
      const dataURL = await QRCodeService.generateQRCodeDataURL(location)
      setQrCodeDataURL(dataURL)
      setSelectedLocation(location)
      setShowQRCode(true)
    } catch (error) {
      console.error('Error generating QR code:', error)
      toast.error('Failed to generate QR code')
    }
  }

  const handleDownloadQRCode = async (location: any) => {
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
      toast.error('Failed to download QR code')
    }
  }

  const handleEditLocation = (location: any) => {
    setFormData({
      name: location.name,
      address: location.address,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      radiusMeters: location.radius.toString(),
      qrToken: location.qrCodeData,
      isActive: location.isActive
    })
    setShowCreateForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/admin/attendance/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          radius: parseFloat(formData.radiusMeters),
          qrCodeData: formData.qrToken || `${BRANDING.qrPrefix}_${Date.now()}`,
          isActive: formData.isActive
        })
      })

      if (response.ok) {
        toast.success('Office location created successfully')
        setShowCreateForm(false)
        setFormData({
          name: '',
          address: '',
          latitude: '',
          longitude: '',
          radiusMeters: '5000',
          qrToken: 'BGC_ATTENDANCE_TEST_QR_2026',
          isActive: true
        })
        fetchOfficeLocations()
      } else {
        const text = await response.text()
        console.error('Failed to create office location:', text)
        // Try to parse as JSON for error message
        try {
          const errorData = JSON.parse(text)
          if (errorData.error && errorData.error.includes('QR Code Data already exists')) {
            toast.error('This QR Code Data already belongs to an existing office location. Please edit the existing location or use a different QR Code Data.')
          } else {
            toast.error(errorData.error || 'Failed to create office location')
          }
        } catch {
          toast.error('Failed to create office location')
        }
      }
    } catch (error) {
      toast.error('Failed to create office location')
      console.error(error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading office locations...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Attendance Settings</h1>
        <p className="text-gray-600 mt-2">Manage office locations and QR configurations</p>
      </div>

      <div className="mb-6">
        <Button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="mb-4"
        >
          {showCreateForm ? 'Cancel' : 'Add New Office Location'}
        </Button>

        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Office Location</CardTitle>
              <CardDescription>
                Add a new office location for attendance tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-800 mb-2">⚠️ Important: QR Code Matching</h4>
                <p className="text-sm text-blue-700">
                  The QR code data saved here must exactly match the QR code scanned by students. 
                  For testing, use: <code className="bg-blue-100 px-2 py-1 rounded">BGC_ATTENDANCE_TEST_QR_2026</code>
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  Students will only be able to check in if the scanned QR value matches the qrCodeData field exactly.
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  The generated QR code encodes the QR Code Data exactly. Students can check in only when the scanned value matches this field.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Office Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Main Office"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="123 Main St, City, State"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                      placeholder="40.7128"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                      placeholder="-74.0060"
                      required
                    />
                  </div>
                </div>
                
                {/* Map Picker */}
                <div className="col-span-full">
                  <Label>Office Location Map</Label>
                  <MapPicker
                    latitude={formData.latitude ? parseFloat(formData.latitude) : undefined}
                    longitude={formData.longitude ? parseFloat(formData.longitude) : undefined}
                    onLocationChange={(lat, lng) => {
                      setFormData({
                        ...formData,
                        latitude: lat.toString(),
                        longitude: lng.toString()
                      })
                    }}
                    className="mt-2"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="radiusMeters">Radius (meters)</Label>
                    <Input
                      id="radiusMeters"
                      type="number"
                      value={formData.radiusMeters}
                      onChange={(e) => setFormData({...formData, radiusMeters: e.target.value})}
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="qrToken">QR Code Data *</Label>
                    <Input
                      id="qrToken"
                      value={formData.qrToken}
                      onChange={(e) => setFormData({...formData, qrToken: e.target.value})}
                      placeholder="BGC_ATTENDANCE_TEST_QR_2026"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Must exactly match the QR code students will scan
                    </p>
                  </div>
                </div>
                <Button type="submit">Create Office Location</Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Office Locations</CardTitle>
          <CardDescription>
            Current office locations configured for attendance tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {officeLocations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No office locations configured yet.</p>
              <p className="text-sm text-gray-500 mt-2">Create your first office location to enable attendance tracking.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {officeLocations.map((location) => (
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
                      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
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

                      <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="flex-1"
                        >
                          <Link href={`/admin/attendance/settings/${location.id}/print`}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print QR
                          </Link>
                        </Button>
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
                          onClick={() => handleEditLocation(location)}
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
          )}
        </CardContent>
      </Card>

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
                    className="w-full max-w-[20rem] h-auto"
                  />
                ) : (
                  <div className="w-full max-w-[20rem] h-auto bg-muted animate-pulse rounded-lg min-h-[20rem] flex items-center justify-center">
                    <span className="text-muted-foreground">Generating QR Code...</span>
                  </div>
                )}
              </div>

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
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                  <p className="text-xs font-medium text-yellow-800">QR Code Data (exact):</p>
                  <p className="text-xs text-yellow-700 font-mono break-all">{selectedLocation.qrCodeData}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 sm:flex-row">
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
  )
}
