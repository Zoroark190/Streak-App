import { DateTime } from 'luxon'
import { now, toAmsterdamDateTime, TIMEZONE } from './time'
import type { MLSession } from './mlFirestore'

/**
 * Calculate the active (non-paused) duration of an ML session in milliseconds.
 * If the session is ongoing, calculates up to the current time.
 */
export function calculateMLActiveDurationMs(session: MLSession): number {
  const endTime = session.endTime ?? new Date()
  const totalElapsed = endTime.getTime() - session.startTime.getTime()

  let pausedMs = session.pausedDuration

  // If currently paused, add the current pause duration
  if (session.isPaused && session.currentPauseStart) {
    pausedMs += Date.now() - session.currentPauseStart.getTime()
  }

  return Math.max(0, totalElapsed - pausedMs)
}

/**
 * Calculate the active duration in hours.
 */
export function calculateMLActiveDurationHours(session: MLSession): number {
  return calculateMLActiveDurationMs(session) / (1000 * 60 * 60)
}

/**
 * Calculate the current week period based on an anchor date.
 * Weeks are 7 days from the anchor, rolling forward.
 */
export function getWeekPeriod(weekStartAnchor: string): { start: DateTime; end: DateTime } {
  const anchor = DateTime.fromISO(weekStartAnchor).setZone(TIMEZONE)
  const current = now()

  // Calculate days elapsed since anchor
  const daysSinceAnchor = current.diff(anchor, 'days').days

  // Calculate complete weeks elapsed
  const weeksSinceAnchor = Math.floor(daysSinceAnchor / 7)

  // Current week start is anchor + (complete weeks * 7 days)
  const weekStart = anchor.plus({ weeks: weeksSinceAnchor })
  const weekEnd = weekStart.plus({ weeks: 1 })

  return { start: weekStart, end: weekEnd }
}

/**
 * Get all ML sessions within the current week period.
 */
export function getMLSessionsInCurrentWeek(sessions: MLSession[], weekStartAnchor: string): MLSession[] {
  const { start, end } = getWeekPeriod(weekStartAnchor)

  return sessions.filter(session => {
    const sessionStart = toAmsterdamDateTime(session.startTime)
    return sessionStart >= start && sessionStart < end
  })
}

/**
 * Calculate total hours for ML sessions in the current week.
 * Only counts completed sessions (with durationHours set).
 */
export function calculateMLWeeklyHours(sessions: MLSession[], weekStartAnchor: string): number {
  const weekSessions = getMLSessionsInCurrentWeek(sessions, weekStartAnchor)

  return weekSessions.reduce((total, session) => {
    if (session.durationHours !== null) {
      return total + session.durationHours
    }
    // For open sessions, calculate active duration
    if (session.endTime === null) {
      return total + calculateMLActiveDurationHours(session)
    }
    return total
  }, 0)
}

/**
 * Calculate days left in the current week.
 */
export function getDaysLeftInWeek(weekStartAnchor: string): number {
  const { end } = getWeekPeriod(weekStartAnchor)
  const current = now()

  const daysLeft = Math.ceil(end.diff(current, 'days').days)
  return Math.max(0, daysLeft)
}

/**
 * Calculate average hours per day for completed days in the current week.
 * Only includes days before today (not including today).
 * Returns null if no completed days yet (first day of week).
 */
export function calculateMLWeeklyAverage(sessions: MLSession[], weekStartAnchor: string): number | null {
  const { start } = getWeekPeriod(weekStartAnchor)
  const weekStartDay = start.startOf('day')
  const today = now().startOf('day')

  // Calculate complete days elapsed before today
  const daysElapsed = Math.floor(today.diff(weekStartDay, 'days').days)

  // If it's the first day of the week, no previous days to average
  if (daysElapsed <= 0) return null

  // Get sessions from week start up to (but not including) today
  const totalHours = sessions
    .filter(s => {
      if (s.endTime === null || s.durationHours === null) return false
      const sessionStart = toAmsterdamDateTime(s.startTime)
      return sessionStart >= weekStartDay && sessionStart < today
    })
    .reduce((sum, s) => sum + (s.durationHours ?? 0), 0)

  return totalHours / daysElapsed
}

/**
 * Determine if the user is behind schedule for their weekly ML goal.
 * Returns true if they need to catch up (should show red).
 */
export function shouldMLBeRed(
  actualHours: number,
  targetHours: number,
  daysLeftInWeek: number
): boolean {
  const remainingHours = targetHours - actualHours

  // Already met or exceeded goal
  if (remainingHours <= 0) return false

  // No days left and still have hours remaining
  if (daysLeftInWeek <= 0) return remainingHours > 0

  // Calculate expected hours at this point in the week
  // 7 days in a week, so expected rate is targetHours / 7 per day
  const daysElapsed = 7 - daysLeftInWeek
  const expectedHoursAtThisPoint = (targetHours / 7) * daysElapsed

  // Behind if actual is less than expected
  return actualHours < expectedHoursAtThisPoint
}

/**
 * Get ML sessions from the last 7 days for the session log.
 */
export function getMLSessionsLast7Days(sessions: MLSession[]): MLSession[] {
  const sevenDaysAgo = now().minus({ days: 7 }).startOf('day')

  return sessions.filter(session => {
    const sessionStart = toAmsterdamDateTime(session.startTime)
    return sessionStart >= sevenDaysAgo
  })
}

/**
 * Format duration in hours to a readable string.
 */
export function formatDurationHours(hours: number): string {
  return hours.toFixed(1)
}

/**
 * Group closed ML sessions by date and sum hours per day.
 * Returns a Map of ISO date string -> total hours for that day.
 */
function getHoursByDay(sessions: MLSession[]): Map<string, number> {
  const hoursByDay = new Map<string, number>()

  for (const session of sessions) {
    if (session.endTime === null || session.durationHours === null) continue

    const dateKey = toAmsterdamDateTime(session.startTime).toISODate()!
    const current = hoursByDay.get(dateKey) ?? 0
    hoursByDay.set(dateKey, current + session.durationHours)
  }

  return hoursByDay
}

/**
 * Calculate overall daily average for days with at least 0.5 hours.
 * Returns null if no qualifying days.
 */
export function calculateMLOverallDailyAverage(sessions: MLSession[]): number | null {
  const hoursByDay = getHoursByDay(sessions)

  // Filter to days with at least 0.5 hours
  const qualifyingDays: number[] = []
  for (const hours of hoursByDay.values()) {
    if (hours >= 0.5) {
      qualifyingDays.push(hours)
    }
  }

  if (qualifyingDays.length === 0) return null

  const totalHours = qualifyingDays.reduce((sum, h) => sum + h, 0)
  return totalHours / qualifyingDays.length
}

/**
 * Calculate average hours per day over the last 7 days.
 * Total hours in last 7 days divided by 7.
 */
export function calculateMLLast7DayAverage(sessions: MLSession[]): number {
  const sevenDaysAgo = now().minus({ days: 7 }).startOf('day')

  const totalHours = sessions
    .filter(s => {
      if (s.endTime === null || s.durationHours === null) return false
      const sessionStart = toAmsterdamDateTime(s.startTime)
      return sessionStart >= sevenDaysAgo
    })
    .reduce((sum, s) => sum + (s.durationHours ?? 0), 0)

  return totalHours / 7
}

/**
 * Calculate average hours per day for the current calendar month.
 * Total hours this month divided by days elapsed in the month.
 */
export function calculateMLThisMonthAverage(sessions: MLSession[]): number {
  const current = now()
  const monthStart = current.startOf('month')
  const daysElapsed = Math.floor(current.diff(monthStart, 'days').days) + 1

  const totalHours = sessions
    .filter(s => {
      if (s.endTime === null || s.durationHours === null) return false
      const sessionStart = toAmsterdamDateTime(s.startTime)
      return sessionStart >= monthStart
    })
    .reduce((sum, s) => sum + (s.durationHours ?? 0), 0)

  return totalHours / daysElapsed
}
