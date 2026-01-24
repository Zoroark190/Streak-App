import { useState } from 'react'
import { setMonthAnchor } from '../lib/firestore'
import { now } from '../lib/time'

interface StartScreenProps {
  isJames: boolean
}

export function StartScreen({ isJames }: StartScreenProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStart = async () => {
    setLoading(true)
    setError(null)
    try {
      const anchor = now().toISO()
      if (anchor) {
        await setMonthAnchor(anchor)
      }
    } catch (err) {
      setError('Failed to initialize. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
        {isJames ? (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Initialize Monthly Tracking
            </h2>
            <button
              onClick={handleStart}
              disabled={loading}
              className="w-full bg-app-blue text-white font-bold text-lg py-4 px-8 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Starting...' : 'Start'}
            </button>
            {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Waiting for Setup</h2>
            <p className="text-gray-600">
              The primary user needs to initialize monthly tracking.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
