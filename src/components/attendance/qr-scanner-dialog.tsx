"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  QrCode, 
  Camera, 
  MapPin, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  X
} from "lucide-react"
import { GeolocationService } from "@/lib/geolocation"
import { QRCodeService } from "@/lib/qr-code"

interface QRScannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (attendance: any) => void
}

export function QRScannerDialog({ open, onOpenChange, onSuccess }: QRScannerDialogProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'getting' | 'success' | 'error'>('idle')
  const [locationMessage, setLocationMessage] = useState('')
  const [qrData, setQrData] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      resetState()
    }
  }, [open])

  const resetState = () => {
    setIsScanning(false)
    setLocationStatus('idle')
    setLocationMessage('')
    setQrData('')
    setIsProcessing(false)
  }

  const getCurrentLocation = async () => {
    setLocationStatus('getting')
    setLocationMessage('Getting your location...')

    try {
      const location = await GeolocationService.getCurrentLocation()
      setLocationStatus('success')
      setLocationMessage(`Location acquired: ${GeolocationService.formatCoordinates(location.latitude, location.longitude)}`)
      return location
    } catch (error) {
      setLocationStatus('error')
      setLocationMessage(error instanceof Error ? error.message : 'Failed to get location')
      return null
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsScanning(true)
    setLocationMessage('Scanning QR code...')

    try {
      // Create a canvas to read the image
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Cannot create canvas context')
      }

      img.onload = async () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        // Get image data (in a real implementation, you'd use a QR code library here)
        // For now, we'll simulate QR code detection
        setTimeout(() => {
          // Simulate QR code data
          const simulatedQRData = JSON.stringify({
            type: 'attendance',
            locationId: 'demo-location-id',
            locationName: 'NYX Office',
            latitude: -1.2921,
            longitude: 36.8219,
            radius: 100,
            timestamp: Date.now()
          })
          
          setQrData(simulatedQRData)
          setIsScanning(false)
          setLocationMessage('QR code scanned successfully!')
        }, 2000)
      }

      img.src = URL.createObjectURL(file)
    } catch (error) {
      setIsScanning(false)
      setLocationMessage('Failed to scan QR code')
    }
  }

  const handleCheckIn = async () => {
    if (!qrData) {
      setLocationMessage('Please scan a QR code first')
      return
    }

    setIsProcessing(true)

    try {
      // Validate QR code data
      const parsedData = QRCodeService.parseQRCodeData(qrData)
      if (!QRCodeService.validateQRCodeData(parsedData)) {
        throw new Error('Invalid QR code format')
      }

      // Get current location
      const location = await getCurrentLocation()
      if (!location) {
        throw new Error('Failed to get location')
      }

      // Send check-in request
      const response = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrCodeData: qrData,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Check-in failed')
      }

      setLocationMessage(data.message)
      onSuccess(data.attendance)
      
      // Close dialog after successful check-in
      setTimeout(() => {
        onOpenChange(false)
      }, 2000)

    } catch (error) {
      setLocationMessage(error instanceof Error ? error.message : 'Check-in failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManualQRInput = () => {
    // For demo purposes, allow manual QR code input
    const demoQRData = JSON.stringify({
      type: 'attendance',
      locationId: 'demo-location-id',
      locationName: 'NYX Office',
      latitude: -1.2921,
      longitude: 36.8219,
      radius: 100,
      timestamp: Date.now()
    })
    setQrData(demoQRData)
    setLocationMessage('Demo QR code loaded')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Check In - QR Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code Scanner */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <QrCode className="h-8 w-8 text-muted-foreground" />
              </div>
              
              <div>
                <p className="text-sm font-medium">Scan QR Code</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload an image of the QR code or use demo data
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className="flex-1"
                >
                  {isScanning ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Camera className="h-4 w-4 mr-2" />
                  )}
                  Upload QR Code
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleManualQRInput}
                  disabled={isScanning}
                >
                  Demo
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Location Status */}
          {locationMessage && (
            <Alert className={locationStatus === 'error' ? 'border-destructive' : 
                             locationStatus === 'success' ? 'border-green-200' : ''}>
              <div className="flex items-center gap-2">
                {locationStatus === 'getting' && <Loader2 className="h-4 w-4 animate-spin" />}
                {locationStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                {locationStatus === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
                <AlertDescription className="text-sm">
                  {locationMessage}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* QR Data Display */}
          {qrData && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">QR Code Data</span>
              </div>
              <p className="text-xs text-muted-foreground break-all">
                {JSON.stringify(JSON.parse(qrData), null, 2)}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleCheckIn}
              disabled={!qrData || isProcessing || locationStatus === 'error'}
              className="flex-1"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Check In
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
