import { DateTime } from 'luxon'
import {
  now,
  toAmsterdamDateTime,
  isSameDay,
  getMonthPeriod,
  countElapsedWeekdays,
  getHolidaysInPeriod,
  endOfDay,
  TIMEZONE,
} from './time'

export interface Session {
  id: string
  startTime: Date
  endTime: Date | null
  savedTime: Date | null
  durationHours: number | null
  verification: {
    method: string
    distanceMeters: number
    withinRadius: boolean
    accuracyMeters: number | null
  }
  createdAt: Date
  updatedAt: Date
}

/**
 * Calculate total actual hours from closed sessions within the current month period.
 */
export function calculateActualHours(sessions: Session[]): number {
  return sessions
    .filter(s => s.endTime !== null && s.durationHours !== null)
    .reduce((sum, s) => sum + (s.durationHours ?? 0), 0)
}

/**
 * Calculate expected hours so far in the current month period.
 *
 * Timing rule:
 * - If there's an open session today, count expected up to yesterday.
 * - Otherwise, include today if it's a weekday.
 */
export function calculateExpectedHours(
  anchorISO: string,
  dailyTargetHours: number,
  holidayExclusionsEnabled: boolean,
  hasOpenSessionToday: boolean
): number {
  const { start } = getMonthPeriod(anchorISO)
  const current = now()

  // Determine the end date for counting
  let countUpTo: DateTime
  if (hasOpenSessionToday) {
    // Don't include today
    countUpTo = current.minus({ days: 1 })
  } else {
    countUpTo = current
  }

  // Don't count before the period start
  if (countUpTo < start) {
    return 0
  }

  const holidays = holidayExclusionsEnabled
    ? getHolidaysInPeriod(start, countUpTo)
    : []

  const weekdays = countElapsedWeekdays(start, countUpTo, holidays)
  return weekdays * dailyTargetHours
}

/**
 * Count unique calendar dates (Amsterdam time) with any sign-in.
 */
export function calculateAttendanceCount(sessions: Session[]): number {
  const uniqueDates = new Set<string>()

  for (const session of sessions) {
    const dt = toAmsterdamDateTime(session.startTime)
    uniqueDates.add(dt.toISODate() ?? '')
  }

  uniqueDates.delete('')
  return uniqueDates.size
}

/**
 * Calculate average stay in hours.
 * averageStay = totalHours / daysAttended
 */
export function calculateAverageStay(sessions: Session[]): number {
  const closedSessions = sessions.filter(s => s.durationHours !== null)
  const daysAttended = calculateAttendanceCount(closedSessions)

  if (daysAttended === 0) return 0

  const totalHours = closedSessions.reduce((sum, s) => sum + (s.durationHours ?? 0), 0)
  return totalHours / daysAttended
}

/**
 * Check if actual hours are behind expected hours.
 */
export function shouldBeRed(actualHours: number, expectedHours: number): boolean {
  return actualHours < expectedHours
}

/**
 * Determine if a session needs auto-closing (started on a past day).
 */
export function isStaleSession(session: Session): boolean {
  if (session.endTime !== null) return false
  const startDt = toAmsterdamDateTime(session.startTime)
  const current = now()
  return !isSameDay(startDt, current)
}

/**
 * Calculate the auto-close end time for a stale session.
 * If savedTime exists, use it (no punishment).
 * Otherwise apply punishment rule: endTime = min(start + 2 hours, 23:59:59 of start day)
 */
export function calculateAutoCloseEndTime(session: Session): Date {
  if (session.savedTime) {
    return session.savedTime
  }

  const startDt = toAmsterdamDateTime(session.startTime).setZone(TIMEZONE)
  const startPlusTwoHours = startDt.plus({ hours: 2 })
  const endOfStartDay = endOfDay(startDt)

  const assumedEnd = startPlusTwoHours < endOfStartDay ? startPlusTwoHours : endOfStartDay
  return assumedEnd.toJSDate()
}

/**
 * Calculate duration in hours between two dates.
 */
export function calculateDurationHours(start: Date, end: Date): number {
  const startDt = DateTime.fromJSDate(start)
  const endDt = DateTime.fromJSDate(end)
  return endDt.diff(startDt, 'hours').hours
}

/**
 * Determine the sign-out end time, applying midnight crossing prevention.
 * If signing out on a different day than the session start,
 * apply the same punishment rule as auto-close.
 */
export function calculateSignOutEndTime(session: Session): Date {
  const startDt = toAmsterdamDateTime(session.startTime)
  const current = now()

  if (isSameDay(startDt, current)) {
    return current.toJSDate()
  }

  // Crossing midnight: apply punishment rule
  return calculateAutoCloseEndTime(session)
}

/**
 * Filter sessions to those within the current month period.
 */
export function getSessionsInCurrentPeriod(sessions: Session[], anchorISO: string): Session[] {
  const { start, end } = getMonthPeriod(anchorISO)
  return sessions.filter(s => {
    const startDt = toAmsterdamDateTime(s.startTime)
    return startDt >= start && startDt < end
  })
}

/**
 * Filter sessions to the last 7 days.
 */
export function getSessionsLast7Days(sessions: Session[]): Session[] {
  const sevenDaysAgo = now().minus({ days: 7 }).startOf('day')
  return sessions.filter(s => {
    const startDt = toAmsterdamDateTime(s.startTime)
    return startDt >= sevenDaysAgo
  })
}
