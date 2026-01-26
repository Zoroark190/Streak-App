import { type Session } from './calculations'
import { toAmsterdamDateTime, now } from './time'

export type GraphViewMode = 'daily' | 'weekly' | 'monthly'

export interface GraphDataPoint {
  label: string
  hours: number
  fullLabel: string
}

export interface GraphData {
  points: GraphDataPoint[]
  maxHours: number
}

/**
 * Filter to only closed sessions with valid duration.
 */
function getClosedSessions(sessions: Session[]): Session[] {
  return sessions.filter(s => s.endTime !== null && s.durationHours !== null)
}

/**
 * Get ordinal suffix for a day number (1st, 2nd, 3rd, 4th, etc.)
 */
function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th'
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

/**
 * Aggregate hours by day for the last 12 days.
 * Groups sessions by their start date (Amsterdam time).
 * Missing days show as 0 hours.
 */
export function aggregateDailyHours(sessions: Session[]): GraphData {
  const closed = getClosedSessions(sessions)
  const today = now().startOf('day')

  // Create map of date -> total hours
  const hoursByDate = new Map<string, number>()

  for (const session of closed) {
    const sessionDate = toAmsterdamDateTime(session.startTime).startOf('day')
    const key = sessionDate.toISODate()!
    const current = hoursByDate.get(key) ?? 0
    hoursByDate.set(key, current + (session.durationHours ?? 0))
  }

  // Generate last 12 days (oldest first for left-to-right)
  const points: GraphDataPoint[] = []
  for (let i = 11; i >= 0; i--) {
    const date = today.minus({ days: i })
    const key = date.toISODate()!
    const hours = hoursByDate.get(key) ?? 0

    points.push({
      label: `${date.day}${getOrdinalSuffix(date.day)}`,
      hours: Math.round(hours * 10) / 10,
      fullLabel: date.toFormat('ccc, LLL d'),
    })
  }

  const maxHours = Math.max(...points.map(p => p.hours), 1)

  return { points, maxHours }
}

/**
 * Aggregate hours by ISO week for the last 12 weeks.
 * Uses ISO week numbers (Monday start).
 * X-axis shows week start date.
 */
export function aggregateWeeklyHours(sessions: Session[]): GraphData {
  const closed = getClosedSessions(sessions)
  const today = now()

  // Get the Monday of the current week
  const currentWeekStart = today.startOf('week')

  // Create map of weekKey -> total hours
  const hoursByWeek = new Map<string, number>()

  for (const session of closed) {
    const sessionDt = toAmsterdamDateTime(session.startTime)
    const weekKey = `${sessionDt.weekYear}-W${sessionDt.weekNumber.toString().padStart(2, '0')}`
    const current = hoursByWeek.get(weekKey) ?? 0
    hoursByWeek.set(weekKey, current + (session.durationHours ?? 0))
  }

  // Generate last 12 weeks (oldest first)
  const points: GraphDataPoint[] = []
  for (let i = 11; i >= 0; i--) {
    const weekStart = currentWeekStart.minus({ weeks: i })
    const weekKey = `${weekStart.weekYear}-W${weekStart.weekNumber.toString().padStart(2, '0')}`
    const hours = hoursByWeek.get(weekKey) ?? 0

    points.push({
      label: weekStart.toFormat('LLL d'),
      hours: Math.round(hours * 10) / 10,
      fullLabel: `Week of ${weekStart.toFormat('LLL d, yyyy')}`,
    })
  }

  const maxHours = Math.max(...points.map(p => p.hours), 1)

  return { points, maxHours }
}

/**
 * Aggregate hours by month for the last 12 months.
 * X-axis shows 3-letter month abbreviation.
 */
export function aggregateMonthlyHours(sessions: Session[]): GraphData {
  const closed = getClosedSessions(sessions)
  const today = now().startOf('month')

  // Create map of monthKey -> total hours
  const hoursByMonth = new Map<string, number>()

  for (const session of closed) {
    const sessionDt = toAmsterdamDateTime(session.startTime)
    const monthKey = sessionDt.toFormat('yyyy-MM')
    const current = hoursByMonth.get(monthKey) ?? 0
    hoursByMonth.set(monthKey, current + (session.durationHours ?? 0))
  }

  // Generate last 12 months (oldest first)
  const points: GraphDataPoint[] = []
  for (let i = 11; i >= 0; i--) {
    const month = today.minus({ months: i })
    const monthKey = month.toFormat('yyyy-MM')
    const hours = hoursByMonth.get(monthKey) ?? 0

    points.push({
      label: month.toFormat('LLL'),
      hours: Math.round(hours * 10) / 10,
      fullLabel: month.toFormat('LLLL yyyy'),
    })
  }

  const maxHours = Math.max(...points.map(p => p.hours), 1)

  return { points, maxHours }
}

/**
 * Get graph data for the specified view mode.
 */
export function getGraphData(sessions: Session[], viewMode: GraphViewMode): GraphData {
  switch (viewMode) {
    case 'daily':
      return aggregateDailyHours(sessions)
    case 'weekly':
      return aggregateWeeklyHours(sessions)
    case 'monthly':
      return aggregateMonthlyHours(sessions)
  }
}
