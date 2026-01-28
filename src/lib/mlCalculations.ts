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
