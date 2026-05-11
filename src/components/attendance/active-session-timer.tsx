"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Timer, 
  LogOut, 
  MapPin, 
  Loader2, 
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { GeolocationService } from "@/lib/geolocation"

interface ActiveSessionTimerProps {
  checkInTime: string
  onCheckOut: () => void
  attendanceId: string
}

export function ActiveSessionTimer({ checkInTime, onCheckOut, attendanceId }: ActiveSessionTimerProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'getting' | 'success' | 'error'>('idle')
  const [locationMessage, setLocationMessage] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const checkIn = new Date(checkInTime).getTime()
      const elapsed = Math.floor((now - checkIn) / 1000)
      setElapsedTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [checkInTime])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const handleCheckOut = async () => {
    setIsCheckingOut(true)
    setLocationStatus('getting')
    setLocationMessage('Getting your location for check-out...')

    try {
      // Get current location
      const location = await GeolocationService.getCurrentLocation()
      setLocationStatus('success')
      setLocationMessage('Location acquired. Processing check-out...')

      // Send check-out request
      const response = await fetch('/api/attendance/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attendanceId,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Check-out failed')
      }

      setLocationMessage(data.message)
      
      // Update UI after successful check-out
      setTimeout(() => {
        onCheckOut()
      }, 1500)

    } catch (error) {
      setLocationStatus('error')
      setLocationMessage(error instanceof Error ? error.message : 'Check-out failed')
    } finally {
      setIsCheckingOut(false)
    }
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Timer Display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-semibold text-blue-800">
                {formatTime(elapsedTime)}
              </span>
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              Active
            </Badge>
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

          {/* Check Out Button */}
          <Button
            onClick={handleCheckOut}
            disabled={isCheckingOut}
            className="w-full gap-2"
            variant="destructive"
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                Check Out
              </>
            )}
          </Button>

          {/* Additional Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>Location verification required</span>
            </div>
            <span>Session ID: {attendanceId.slice(0, 8)}...</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
