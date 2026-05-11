import QRCode from 'qrcode'
import { OfficeLocation } from '@/types'

export class QRCodeService {
  /**
   * Generate QR code data URL for office location
   */
  static async generateQRCodeDataURL(officeLocation: OfficeLocation): Promise<string> {
    try {
      const qrData = JSON.stringify({
        type: 'attendance',
        locationId: officeLocation.id,
        locationName: officeLocation.name,
        latitude: officeLocation.latitude,
        longitude: officeLocation.longitude,
        radius: officeLocation.radius,
        timestamp: Date.now()
      })

      const dataURL = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      })

      return dataURL
    } catch (error) {
      console.error('Error generating QR code:', error)
      throw new Error('Failed to generate QR code')
    }
  }

  /**
   * Generate QR code data string for office location
   */
  static generateQRCodeData(officeLocation: OfficeLocation): string {
    return JSON.stringify({
      type: 'attendance',
      locationId: officeLocation.id,
      locationName: officeLocation.name,
      latitude: officeLocation.latitude,
      longitude: officeLocation.longitude,
      radius: officeLocation.radius,
      timestamp: Date.now()
    })
  }

  /**
   * Parse QR code data
   */
  static parseQRCodeData(qrData: string): any {
    try {
      return JSON.parse(qrData)
    } catch (error) {
      console.error('Error parsing QR code data:', error)
      throw new Error('Invalid QR code data')
    }
  }

  /**
   * Validate QR code data format
   */
  static validateQRCodeData(data: any): boolean {
    return (
      data &&
      data.type === 'attendance' &&
      data.locationId &&
      data.locationName &&
      typeof data.latitude === 'number' &&
      typeof data.longitude === 'number' &&
      typeof data.radius === 'number' &&
      data.timestamp
    )
  }

  /**
   * Generate QR code for download
   */
  static async generateDownloadableQRCode(officeLocation: OfficeLocation): Promise<Buffer> {
    try {
      const qrData = this.generateQRCodeData(officeLocation)
      const buffer = await QRCode.toBuffer(qrData, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      })

      return buffer
    } catch (error) {
      console.error('Error generating downloadable QR code:', error)
      throw new Error('Failed to generate downloadable QR code')
    }
  }
}
