import {
  calculateAttendanceCount,
  calculateAverageStay,
  calculateAverageStartTime,
  calculateAverageEndTime,
  getSessionsInCurrentPeriod,
  type Session,
} from '../lib/calculations'

interface SecondaryStatsProps {
  sessions: Session[]
  anchorISO: string
}

export function SecondaryStats({ sessions, anchorISO }: SecondaryStatsProps) {
  const periodSessions = getSessionsInCurrentPeriod(sessions, anchorISO)
  const attendanceCount = calculateAttendanceCount(periodSessions)
  const averageStay = calculateAverageStay(periodSessions)
  const averageStart = calculateAverageStartTime(periodSessions)
  const averageEnd = calculateAverageEndTime(periodSessions)

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">This Month Statistics</h2>
      <div className="flex items-center justify-between">
        <span className="text-gray-600">Days attended</span>
        <span className="text-xl font-bold text-gray-900">{attendanceCount}</span>
      </div>
      <div className="border-t border-gray-100"></div>
      <div className="flex items-center justify-between">
        <span className="text-gray-600">Average stay</span>
        <span className="text-xl font-bold text-gray-900">
          {averageStay > 0 ? `${averageStay.toFixed(1)} hrs` : '--'}
        </span>
      </div>
      <div className="border-t border-gray-100"></div>
      <div className="flex items-center justify-between">
        <span className="text-gray-600">Average start</span>
        <span className="text-xl font-bold text-gray-900">
          {averageStart ?? '--'}
        </span>
      </div>
      <div className="border-t border-gray-100"></div>
      <div className="flex items-center justify-between">
        <span className="text-gray-600">Average end</span>
        <span className="text-xl font-bold text-gray-900">
          {averageEnd ?? '--'}
        </span>
      </div>
    </div>
  )
}
