import { GeolocationData, OfficeLocation } from '@/types'

export class GeolocationService {
  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371000 // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in meters
  }

  /**
   * Convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Verify if user is within the allowed radius of office location
   */
  static verifyLocation(
    userLocation: GeolocationData,
    officeLocation: OfficeLocation
  ): { isValid: boolean; distance: number; message: string } {
    const distance = this.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      officeLocation.latitude,
      officeLocation.longitude
    )

    const isValid = distance <= officeLocation.radius
    const message = isValid
      ? `Location verified. You are ${Math.round(distance)}m from ${officeLocation.name}`
      : `You are too far from ${officeLocation.name}. Distance: ${Math.round(distance)}m (Max allowed: ${officeLocation.radius}m)`

    return { isValid, distance, message }
  }

  /**
   * Get current user location
   */
  static getCurrentLocation(): Promise<GeolocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          })
        },
        (error) => {
          let message = 'Unable to retrieve your location'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location permission denied. Please enable location access.'
              break
            case error.POSITION_UNAVAILABLE:
              message = 'Location information is unavailable.'
              break
            case error.TIMEOUT:
              message = 'Location request timed out.'
              break
          }
          reject(new Error(message))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }

  /**
   * Watch user location changes
   */
  static watchLocation(
    callback: (location: GeolocationData) => void,
    errorCallback?: (error: Error) => void
  ): number {
    if (!navigator.geolocation) {
      if (errorCallback) {
        errorCallback(new Error('Geolocation is not supported by this browser'))
      }
      return -1
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        })
      },
      (error) => {
        let message = 'Unable to retrieve your location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable location access.'
            break
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            message = 'Location request timed out.'
            break
        }
        if (errorCallback) {
          errorCallback(new Error(message))
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  /**
   * Stop watching location changes
   */
  static stopWatchingLocation(watchId: number): void {
    if (watchId !== -1 && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId)
    }
  }

  /**
   * Format coordinates for display
   */
  static formatCoordinates(latitude: number, longitude: number): string {
    return `${latitude.toFixed(6)}°, ${longitude.toFixed(6)}°`
  }

  /**
   * Check if geolocation is available
   */
  static isGeolocationAvailable(): boolean {
    return 'geolocation' in navigator
  }
}
