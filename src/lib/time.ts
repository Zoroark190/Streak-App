import { DateTime } from 'luxon'

export const TIMEZONE = 'Europe/Amsterdam'

/**
 * Get the current DateTime in Amsterdam timezone.
 */
export function now(): DateTime {
  return DateTime.now().setZone(TIMEZONE)
}

/**
 * Convert a JS Date or ISO string to Amsterdam DateTime.
 */
export function toAmsterdamDateTime(date: Date | string): DateTime {
  if (typeof date === 'string') {
    return DateTime.fromISO(date).setZone(TIMEZONE)
  }
  return DateTime.fromJSDate(date).setZone(TIMEZONE)
}

/**
 * Check if a DateTime falls on a weekday (Mon-Fri).
 */
export function isWeekday(dt: DateTime): boolean {
  return dt.weekday >= 1 && dt.weekday <= 5
}

/**
 * Check if two DateTimes are on the same calendar day in Amsterdam.
 */
export function isSameDay(dt1: DateTime, dt2: DateTime): boolean {
  const a = dt1.setZone(TIMEZONE)
  const b = dt2.setZone(TIMEZONE)
  return a.year === b.year && a.month === b.month && a.day === b.day
}

/**
 * Check if a date is a recognized holiday (Dec 25 or Jan 1) on a weekday.
 */
export function isHoliday(dt: DateTime): boolean {
  const d = dt.setZone(TIMEZONE)
  const isHolidayDate = (d.month === 12 && d.day === 25) || (d.month === 1 && d.day === 1)
  return isHolidayDate && isWeekday(d)
}

/**
 * Get the end of day (23:59:59.999) for a given DateTime in Amsterdam.
 */
export function endOfDay(dt: DateTime): DateTime {
  return dt.setZone(TIMEZONE).set({ hour: 23, minute: 59, second: 59, millisecond: 999 })
}

/**
 * Calculate the current month period based on an anchor date.
 * The anchor repeats monthly: we find the most recent occurrence of the anchor's
 * day-of-month at the anchor's time-of-day.
 */
export function getMonthPeriod(anchorISO: string): { start: DateTime; end: DateTime } {
  const anchor = DateTime.fromISO(anchorISO).setZone(TIMEZONE)
  const current = now()

  const anchorDay = anchor.day
  const anchorTime = { hour: anchor.hour, minute: anchor.minute, second: anchor.second }

  // Try this month's anchor
  let periodStart = current.set({ day: anchorDay, ...anchorTime, millisecond: 0 })

  // If the anchor day doesn't exist in this month (e.g., day 31 in a 30-day month),
  // use the last day of the month
  if (periodStart.day !== anchorDay) {
    periodStart = current.endOf('month').set(anchorTime)
  }

  // If we haven't reached this month's anchor yet, use last month's
  if (periodStart > current) {
    periodStart = periodStart.minus({ months: 1 })
    // Re-check day validity for previous month
    if (periodStart.day !== anchorDay) {
      periodStart = periodStart.endOf('month').set(anchorTime)
    }
  }

  // End is the next month's anchor
  let periodEnd = periodStart.plus({ months: 1 })
  if (periodEnd.day !== anchorDay) {
    periodEnd = periodEnd.endOf('month').set(anchorTime)
  }

  return { start: periodStart, end: periodEnd }
}

/**
 * Count the number of weekdays between start and end (inclusive of start, exclusive of end by default).
 * If excludeEnd is true, the end date is not counted.
 */
export function countElapsedWeekdays(
  start: DateTime,
  end: DateTime,
  holidays: DateTime[] = []
): number {
  let count = 0
  let current = start.setZone(TIMEZONE).startOf('day')
  const endDay = end.setZone(TIMEZONE).startOf('day')

  while (current <= endDay) {
    if (isWeekday(current)) {
      const isExcluded = holidays.some(h => isSameDay(h, current))
      if (!isExcluded) {
        count++
      }
    }
    current = current.plus({ days: 1 })
  }

  return count
}

/**
 * Get all holiday dates within a period that fall on weekdays.
 */
export function getHolidaysInPeriod(start: DateTime, end: DateTime): DateTime[] {
  const holidays: DateTime[] = []
  let current = start.setZone(TIMEZONE).startOf('day')
  const endDay = end.setZone(TIMEZONE).startOf('day')

  while (current <= endDay) {
    if (isHoliday(current)) {
      holidays.push(current)
    }
    current = current.plus({ days: 1 })
  }

  return holidays
}

/**
 * Format a DateTime in 12-hour format with AM/PM.
 */
export function formatTime12h(dt: DateTime): string {
  return dt.setZone(TIMEZONE).toFormat('h:mm a')
}

/**
 * Format a DateTime as a short date string.
 */
export function formatDate(dt: DateTime): string {
  return dt.setZone(TIMEZONE).toFormat('ccc, LLL d')
}
