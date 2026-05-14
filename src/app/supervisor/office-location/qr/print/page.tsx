'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, Download } from 'lucide-react'
import Link from 'next/link'
import { PrintableQRCodeCard } from '@/components/attendance/printable-qr-card'

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

export default function MentorQRPrintPage() {
  const router = useRouter()
  const [officeLocation, setOfficeLocation] = useState<OfficeLocation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadHandler, setDownloadHandler] = useState<(() => void) | null>(null)

  useEffect(() => {
    fetchMentorOfficeLocation()
  }, [])

  const fetchMentorOfficeLocation = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/supervisor/office-location')

      if (response.status === 404) {
        setError('No office location has been configured yet. Please set up your office location first.')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch office location')
      }

      const data = await response.json()
      setOfficeLocation(data.location)
    } catch (error) {
      console.error('Failed to fetch office location:', error)
      setError('Failed to load office location')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    if (downloadHandler) {
      downloadHandler()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading office location...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Mentor Office QR Code</h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <p className="text-yellow-800">{error}</p>
          </div>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/supervisor">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!officeLocation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Mentor Office QR Code</h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <p className="text-blue-800">
              Office location setup will be completed in the mentor onboarding phase.
            </p>
          </div>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/supervisor">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Hidden in print */}
      <div className="no-print bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/supervisor">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Mentor Office QR Code</h1>
                <p className="text-sm text-gray-600">Print or download this QR code for learners to check in</p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <Button onClick={handleDownload} disabled={!downloadHandler}>
              <Download className="h-4 w-4 mr-2" />
              Download QR PNG
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print QR Code
            </Button>
          </div>
        </div>
      </div>

      {/* QR Code Content */}
      <div className="flex items-center justify-center py-8 px-6">
        <PrintableQRCodeCard
          officeName={officeLocation.name}
          address={officeLocation.address}
          qrCodeData={officeLocation.qrCodeData}
          radius={officeLocation.radius}
          latitude={officeLocation.latitude}
          longitude={officeLocation.longitude}
          mentorName={officeLocation.mentor?.user.name}
          onDownloadReady={setDownloadHandler}
          showActions={false}
        />
      </div>
    </div>
  )
}