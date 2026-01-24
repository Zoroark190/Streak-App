import { useState, useCallback } from 'react'
import { DEV_BYPASS_LOCATION, UNI_COORDS } from '../lib/firebase'

export interface GeolocationResult {
  latitude: number
  longitude: number
  accuracy: number
}

export type GeolocationErrorType = 'permission_denied' | 'position_unavailable' | 'timeout' | 'not_supported'

export interface GeolocationState {
  loading: boolean
  error: GeolocationErrorType | null
  getPosition: () => Promise<GeolocationResult>
}

export function useGeolocation(): GeolocationState {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<GeolocationErrorType | null>(null)

  const getPosition = useCallback(async (): Promise<GeolocationResult> => {
    setError(null)

    // Dev bypass mode
    if (DEV_BYPASS_LOCATION) {
      console.log('[DEV MODE] Bypassing geolocation - using university coordinates')
      return {
        latitude: UNI_COORDS.latitude,
        longitude: UNI_COORDS.longitude,
        accuracy: 10,
      }
    }

    if (!navigator.geolocation) {
      setError('not_supported')
      throw new Error('Geolocation not supported')
    }

    setLoading(true)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        })
      })

      const result: GeolocationResult = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }

      setLoading(false)
      return result
    } catch (err) {
      setLoading(false)

      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('permission_denied')
            break
          case err.POSITION_UNAVAILABLE:
            setError('position_unavailable')
            break
          case err.TIMEOUT:
            setError('timeout')
            break
        }
      }

      throw err
    }
  }, [])

  return { loading, error, getPosition }
}
