import { useState, useEffect } from 'react'
import { useGeolocation, type GeolocationErrorType } from '../hooks/useGeolocation'
import { calculateDistance } from '../lib/geo'
import { UNI_COORDS, ALLOWED_RADIUS_METERS, DEV_BYPASS_LOCATION } from '../lib/firebase'
import { createSession, closeSession, saveSession } from '../lib/firestore'
import { calculateSignOutEndTime, calculateDurationHours, type Session } from '../lib/calculations'
import { now } from '../lib/time'
import { ErrorDisplay } from './ErrorDisplay'

interface CheckInCardProps {
  openSession: Session | null
  isJames: boolean
}

type ErrorState = {
  type: 'outside_radius'
  distanceMeters: number
  accuracyMeters: number
} | {
  type: 'geolocation_error'
  geoError: GeolocationErrorType
} | null

export function CheckInCard({ openSession, isJames }: CheckInCardProps) {
  const { loading: geoLoading, getPosition } = useGeolocation()
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<ErrorState>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const loading = geoLoading || actionLoading
  const isSignedIn = openSession !== null

  useEffect(() => {
    if (!openSession) {
      setElapsedSeconds(0)
      return
    }

    const updateElapsed = () => {
      const elapsed = Math.floor((Date.now() - openSession.startTime.getTime()) / 1000)
      setElapsedSeconds(elapsed)
    }

    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)

    return () => clearInterval(interval)
  }, [openSession])

  const formatElapsedTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const [lastAction, setLastAction] = useState<'signIn' | 'save' | 'signOut' | null>(null)

  const handleSignIn = async () => {
    setError(null)
    setActionLoading(true)
    setLastAction('signIn')

    try {
      const position = await getPosition()
      const distance = calculateDistance(
        position.latitude,
        position.longitude,
        UNI_COORDS.latitude,
        UNI_COORDS.longitude
      )

      if (distance > ALLOWED_RADIUS_METERS) {
        setError({
          type: 'outside_radius',
          distanceMeters: distance,
          accuracyMeters: position.accuracy,
        })
        setActionLoading(false)
        return
      }

      const verification = {
        method: 'geolocation',
        distanceMeters: distance,
        withinRadius: true,
        accuracyMeters: position.accuracy,
      }

      await createSession(now().toJSDate(), verification)
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        let geoError: GeolocationErrorType = 'position_unavailable'
        if (err.code === err.PERMISSION_DENIED) geoError = 'permission_denied'
        if (err.code === err.TIMEOUT) geoError = 'timeout'
        setError({ type: 'geolocation_error', geoError })
      } else {
        console.error('Sign-in failed:', err)
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleSave = async () => {
    if (!openSession) return
    setError(null)
    setActionLoading(true)
    setLastAction('save')

    try {
      const position = await getPosition()
      const distance = calculateDistance(
        position.latitude,
        position.longitude,
        UNI_COORDS.latitude,
        UNI_COORDS.longitude
      )

      if (distance > ALLOWED_RADIUS_METERS) {
        setError({
          type: 'outside_radius',
          distanceMeters: distance,
          accuracyMeters: position.accuracy,
        })
        setActionLoading(false)
        return
      }

      await saveSession(openSession.id, now().toJSDate())
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        let geoError: GeolocationErrorType = 'position_unavailable'
        if (err.code === err.PERMISSION_DENIED) geoError = 'permission_denied'
        if (err.code === err.TIMEOUT) geoError = 'timeout'
        setError({ type: 'geolocation_error', geoError })
      } else {
        console.error('Save failed:', err)
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleSignOut = async () => {
    if (!openSession) return
    setError(null)
    setActionLoading(true)
    setLastAction('signOut')

    try {
      const position = await getPosition()
      const distance = calculateDistance(
        position.latitude,
        position.longitude,
        UNI_COORDS.latitude,
        UNI_COORDS.longitude
      )

      if (distance > ALLOWED_RADIUS_METERS) {
        setError({
          type: 'outside_radius',
          distanceMeters: distance,
          accuracyMeters: position.accuracy,
        })
        setActionLoading(false)
        return
      }

      const endTime = calculateSignOutEndTime(openSession)
      const duration = calculateDurationHours(openSession.startTime, endTime)
      await closeSession(openSession.id, endTime, duration)
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        let geoError: GeolocationErrorType = 'position_unavailable'
        if (err.code === err.PERMISSION_DENIED) geoError = 'permission_denied'
        if (err.code === err.TIMEOUT) geoError = 'timeout'
        setError({ type: 'geolocation_error', geoError })
      } else {
        console.error('Sign-out failed:', err)
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleEnd = async () => {
    if (!openSession) return
    setActionLoading(true)

    try {
      let endTime: Date
      let duration: number

      if (openSession.savedTime) {
        const savedDuration = calculateDurationHours(openSession.startTime, openSession.savedTime)
        duration = Math.max(savedDuration, 2)
        endTime = new Date(openSession.startTime.getTime() + duration * 60 * 60 * 1000)
      } else {
        duration = 2
        endTime = new Date(openSession.startTime.getTime() + 2 * 60 * 60 * 1000)
      }

      await closeSession(openSession.id, endTime, duration)
    } catch (err) {
      console.error('End session failed:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    if (lastAction === 'signIn') handleSignIn()
    else if (lastAction === 'save') handleSave()
    else if (lastAction === 'signOut') handleSignOut()
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {DEV_BYPASS_LOCATION && (
        <div className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded mb-3 text-center">
          DEV MODE: Location bypass active
        </div>
      )}

      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {isSignedIn ? 'Currently at University' : 'University Check-In'}
        </h2>

        {!isSignedIn ? (
          <button
            onClick={handleSignIn}
            disabled={loading || !isJames}
            className="w-full py-4 px-8 rounded-lg text-white font-bold text-xl transition-colors disabled:opacity-50 bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                Signing In...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        ) : (
          <>
            <button
              onClick={handleSave}
              disabled={loading || !isJames}
              className="w-full py-4 px-8 rounded-lg text-white font-bold text-xl transition-colors disabled:opacity-50 bg-blue-600 hover:bg-blue-700"
            >
              {loading && lastAction === 'save' ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                  Saving...
                </span>
              ) : (
                'Save'
              )}
            </button>

            <p className="text-2xl font-medium text-gray-700 mt-3 tabular-nums">
              {formatElapsedTime(elapsedSeconds)}
            </p>

            {openSession?.savedTime && (
              <p className="text-sm text-green-600 mt-1">
                Last saved: {openSession.savedTime.toLocaleTimeString()}
              </p>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSignOut}
                disabled={loading || !isJames}
                className="flex-1 py-2 px-4 rounded-lg text-white font-semibold transition-colors disabled:opacity-50 bg-red-600 hover:bg-red-700"
              >
                {loading && lastAction === 'signOut' ? 'Signing Out...' : 'Sign Out'}
              </button>
              <button
                onClick={handleEnd}
                disabled={loading || !isJames}
                className="flex-1 py-2 px-4 rounded-lg text-white font-semibold transition-colors disabled:opacity-50 bg-red-600 hover:bg-red-700"
              >
                End
              </button>
            </div>
          </>
        )}

        {!isJames && (
          <p className="text-sm text-gray-500 mt-2">View only - actions not available</p>
        )}
      </div>

      {error?.type === 'outside_radius' && (
        <ErrorDisplay
          type="outside_radius"
          distanceMeters={error.distanceMeters}
          accuracyMeters={error.accuracyMeters}
          onRetry={handleRetry}
        />
      )}

      {error?.type === 'geolocation_error' && (
        <ErrorDisplay
          type="geolocation_error"
          geoError={error.geoError}
          onRetry={handleRetry}
        />
      )}
    </div>
  )
}
