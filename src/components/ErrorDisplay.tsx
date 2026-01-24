import { type GeolocationErrorType } from '../hooks/useGeolocation'

interface ErrorDisplayProps {
  type: 'outside_radius' | 'geolocation_error'
  distanceMeters?: number
  accuracyMeters?: number
  geoError?: GeolocationErrorType | null
  onRetry: () => void
}

export function ErrorDisplay({ type, distanceMeters, accuracyMeters, geoError, onRetry }: ErrorDisplayProps) {
  if (type === 'outside_radius') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
        <p className="text-red-800 font-medium mb-1">Outside university radius</p>
        <p className="text-red-700 text-sm">
          You are {Math.round(distanceMeters ?? 0)} meters from university (must be within 1,000m).
        </p>
        {accuracyMeters && accuracyMeters > 50 && (
          <p className="text-red-600 text-xs mt-1">
            GPS accuracy is &plusmn;{Math.round(accuracyMeters)}m. Try again with better signal.
          </p>
        )}
        <button
          onClick={onRetry}
          className="mt-3 text-sm bg-red-100 text-red-800 px-4 py-2 rounded hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Geolocation error
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
      <p className="text-red-800 font-medium mb-2">Location access required</p>

      {geoError === 'permission_denied' && (
        <div className="text-sm text-red-700 space-y-2">
          <p>Location permission is denied. Please enable it:</p>
          <div className="bg-white rounded p-3 text-xs space-y-1">
            <p className="font-medium">iPhone Safari:</p>
            <p>Settings &rarr; Privacy &amp; Security &rarr; Location Services &rarr; Safari Websites &rarr; Allow</p>
            <p className="font-medium mt-2">Mac:</p>
            <p>System Settings &rarr; Privacy &amp; Security &rarr; Location Services &rarr; enable for browser</p>
          </div>
        </div>
      )}

      {geoError === 'position_unavailable' && (
        <p className="text-sm text-red-700">
          Location information is unavailable. Please ensure location services are enabled on your device.
        </p>
      )}

      {geoError === 'timeout' && (
        <p className="text-sm text-red-700">
          Location request timed out. Please try again with better signal.
        </p>
      )}

      {geoError === 'not_supported' && (
        <p className="text-sm text-red-700">
          Geolocation is not supported by your browser.
        </p>
      )}

      <button
        onClick={onRetry}
        className="mt-3 text-sm bg-red-100 text-red-800 px-4 py-2 rounded hover:bg-red-200 transition-colors"
      >
        Try Again
      </button>
    </div>
  )
}
