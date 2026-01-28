import type { MLSession } from '../../lib/mlFirestore'
import { getMLSessionsLast7Days } from '../../lib/mlCalculations'
import { toAmsterdamDateTime, formatTime12h, formatDate } from '../../lib/time'

interface MLSessionListProps {
  mlSessions: MLSession[]
}

export function MLSessionList({ mlSessions }: MLSessionListProps) {
  const recentSessions = getMLSessionsLast7Days(mlSessions)

  if (recentSessions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Recent Sessions</h3>
        <p className="text-gray-500 text-sm text-center py-4">No ML sessions in the last 7 days</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">Recent Sessions</h3>
      <div className="space-y-3">
        {recentSessions.map((session) => (
          <MLSessionRow key={session.id} session={session} />
        ))}
      </div>
    </div>
  )
}

function MLSessionRow({ session }: { session: MLSession }) {
  const startDt = toAmsterdamDateTime(session.startTime)
  const endDt = session.endTime ? toAmsterdamDateTime(session.endTime) : null

  return (
    <div className="py-2 border-b border-gray-50 last:border-0">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800">
            {formatDate(startDt)}
          </p>
          <p className="text-xs text-gray-500">
            {formatTime12h(startDt)}
            {endDt ? ` - ${formatTime12h(endDt)}` : ' - In progress'}
          </p>
        </div>
        <div className="text-right">
          {session.durationHours !== null ? (
            <span className="text-sm font-medium text-gray-700">
              {session.durationHours.toFixed(1)} hrs
            </span>
          ) : (
            <span className="text-xs text-blue-600 font-medium">Active</span>
          )}
        </div>
      </div>

      {/* Page numbers for completed sessions */}
      {session.endTime && (session.pageMathML > 0 || session.pageProbML > 0) && (
        <div className="flex gap-4 mt-1 text-xs text-gray-500">
          {session.pageMathML > 0 && (
            <span>Math ML: p.{session.pageMathML}</span>
          )}
          {session.pageProbML > 0 && (
            <span>Prob ML: p.{session.pageProbML}</span>
          )}
        </div>
      )}

      {/* Notes preview */}
      {session.notes && (
        <p className="text-xs text-gray-400 mt-1 truncate">
          Note: {session.notes}
        </p>
      )}
    </div>
  )
}
