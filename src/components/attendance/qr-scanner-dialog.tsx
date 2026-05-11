"use client"

import { useState, useRef, useEffect } from "react"
import { Html5Qrcode, Html5QrcodeResult } from "html5-qrcode"
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
  X,
  CameraOff
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
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null)
  const [cameraError, setCameraError] = useState('')
  const scannerRef = useRef<HTMLDivElement>(null)

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
    setCameraError('')
    stopScanner()
  }

  const startScanner = async () => {
    if (!scannerRef.current) return

    try {
      setIsScanning(true)
      setCameraError('')
      
      const html5QrCode = new Html5Qrcode("qr-reader")
      setScanner(html5QrCode)

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText: string, decodedResult: Html5QrcodeResult) => {
          // QR code successfully scanned
          setQrData(decodedText)
          setLocationMessage('QR code scanned successfully!')
          stopScanner()
        },
        (errorMessage: string) => {
          // Ignore scan errors (common during continuous scanning)
        }
      )

    } catch (error) {
      setIsScanning(false)
      setCameraError(error instanceof Error ? error.message : 'Failed to access camera')
      setLocationMessage('Camera access denied or not available')
    }
  }

  const stopScanner = () => {
    if (scanner) {
      scanner.stop().catch(() => {
        // Ignore stop errors
      })
      setScanner(null)
    }
    setIsScanning(false)
  }

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

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
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
            <div className="space-y-4">
              {!isScanning && !qrData && (
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <QrCode className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Scan QR Code</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Position QR code within camera view to scan
                    </p>
                  </div>
                  <Button
                    onClick={startScanner}
                    disabled={isScanning}
                    className="mt-4"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                </div>
              )}

              {isScanning && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Scanning...</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={stopScanner}
                    >
                      <CameraOff className="h-4 w-4 mr-1" />
                      Stop
                    </Button>
                  </div>
                </div>
              )}

              {/* Camera View */}
              <div 
                id="qr-reader" 
                ref={scannerRef}
                className="w-full max-w-sm mx-auto rounded-lg overflow-hidden bg-black"
                style={{ minHeight: '250px' }}
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
