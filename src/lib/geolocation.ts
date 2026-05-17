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
    if (!navigator.geolocation) {
      return Promise.reject(new Error('Geolocation is not supported by this browser.'))
    }

    if (!window.isSecureContext) {
      return Promise.reject(
        new Error('Location requires HTTPS. Please use the secure live website.')
      )
    }

    return this.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 60000,
    }).catch((error: GeolocationPositionError | Error) => {
      if (
        'code' in error &&
        error.code === error.TIMEOUT
      ) {
        return this.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 120000,
        })
      }

      throw error
    }).catch((error: GeolocationPositionError | Error) => {
      throw new Error(this.formatPositionError(error))
    })
  }

  private static getCurrentPosition(
    options: PositionOptions
  ): Promise<GeolocationData> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          })
        },
        (error) => reject(error),
        options
      )
    })
  }

  private static formatPositionError(
    error: GeolocationPositionError | Error
  ): string {
    if ('code' in error) {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          return 'Location permission was denied. Please allow location access for this site.'
        case error.POSITION_UNAVAILABLE:
          return 'Your location is currently unavailable. Please turn on GPS and try again.'
        case error.TIMEOUT:
          return 'Location request timed out. Please move to an open area or try again.'
        default:
          return 'Could not get your location. Please try again.'
      }
    }

    return error.message || 'Could not get your location. Please try again.'
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
