import React, { useState, useEffect, useRef } from 'react'
import { QRCodeService } from '@/lib/qr-code'

type PrintableQRCodeCardProps = {
  officeName: string
  address?: string | null
  qrCodeData: string
  radius?: number | null
  latitude?: number | null
  longitude?: number | null
  mentorName?: string | null
  showActions?: boolean
  onDownloadReady?: (download: () => void) => void
}

export function PrintableQRCodeCard({
  officeName,
  address,
  qrCodeData,
  radius,
  latitude,
  longitude,
  mentorName,
  showActions = false,
  onDownloadReady
}: PrintableQRCodeCardProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const qrImageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    // Generate QR code data URL using existing service
    const generateQR = async () => {
      try {
        const dataURL = await QRCodeService.generateQRCodeDataURL({
          id: '',
          name: officeName,
          address: address || '',
          latitude: latitude || 0,
          longitude: longitude || 0,
          radius: radius || 100,
          isActive: true,
          qrCodeData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        setQrCodeUrl(dataURL)
      } catch (error) {
        console.error('Failed to generate QR code:', error)
      }
    }

    generateQR()
  }, [officeName, address, qrCodeData, latitude, longitude, radius])

  // Provide download functionality to parent
  useEffect(() => {
    if (onDownloadReady && qrCodeUrl) {
      const handleDownload = () => {
        // Create canvas from image and download
        const img = qrImageRef.current
        if (!img || !img.complete) return

        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.drawImage(img, 0, 0)
        const pngDataUrl = canvas.toDataURL('image/png')

        // Clean filename: attendance-qr-{officeName}.png
        const cleanedName = officeName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
        const filename = `attendance-qr-${cleanedName}.png`

        // Create download link
        const link = document.createElement('a')
        link.href = pngDataUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      onDownloadReady(handleDownload)
    }
  }, [qrCodeUrl, onDownloadReady])

  return (
    <div className="print-card max-w-md mx-auto bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">NYX LogBook</h1>
        <h2 className="text-lg font-semibold text-gray-700">NYX QUANT SYSTEMS LTD.</h2>
      </div>

      {/* Office Info */}
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{officeName}</h3>
        {mentorName && (
          <p className="text-sm text-gray-600 mb-1">Mentor: {mentorName}</p>
        )}
        {address && (
          <p className="text-sm text-gray-600">{address}</p>
        )}
      </div>

      {/* QR Code */}
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-white border-2 border-gray-300 rounded-lg">
          {qrCodeUrl ? (
            <img
              ref={qrImageRef}
              src={qrCodeUrl}
              alt="QR Code"
              className="w-64 h-64"
            />
          ) : (
            <div className="w-64 h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
              <span className="text-gray-400">Generating QR...</span>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-4 text-center">
        <p className="text-sm font-medium text-gray-900 mb-2">
          Learners should scan this QR code from the attendance page to check in.
        </p>
        <p className="text-xs text-gray-600">
          This QR code is only valid within the configured office GPS radius.
        </p>
      </div>

      {/* QR Code Data Display */}
      <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
        <p className="text-xs font-medium text-gray-700 mb-1">QR Code Data:</p>
        <p className="text-xs font-mono text-gray-600 break-all">{qrCodeData}</p>
      </div>

      {/* Actions (only shown when showActions is true) */}
      {showActions && (
        <div className="no-print flex gap-2 mt-4">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
          >
            Print QR Code
          </button>
        </div>
      )}
    </div>
  )
}