import { useState, useEffect } from 'react'
import {
  createMLSession,
  pauseMLSession,
  resumeMLSession,
  closeMLSession,
  deleteMLSession,
  updateMLConfig,
  type MLSession,
} from '../../lib/mlFirestore'
import { calculateMLActiveDurationMs } from '../../lib/mlCalculations'
import { now } from '../../lib/time'
import { MLEndSessionModal } from './MLEndSessionModal'

interface MLLearningCardProps {
  openMLSession: MLSession | null
  isJames: boolean
  lastPageMathML: number
  lastPageProbML: number
  mlWeekStartAnchor: string | null
}

export function MLLearningCard({
  openMLSession,
  isJames,
  lastPageMathML,
  lastPageProbML,
  mlWeekStartAnchor,
}: MLLearningCardProps) {
  const [actionLoading, setActionLoading] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const isActive = openMLSession !== null
  const isPaused = openMLSession?.isPaused ?? false

  // Timer effect
  useEffect(() => {
    if (!openMLSession) {
      setElapsedSeconds(0)
      return
    }

    const updateElapsed = () => {
      const activeMs = calculateMLActiveDurationMs(openMLSession)
      setElapsedSeconds(Math.floor(activeMs / 1000))
    }

    updateElapsed()

    // Only tick if not paused
    if (!openMLSession.isPaused) {
      const interval = setInterval(updateElapsed, 1000)
      return () => clearInterval(interval)
    }
  }, [openMLSession, openMLSession?.isPaused, openMLSession?.pausedDuration])

  const formatElapsedTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const handleStart = async () => {
    setActionLoading(true)
    try {
      const startTime = now().toJSDate()
      await createMLSession(startTime)

      // If this is the first session and no week anchor is set, set it now
      if (!mlWeekStartAnchor) {
        const anchor = now().toISO()
        if (anchor) {
          await updateMLConfig({ mlWeekStartAnchor: anchor })
        }
      }
    } catch (err) {
      console.error('Failed to start ML session:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handlePause = async () => {
    if (!openMLSession) return
    setActionLoading(true)
    try {
      await pauseMLSession(openMLSession.id, now().toJSDate())
    } catch (err) {
      console.error('Failed to pause ML session:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleResume = async () => {
    if (!openMLSession || !openMLSession.currentPauseStart) return
    setActionLoading(true)
    try {
      await resumeMLSession(
        openMLSession.id,
        now().toJSDate(),
        openMLSession.currentPauseStart,
        openMLSession.pausedDuration
      )
    } catch (err) {
      console.error('Failed to resume ML session:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleEndClick = () => {
    setShowEndModal(true)
  }

  const handleFinishSession = async (data: {
    pageMathML: number
    pageProbML: number
    notes: string | null
  }) => {
    if (!openMLSession) return
    setActionLoading(true)
    try {
      // Calculate final duration (excluding paused time)
      const endTime = now().toJSDate()
      const totalElapsed = endTime.getTime() - openMLSession.startTime.getTime()

      let pausedMs = openMLSession.pausedDuration
      if (openMLSession.isPaused && openMLSession.currentPauseStart) {
        pausedMs += endTime.getTime() - openMLSession.currentPauseStart.getTime()
      }

      const activeMs = Math.max(0, totalElapsed - pausedMs)
      const durationHours = activeMs / (1000 * 60 * 60)

      await closeMLSession(openMLSession.id, {
        endTime,
        pageMathML: data.pageMathML,
        pageProbML: data.pageProbML,
        notes: data.notes,
        durationHours,
      })

      // Update last page numbers in config
      await updateMLConfig({
        mlLastPageMathML: data.pageMathML,
        mlLastPageProbML: data.pageProbML,
      })

      setShowEndModal(false)
    } catch (err) {
      console.error('Failed to end ML session:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDiscardSession = async () => {
    if (!openMLSession) return
    setActionLoading(true)
    try {
      await deleteMLSession(openMLSession.id)
      setShowEndModal(false)
    } catch (err) {
      console.error('Failed to discard ML session:', err)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            {isActive ? (isPaused ? 'ML Session Paused' : 'ML Session Active') : 'ML Learning'}
          </h2>

          {!isActive ? (
            // Start button
            <button
              onClick={handleStart}
              disabled={actionLoading || !isJames}
              className="w-full py-4 px-8 rounded-lg text-white font-bold text-xl transition-colors disabled:opacity-50 bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                  Starting...
                </span>
              ) : (
                'Start'
              )}
            </button>
          ) : (
            // Active session UI
            <>
              {/* Pause/Resume button */}
              <button
                onClick={isPaused ? handleResume : handlePause}
                disabled={actionLoading || !isJames}
                className="w-full py-4 px-8 rounded-lg text-white font-bold text-xl transition-colors disabled:opacity-50 bg-blue-600 hover:bg-blue-700"
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                    {isPaused ? 'Resuming...' : 'Pausing...'}
                  </span>
                ) : isPaused ? (
                  'Resume'
                ) : (
                  'Pause'
                )}
              </button>

              {/* Timer display */}
              <p className="text-2xl font-medium text-gray-700 mt-3 tabular-nums">
                {formatElapsedTime(elapsedSeconds)}
                {isPaused && <span className="text-sm text-yellow-600 ml-2">(Paused)</span>}
              </p>

              {/* End button */}
              <button
                onClick={handleEndClick}
                disabled={actionLoading || !isJames}
                className="w-full mt-4 py-2 px-4 rounded-lg text-white font-semibold transition-colors disabled:opacity-50 bg-red-600 hover:bg-red-700"
              >
                End
              </button>
            </>
          )}

          {!isJames && (
            <p className="text-sm text-gray-500 mt-2">View only - actions not available</p>
          )}
        </div>

        {/* Last page numbers - always visible */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500 text-center mb-2">Last page reached:</p>
          <div className="flex justify-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-gray-700 font-medium">Math for ML</p>
              <p className="text-gray-500">{lastPageMathML > 0 ? `Page ${lastPageMathML}` : '-'}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-700 font-medium">Prob ML</p>
              <p className="text-gray-500">{lastPageProbML > 0 ? `Page ${lastPageProbML}` : '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* End session modal */}
      {showEndModal && (
        <MLEndSessionModal
          onClose={() => setShowEndModal(false)}
          onFinish={handleFinishSession}
          onDiscard={handleDiscardSession}
          lastPageMathML={lastPageMathML}
          lastPageProbML={lastPageProbML}
          loading={actionLoading}
        />
      )}
    </>
  )
}
