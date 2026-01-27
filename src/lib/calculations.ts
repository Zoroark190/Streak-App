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
 * Always includes today (if it's a weekday) from 00:00 onwards.
 */
export function calculateExpectedHours(
  anchorISO: string,
  dailyTargetHours: number,
  holidayExclusionsEnabled: boolean
): number {
  const { start } = getMonthPeriod(anchorISO)
  const current = now()

  // Don't count before the period start
  if (current < start) {
    return 0
  }

  const holidays = holidayExclusionsEnabled
    ? getHolidaysInPeriod(start, current)
    : []

  const weekdays = countElapsedWeekdays(start, current, holidays)
  return weekdays * dailyTargetHours
}

/**
 * Calculate total hours needed for the entire month period.
 * Returns total weekdays × daily target (excluding holidays if enabled).
 */
export function calculateTotalMonthlyHours(
  anchorISO: string,
  dailyTargetHours: number,
  holidayExclusionsEnabled: boolean
): number {
  const { start, end } = getMonthPeriod(anchorISO)
  const holidays = holidayExclusionsEnabled
    ? getHolidaysInPeriod(start, end)
    : []
  const totalWeekdays = countElapsedWeekdays(start, end, holidays)
  return totalWeekdays * dailyTargetHours
}

/**
 * Calculate remaining weekdays in the current month period.
 */
export function calculateRemainingWeekdays(
  anchorISO: string,
  holidayExclusionsEnabled: boolean
): number {
  const { end } = getMonthPeriod(anchorISO)
  const current = now()

  // Count from tomorrow to end of period
  const tomorrow = current.plus({ days: 1 }).startOf('day')
  if (tomorrow > end) return 0

  const holidays = holidayExclusionsEnabled
    ? getHolidaysInPeriod(tomorrow, end)
    : []
  return countElapsedWeekdays(tomorrow, end, holidays)
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
 * Calculate average start time across all closed sessions.
 * Returns time in 12-hour format (e.g., "09:30 AM") or null if no sessions.
 */
export function calculateAverageStartTime(sessions: Session[]): string | null {
  const closedSessions = sessions.filter(s => s.endTime !== null)
  if (closedSessions.length === 0) return null

  const totalMinutes = closedSessions.reduce((sum, s) => {
    const dt = toAmsterdamDateTime(s.startTime)
    return sum + (dt.hour * 60 + dt.minute)
  }, 0)

  const avgMinutes = Math.round(totalMinutes / closedSessions.length)
  const hours24 = Math.floor(avgMinutes / 60)
  const minutes = avgMinutes % 60
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 || 12
  return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`
}

/**
 * Calculate average end time across all closed sessions.
 * Returns time in 12-hour format (e.g., "05:45 PM") or null if no sessions.
 */
export function calculateAverageEndTime(sessions: Session[]): string | null {
  const closedSessions = sessions.filter(s => s.endTime !== null)
  if (closedSessions.length === 0) return null

  const totalMinutes = closedSessions.reduce((sum, s) => {
    const dt = toAmsterdamDateTime(s.endTime!)
    return sum + (dt.hour * 60 + dt.minute)
  }, 0)

  const avgMinutes = Math.round(totalMinutes / closedSessions.length)
  const hours24 = Math.floor(avgMinutes / 60)
  const minutes = avgMinutes % 60
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 || 12
  return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`
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
