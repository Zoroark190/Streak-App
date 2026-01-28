import type { MLSession } from '../../lib/mlFirestore'
import {
  calculateMLWeeklyHours,
  getDaysLeftInWeek,
  shouldMLBeRed,
} from '../../lib/mlCalculations'

interface MLWeeklyGoalProps {
  mlSessions: MLSession[]
  mlWeekStartAnchor: string | null
  mlWeeklyTargetHours: number
}

export function MLWeeklyGoal({
  mlSessions,
  mlWeekStartAnchor,
  mlWeeklyTargetHours,
}: MLWeeklyGoalProps) {
  // If no anchor set, show placeholder
  if (!mlWeekStartAnchor) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Weekly Goal</p>
          <p className="text-gray-400">Start a session to begin tracking</p>
        </div>
      </div>
    )
  }

  const actualHours = calculateMLWeeklyHours(mlSessions, mlWeekStartAnchor)
  const daysLeft = getDaysLeftInWeek(mlWeekStartAnchor)
  const isRed = shouldMLBeRed(actualHours, mlWeeklyTargetHours, daysLeft)

  const progressPercent = mlWeeklyTargetHours > 0
    ? Math.min((actualHours / mlWeeklyTargetHours) * 100, 100)
    : 0

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="text-center mb-4">
        <p className="text-sm text-gray-500 mb-1">Hours this week</p>
        <p className={`text-4xl font-bold ${isRed ? 'text-app-red' : 'text-app-green'}`}>
          {actualHours.toFixed(1)}
          <span className="text-xl text-gray-400"> / {mlWeeklyTargetHours.toFixed(1)}</span>
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left in week
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
