"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  MapPin, 
  QrCode, 
  Timer, 
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Archive
} from "lucide-react"
import { QRScannerDialog } from "@/components/attendance/qr-scanner-dialog"
import { ActiveSessionTimer } from "@/components/attendance/active-session-timer"
import { AttendanceHistory } from "@/components/attendance/attendance-history"
import { AttendanceStats } from "@/components/attendance/attendance-stats"

export default function AttendanceContent() {
  const [activeSession, setActiveSession] = useState<any>(null)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()

  useEffect(() => {
    checkActiveSession()
  }, [])

  const checkActiveSession = async () => {
    try {
      const response = await fetch('/api/attendance/active')
      const data = await response.json()
      
      if (data.hasActiveSession) {
        setActiveSession(data.activeSession)
      }
    } catch (error) {
      console.error('Error checking active session:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckInSuccess = (attendance: any) => {
    setActiveSession(attendance)
    setShowQRScanner(false)
  }

  const handleCheckOutSuccess = () => {
    setActiveSession(null)
  }

  if (loading) {
    return (
      <DashboardLayout title="Attendance Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Attendance Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Attendance Tracking</h2>
            <p className="text-muted-foreground">
              Track your internship attendance with QR code check-in/check-out
            </p>
          </div>
          {!activeSession && (
            <Button onClick={() => setShowQRScanner(true)} className="gap-2">
              <QrCode className="h-4 w-4" />
              Check In
            </Button>
          )}
        </div>

        {/* Active Session */}
        {activeSession ? (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-green-800">Active Session</CardTitle>
                </div>
                <Badge variant="default" className="bg-green-600">
                  Checked In
                </Badge>
              </div>
              <CardDescription>
                You are currently checked in at {activeSession.officeLocation.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{activeSession.officeLocation.address}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Check-in: {new Date(activeSession.checkInTime).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <ActiveSessionTimer 
                  checkInTime={activeSession.checkInTime}
                  onCheckOut={handleCheckOutSuccess}
                  attendanceId={activeSession.id}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <CardTitle>No Active Session</CardTitle>
              </div>
              <CardDescription>
                You are not currently checked in. Scan a QR code to start your attendance session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowQRScanner(true)} 
                className="w-full gap-2"
                size="lg"
              >
                <QrCode className="h-5 w-5" />
                Scan QR Code to Check In
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <AttendanceStats />

        {/* Attendance History */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AttendanceHistory />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quick Stats
              </CardTitle>
              <CardDescription>
                Your attendance performance overview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No attendance data available yet
              </div>
            </CardContent>
          </Card>
        </div>

        {/* QR Scanner Dialog */}
        <QRScannerDialog
          open={showQRScanner}
          onOpenChange={setShowQRScanner}
          onSuccess={handleCheckInSuccess}
        />
      </div>
    </DashboardLayout>
  )
}
