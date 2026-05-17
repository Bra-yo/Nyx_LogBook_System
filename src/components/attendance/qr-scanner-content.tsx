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
  CameraOff,
  RefreshCw
} from "lucide-react"
import { GeolocationService } from "@/lib/geolocation"
import { QRCodeService } from "@/lib/qr-code"
import { useRouter, useSearchParams } from "next/navigation"

// Safe QR parser function
function parseQrPayload(raw: string) {
  const cleaned = raw.trim()

  try {
    const parsed = JSON.parse(cleaned)

    return {
      isJson: true,
      raw: cleaned,
      parsed,
      token:
        parsed.qrToken ||
        parsed.token ||
        parsed.officeToken ||
        parsed.qrCodeData ||
        cleaned,
    }
  } catch {
    return {
      isJson: false,
      raw: cleaned,
      parsed: null,
      token: cleaned,
    }
  }
}

interface QRScannerContentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (attendance: any) => void
}

export function QRScannerContent({ open, onOpenChange, onSuccess }: QRScannerContentProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'getting' | 'success' | 'error'>('idle')
  const [locationMessage, setLocationMessage] = useState('')
  const [qrData, setQrData] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null)
  const [cameraError, setCameraError] = useState('')
  const scannerInstanceRef = useRef<Html5Qrcode | null>(null)
  const scannerRef = useRef<HTMLDivElement>(null)
  const hasScannedRef = useRef(false)
  const isProcessingRef = useRef(false)
  const router = useRouter()
  const searchParams = useSearchParams()

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
    hasScannedRef.current = false
    isProcessingRef.current = false
    scannerInstanceRef.current = null
    stopScanner()
  }

  const startScanner = async () => {
    if (!scannerRef.current) return

    try {
      setIsScanning(true)
      setCameraError('')

      const html5QrCode = new Html5Qrcode('qr-reader')
      scannerInstanceRef.current = html5QrCode
      setScanner(html5QrCode)

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText: string, decodedResult: Html5QrcodeResult) => {
          if (hasScannedRef.current) return
          hasScannedRef.current = true

          setQrData(decodedText)
          setLocationStatus('getting')
          setLocationMessage('QR code scanned successfully.')

          await stopScanner(html5QrCode)
          await handleAutomaticCheckIn(decodedText)
        },
        (errorMessage: string) => {
          // Ignore scan errors while waiting for a valid QR code
        }
      )
    } catch (error) {
      setIsScanning(false)
      setCameraError(error instanceof Error ? error.message : 'Failed to access camera')
      setLocationMessage('Camera access denied or not available')
    }
  }

  const stopScanner = async (scannerInstance?: Html5Qrcode | null) => {
    const activeScanner = scannerInstance ?? scannerInstanceRef.current ?? scanner

    if (!activeScanner) {
      setIsScanning(false)
      setScanner(null)
      return
    }

    try {
      await activeScanner.stop()
      await activeScanner.clear()
    } catch (error) {
      // Ignore stop/clear errors
    }

    if (scannerInstanceRef.current === activeScanner) {
      scannerInstanceRef.current = null
    }

    setScanner(null)
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
      return location
    } catch (error) {
      setLocationStatus('error')
      setLocationMessage(
        error instanceof Error
          ? error.message
          : 'Could not get your location. Please try again.'
      )
      return null
    }
  }

  const handleAutomaticCheckIn = async (scannedQrData: string) => {
    if (isProcessingRef.current) return
    isProcessingRef.current = true

    setIsProcessing(true)
    setLocationStatus('getting')
    setLocationMessage('Getting your location...')

    try {
      if (!window.isSecureContext) {
        throw new Error('Location requires HTTPS. Please use the secure live website.')
      }

      const qrPayload = parseQrPayload(scannedQrData)
      setLocationMessage('Getting your location...')
      const location = await GeolocationService.getCurrentLocation()

      setLocationStatus('getting')
      setLocationMessage('Verifying attendance location...')

      const response = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrCodeData: qrPayload.token,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Check-in failed')
      }

      setLocationStatus('success')
      setLocationMessage(data.message || 'Check-in successful.')
      onSuccess(data.attendance)

      const redirectUrl = searchParams.get('redirect')
      setTimeout(() => {
        onOpenChange(false)
        if (redirectUrl) {
          router.push(redirectUrl)
        }
      }, 1500)
    } catch (error) {
      setLocationStatus('error')
      const errorMessage = error instanceof Error
        ? error.message
        : 'Could not get your location. Please try again.'
      setLocationMessage(errorMessage)
      isProcessingRef.current = false
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRetryScan = () => {
    resetState()
    startScanner()
  }

  const handleRetryLocation = async () => {
    if (!qrData) return
    setLocationStatus('getting')
    setLocationMessage('Getting your location...')
    await handleAutomaticCheckIn(qrData)
  }

  const handleCheckIn = async () => {
    if (!qrData) {
      setLocationMessage('Please scan a QR code first')
      return
    }
    await handleAutomaticCheckIn(qrData)
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
                      onClick={() => stopScanner()}
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
                {(() => {
                  const qrPayload = parseQrPayload(qrData)
                  return qrPayload.isJson
                    ? JSON.stringify(qrPayload.parsed, null, 2)
                    : qrPayload.raw
                })()}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>

            {qrData && locationStatus === 'error' ? (
              <>
                <Button
                  onClick={handleRetryLocation}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Location
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRetryScan}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Scan Again
                </Button>
              </>
            ) : (
              <Button
                onClick={handleCheckIn}
                disabled={!qrData || isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Check In
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
