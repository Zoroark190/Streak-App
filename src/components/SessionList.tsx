import { getSessionsLast7Days, type Session } from '../lib/calculations'
import { toAmsterdamDateTime, formatTime12h, formatDate } from '../lib/time'

interface SessionListProps {
  sessions: Session[]
}

export function SessionList({ sessions }: SessionListProps) {
  const recentSessions = getSessionsLast7Days(sessions)

  if (recentSessions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Recent Sessions</h3>
        <p className="text-gray-500 text-sm text-center py-4">No sessions in the last 7 days</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">Recent Sessions</h3>
      <div className="space-y-3">
        {recentSessions.map((session) => (
          <SessionRow key={session.id} session={session} />
        ))}
      </div>
    </div>
  )
}

function SessionRow({ session }: { session: Session }) {
  const startDt = toAmsterdamDateTime(session.startTime)
  const endDt = session.endTime ? toAmsterdamDateTime(session.endTime) : null

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">
          {formatDate(startDt)}
        </p>
        <p className="text-xs text-gray-500">
          {formatTime12h(startDt)}
          {endDt ? ` - ${formatTime12h(endDt)}` : ' - In progress'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {session.durationHours !== null ? (
          <span className="text-sm font-medium text-gray-700">
            {session.durationHours.toFixed(1)} hrs
          </span>
        ) : (
          <span className="text-xs text-blue-600 font-medium">Active</span>
        )}
        {session.verification.withinRadius && (
          <span className="text-green-500 text-sm" title="Verified at university">
            &#10003;
          </span>
        )}
      </div>
    </div>
  )
}
