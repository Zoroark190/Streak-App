import { useState, useEffect } from 'react'
import { useGeolocation, type GeolocationErrorType } from '../hooks/useGeolocation'
import { calculateDistance } from '../lib/geo'
import { UNI_COORDS, ALLOWED_RADIUS_METERS, DEV_BYPASS_LOCATION } from '../lib/firebase'
import { createSession, closeSession } from '../lib/firestore'
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

  const handleAction = async () => {
    setError(null)
    setActionLoading(true)

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

      if (isSignedIn && openSession) {
        // Sign Out
        const endTime = calculateSignOutEndTime(openSession)
        const duration = calculateDurationHours(openSession.startTime, endTime)
        await closeSession(openSession.id, endTime, duration)
      } else {
        // Sign In
        await createSession(now().toJSDate(), verification)
      }
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        let geoError: GeolocationErrorType = 'position_unavailable'
        if (err.code === err.PERMISSION_DENIED) geoError = 'permission_denied'
        if (err.code === err.TIMEOUT) geoError = 'timeout'
        setError({ type: 'geolocation_error', geoError })
      } else if (error === null) {
        // Only set generic error if no specific error was set
        console.error('Check-in/out failed:', err)
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    handleAction()
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

        <button
          onClick={handleAction}
          disabled={loading || !isJames}
          className={`w-full py-4 px-8 rounded-lg text-white font-bold text-xl transition-colors disabled:opacity-50 ${
            isSignedIn
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
              {isSignedIn ? 'Signing Out...' : 'Signing In...'}
            </span>
          ) : isSignedIn ? (
            'Sign Out'
          ) : (
            'Sign In'
          )}
        </button>

        {isSignedIn && (
          <p className="text-2xl font-medium text-gray-700 mt-3 tabular-nums">
            {formatElapsedTime(elapsedSeconds)}
          </p>
        )}

        {!isJames && (
          <p className="text-sm text-gray-500 mt-2">View only - check-in not available</p>
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
