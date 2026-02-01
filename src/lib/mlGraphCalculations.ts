import { DateTime } from 'luxon'
import { type MLSession } from './mlFirestore'
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
 * Filter to only closed ML sessions with valid duration.
 */
function getClosedMLSessions(sessions: MLSession[]): MLSession[] {
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
 * Aggregate ML hours by day from anchor date to today.
 * Shows up to 12 days, starting from anchor.
 */
export function aggregateDailyMLHours(sessions: MLSession[], anchorISO: string): GraphData {
  const closed = getClosedMLSessions(sessions)
  const today = now().startOf('day')
  const anchorDate = toAmsterdamDateTime(anchorISO).startOf('day')

  // Create map of date -> total hours
  const hoursByDate = new Map<string, number>()

  for (const session of closed) {
    const sessionDate = toAmsterdamDateTime(session.startTime).startOf('day')
    const key = sessionDate.toISODate()!
    const current = hoursByDate.get(key) ?? 0
    hoursByDate.set(key, current + (session.durationHours ?? 0))
  }

  // Calculate days from anchor to today
  const daysSinceAnchor = Math.floor(today.diff(anchorDate, 'days').days) + 1
  const daysToShow = Math.min(daysSinceAnchor, 12)

  // Generate days from (today - daysToShow + 1) to today, but not before anchor
  const points: GraphDataPoint[] = []
  for (let i = daysToShow - 1; i >= 0; i--) {
    const date = today.minus({ days: i })
    if (date < anchorDate) continue

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
 * Aggregate ML hours by ISO week from anchor week to current week.
 * Shows up to 12 weeks, starting from anchor.
 */
export function aggregateWeeklyMLHours(sessions: MLSession[], anchorISO: string): GraphData {
  const closed = getClosedMLSessions(sessions)
  const currentWeekStart = now().startOf('week')
  const anchorWeekStart = toAmsterdamDateTime(anchorISO).startOf('week')

  // Create map of weekKey -> total hours
  const hoursByWeek = new Map<string, number>()

  for (const session of closed) {
    const sessionDt = toAmsterdamDateTime(session.startTime)
    const weekKey = `${sessionDt.weekYear}-W${sessionDt.weekNumber.toString().padStart(2, '0')}`
    const current = hoursByWeek.get(weekKey) ?? 0
    hoursByWeek.set(weekKey, current + (session.durationHours ?? 0))
  }

  // Calculate weeks from anchor to current week
  const weeksSinceAnchor = Math.floor(currentWeekStart.diff(anchorWeekStart, 'weeks').weeks) + 1
  const weeksToShow = Math.min(weeksSinceAnchor, 12)

  // Generate weeks from (current - weeksToShow + 1) to current, but not before anchor
  const points: GraphDataPoint[] = []
  for (let i = weeksToShow - 1; i >= 0; i--) {
    const weekStart = currentWeekStart.minus({ weeks: i })
    if (weekStart < anchorWeekStart) continue

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
 * Get the start of the anchor-based period that contains a given date.
 */
function getPeriodStart(date: DateTime, anchorDay: number): DateTime {
  if (date.day >= anchorDay) {
    return date.set({ day: anchorDay }).startOf('day')
  } else {
    return date.minus({ months: 1 }).set({ day: anchorDay }).startOf('day')
  }
}

/**
 * Aggregate ML hours by anchor-based periods for 12 periods starting from anchor.
 */
export function aggregateMonthlyMLHours(sessions: MLSession[], anchorISO: string): GraphData {
  const closed = getClosedMLSessions(sessions)
  const anchor = toAmsterdamDateTime(anchorISO)
  const anchorDay = anchor.day

  // Create map of periodKey -> total hours
  const hoursByPeriod = new Map<string, number>()

  for (const session of closed) {
    const sessionDt = toAmsterdamDateTime(session.startTime)
    const periodStart = getPeriodStart(sessionDt, anchorDay)
    const periodKey = periodStart.toFormat('yyyy-MM')
    const current = hoursByPeriod.get(periodKey) ?? 0
    hoursByPeriod.set(periodKey, current + (session.durationHours ?? 0))
  }

  // Generate 12 periods starting from anchor
  const firstPeriodStart = anchor.startOf('day')
  const points: GraphDataPoint[] = []

  for (let i = 0; i < 12; i++) {
    const periodStart = firstPeriodStart.plus({ months: i })
    const periodKey = periodStart.toFormat('yyyy-MM')
    const hours = hoursByPeriod.get(periodKey) ?? 0
    const periodEnd = periodStart.plus({ months: 1 }).minus({ days: 1 })

    points.push({
      label: periodStart.toFormat('LLL'),
      hours: Math.round(hours * 10) / 10,
      fullLabel: `${periodStart.toFormat('LLL d')} - ${periodEnd.toFormat('LLL d, yyyy')}`,
    })
  }

  const maxHours = Math.max(...points.map(p => p.hours), 1)
  return { points, maxHours }
}

/**
 * Get graph data for ML sessions in the specified view mode.
 */
export function getMLGraphData(sessions: MLSession[], viewMode: GraphViewMode, anchorISO: string): GraphData {
  switch (viewMode) {
    case 'daily':
      return aggregateDailyMLHours(sessions, anchorISO)
    case 'weekly':
      return aggregateWeeklyMLHours(sessions, anchorISO)
    case 'monthly':
      return aggregateMonthlyMLHours(sessions, anchorISO)
  }
}
