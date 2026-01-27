import {
  calculateActualHours,
  calculateTotalMonthlyHours,
  calculateRemainingWeekdays,
  getSessionsInCurrentPeriod,
  type Session,
} from '../lib/calculations'

interface MonthlyGoalProps {
  sessions: Session[]
  anchorISO: string
  dailyTargetHours: number
  holidayExclusionsEnabled: boolean
}

export function MonthlyGoal({
  sessions,
  anchorISO,
  dailyTargetHours,
  holidayExclusionsEnabled,
}: MonthlyGoalProps) {
  const periodSessions = getSessionsInCurrentPeriod(sessions, anchorISO)
  const actualHours = calculateActualHours(periodSessions)

  const totalHoursNeeded = calculateTotalMonthlyHours(
    anchorISO,
    dailyTargetHours,
    holidayExclusionsEnabled
  )

  const remainingDays = calculateRemainingWeekdays(
    anchorISO,
    holidayExclusionsEnabled
  )

  const isRed = actualHours < totalHoursNeeded
  const progressPercent = totalHoursNeeded > 0
    ? Math.min((actualHours / totalHoursNeeded) * 100, 100)
    : 0

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="text-center mb-4">
        <p className="text-sm text-gray-500 mb-1">Monthly Goal</p>
        <p className="text-xs text-gray-400 mb-2">({remainingDays} days to go)</p>
        <p className={`text-4xl font-bold ${isRed ? 'text-app-red' : 'text-app-green'}`}>
          {actualHours.toFixed(1)}
          <span className="text-xl text-gray-400"> / {totalHoursNeeded.toFixed(1)}</span>
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${isRed ? 'bg-app-red' : 'bg-app-green'}`}
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
    </div>
  )
}
