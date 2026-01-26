import {
  calculateActualHours,
  calculateExpectedHours,
  shouldBeRed,
  getSessionsInCurrentPeriod,
  type Session,
} from '../lib/calculations'
import { isSameDay, now, toAmsterdamDateTime } from '../lib/time'

interface ProgressStatsProps {
  sessions: Session[]
  openSession: Session | null
  anchorISO: string
  dailyTargetHours: number
  holidayExclusionsEnabled: boolean
}

export function ProgressStats({
  sessions,
  openSession,
  anchorISO,
  dailyTargetHours,
  holidayExclusionsEnabled,
}: ProgressStatsProps) {
  const periodSessions = getSessionsInCurrentPeriod(sessions, anchorISO)
  const actualHours = calculateActualHours(periodSessions)

  // Check if there's an open session today
  const hasOpenSessionToday = openSession !== null &&
    isSameDay(toAmsterdamDateTime(openSession.startTime), now())

  const expectedHours = calculateExpectedHours(
    anchorISO,
    dailyTargetHours,
    holidayExclusionsEnabled,
    hasOpenSessionToday
  )

  const isRed = shouldBeRed(actualHours, expectedHours)
  const progressPercent = expectedHours > 0
    ? Math.min((actualHours / expectedHours) * 100, 100)
    : 0

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="text-center mb-4">
        <p className="text-sm text-gray-500 mb-1">Hours this month</p>
        <p className={`text-4xl font-bold ${isRed ? 'text-app-red' : 'text-app-green'}`}>
          {actualHours.toFixed(1)}
          <span className="text-xl text-gray-400"> / {expectedHours.toFixed(1)}</span>
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-app-green h-3 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

    </div>
  )
}
