import type { MLSession } from '../../lib/mlFirestore'
import {
  calculateMLOverallDailyAverage,
  calculateMLLast7DayAverage,
} from '../../lib/mlCalculations'

interface MLSecondaryStatsProps {
  mlSessions: MLSession[]
  mlWeeklyTargetHours: number
}

export function MLSecondaryStats({ mlSessions, mlWeeklyTargetHours }: MLSecondaryStatsProps) {
  const overallAverage = calculateMLOverallDailyAverage(mlSessions)
  const last7DayAverage = calculateMLLast7DayAverage(mlSessions)

  // Red if below daily target (weekly target / 7)
  const dailyTarget = mlWeeklyTargetHours / 7
  const isLast7DayRed = last7DayAverage < dailyTarget

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Averages</h2>

      <div className="flex items-center justify-between">
        <span className="text-gray-600">Overall average</span>
        <span className="text-xl font-bold text-gray-900">
          {overallAverage !== null ? `${overallAverage.toFixed(1)} hrs/day` : '--'}
        </span>
      </div>

      <div className="border-t border-gray-100"></div>

      <div className="flex items-center justify-between">
        <span className="text-gray-600">Last 7 days</span>
        <span className={`text-xl font-bold ${isLast7DayRed ? 'text-app-red' : 'text-app-green'}`}>
          {last7DayAverage.toFixed(1)} hrs/day
        </span>
      </div>
    </div>
  )
}
