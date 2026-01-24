import { describe, it, expect } from 'vitest'
import { DateTime } from 'luxon'
import {
  isWeekday,
  isSameDay,
  isHoliday,
  endOfDay,
  getMonthPeriod,
  countElapsedWeekdays,
  getHolidaysInPeriod,
  toAmsterdamDateTime,
  formatTime12h,
  TIMEZONE,
} from '../src/lib/time'

describe('isWeekday', () => {
  it('should return true for Monday through Friday', () => {
    // 2024-01-08 is a Monday
    const monday = DateTime.fromISO('2024-01-08', { zone: TIMEZONE })
    expect(isWeekday(monday)).toBe(true)

    const friday = DateTime.fromISO('2024-01-12', { zone: TIMEZONE })
    expect(isWeekday(friday)).toBe(true)
  })

  it('should return false for Saturday and Sunday', () => {
    const saturday = DateTime.fromISO('2024-01-13', { zone: TIMEZONE })
    expect(isWeekday(saturday)).toBe(false)

    const sunday = DateTime.fromISO('2024-01-14', { zone: TIMEZONE })
    expect(isWeekday(sunday)).toBe(false)
  })
})

describe('isSameDay', () => {
  it('should return true for same calendar day', () => {
    const dt1 = DateTime.fromISO('2024-01-15T09:00:00', { zone: TIMEZONE })
    const dt2 = DateTime.fromISO('2024-01-15T22:00:00', { zone: TIMEZONE })
    expect(isSameDay(dt1, dt2)).toBe(true)
  })

  it('should return false for different days', () => {
    const dt1 = DateTime.fromISO('2024-01-15T23:00:00', { zone: TIMEZONE })
    const dt2 = DateTime.fromISO('2024-01-16T01:00:00', { zone: TIMEZONE })
    expect(isSameDay(dt1, dt2)).toBe(false)
  })
})

describe('isHoliday', () => {
  it('should return true for Dec 25 on a weekday', () => {
    // 2024-12-25 is a Wednesday
    const christmas = DateTime.fromISO('2024-12-25', { zone: TIMEZONE })
    expect(isHoliday(christmas)).toBe(true)
  })

  it('should return true for Jan 1 on a weekday', () => {
    // 2025-01-01 is a Wednesday
    const newYear = DateTime.fromISO('2025-01-01', { zone: TIMEZONE })
    expect(isHoliday(newYear)).toBe(true)
  })

  it('should return false for Dec 25 on a weekend', () => {
    // 2022-12-25 is a Sunday
    const christmas = DateTime.fromISO('2022-12-25', { zone: TIMEZONE })
    expect(isHoliday(christmas)).toBe(false)
  })

  it('should return false for a regular weekday', () => {
    const regular = DateTime.fromISO('2024-03-15', { zone: TIMEZONE })
    expect(isHoliday(regular)).toBe(false)
  })
})

describe('endOfDay', () => {
  it('should return 23:59:59.999 of the same day', () => {
    const dt = DateTime.fromISO('2024-01-15T10:30:00', { zone: TIMEZONE })
    const eod = endOfDay(dt)
    expect(eod.hour).toBe(23)
    expect(eod.minute).toBe(59)
    expect(eod.second).toBe(59)
    expect(eod.day).toBe(15)
  })
})

describe('countElapsedWeekdays', () => {
  it('should count weekdays in a full week', () => {
    const start = DateTime.fromISO('2024-01-08', { zone: TIMEZONE }) // Monday
    const end = DateTime.fromISO('2024-01-14', { zone: TIMEZONE })   // Sunday
    expect(countElapsedWeekdays(start, end)).toBe(5)
  })

  it('should count weekdays in a partial week', () => {
    const start = DateTime.fromISO('2024-01-08', { zone: TIMEZONE }) // Monday
    const end = DateTime.fromISO('2024-01-10', { zone: TIMEZONE })   // Wednesday
    expect(countElapsedWeekdays(start, end)).toBe(3)
  })

  it('should return 0 for a weekend only', () => {
    const start = DateTime.fromISO('2024-01-13', { zone: TIMEZONE }) // Saturday
    const end = DateTime.fromISO('2024-01-14', { zone: TIMEZONE })   // Sunday
    expect(countElapsedWeekdays(start, end)).toBe(0)
  })

  it('should exclude specified holidays', () => {
    const start = DateTime.fromISO('2024-12-23', { zone: TIMEZONE }) // Monday
    const end = DateTime.fromISO('2024-12-27', { zone: TIMEZONE })   // Friday
    const holidays = [DateTime.fromISO('2024-12-25', { zone: TIMEZONE })]
    expect(countElapsedWeekdays(start, end, holidays)).toBe(4) // 5 weekdays minus 1 holiday
  })

  it('should count two weeks correctly', () => {
    const start = DateTime.fromISO('2024-01-08', { zone: TIMEZONE }) // Monday
    const end = DateTime.fromISO('2024-01-19', { zone: TIMEZONE })   // Friday
    expect(countElapsedWeekdays(start, end)).toBe(10)
  })
})

describe('getHolidaysInPeriod', () => {
  it('should find Christmas when it falls on a weekday', () => {
    const start = DateTime.fromISO('2024-12-01', { zone: TIMEZONE })
    const end = DateTime.fromISO('2024-12-31', { zone: TIMEZONE })
    const holidays = getHolidaysInPeriod(start, end)
    expect(holidays.length).toBe(1) // Dec 25, 2024 is Wednesday
    expect(holidays[0].day).toBe(25)
  })

  it('should find New Year when it falls on a weekday', () => {
    const start = DateTime.fromISO('2024-12-30', { zone: TIMEZONE })
    const end = DateTime.fromISO('2025-01-05', { zone: TIMEZONE })
    const holidays = getHolidaysInPeriod(start, end)
    expect(holidays.length).toBe(1) // Jan 1, 2025 is Wednesday
  })

  it('should return empty for a period with no holidays', () => {
    const start = DateTime.fromISO('2024-03-01', { zone: TIMEZONE })
    const end = DateTime.fromISO('2024-03-31', { zone: TIMEZONE })
    const holidays = getHolidaysInPeriod(start, end)
    expect(holidays.length).toBe(0)
  })
})

describe('getMonthPeriod', () => {
  it('should calculate period starting from anchor day', () => {
    // If anchor is Jan 15, and current date is Jan 20, period is Jan 15 - Feb 15
    const anchor = '2024-01-15T10:00:00.000+01:00'
    const { start, end } = getMonthPeriod(anchor)
    expect(start.day).toBe(15)
    expect(end.day).toBe(15)
    expect(end.diff(start, 'months').months).toBeCloseTo(1, 0)
  })
})

describe('toAmsterdamDateTime', () => {
  it('should convert a Date to Amsterdam timezone', () => {
    const date = new Date('2024-06-15T12:00:00Z')
    const dt = toAmsterdamDateTime(date)
    expect(dt.zoneName).toBe(TIMEZONE)
    // In June, Amsterdam is UTC+2
    expect(dt.hour).toBe(14)
  })

  it('should convert an ISO string to Amsterdam timezone', () => {
    const dt = toAmsterdamDateTime('2024-01-15T12:00:00Z')
    expect(dt.zoneName).toBe(TIMEZONE)
    // In January, Amsterdam is UTC+1
    expect(dt.hour).toBe(13)
  })
})

describe('formatTime12h', () => {
  it('should format morning time correctly', () => {
    const dt = DateTime.fromISO('2024-01-15T09:30:00', { zone: TIMEZONE })
    expect(formatTime12h(dt)).toBe('9:30 AM')
  })

  it('should format afternoon time correctly', () => {
    const dt = DateTime.fromISO('2024-01-15T14:45:00', { zone: TIMEZONE })
    expect(formatTime12h(dt)).toBe('2:45 PM')
  })

  it('should format noon correctly', () => {
    const dt = DateTime.fromISO('2024-01-15T12:00:00', { zone: TIMEZONE })
    expect(formatTime12h(dt)).toBe('12:00 PM')
  })

  it('should format midnight correctly', () => {
    const dt = DateTime.fromISO('2024-01-15T00:00:00', { zone: TIMEZONE })
    expect(formatTime12h(dt)).toBe('12:00 AM')
  })
})
