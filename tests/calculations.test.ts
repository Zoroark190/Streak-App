import { describe, it, expect } from 'vitest'
import { DateTime } from 'luxon'
import {
  calculateActualHours,
  calculateAttendanceCount,
  calculateAverageStay,
  shouldBeRed,
  isStaleSession,
  calculateAutoCloseEndTime,
  calculateDurationHours,
  calculateSignOutEndTime,
  getSessionsLast7Days,
  type Session,
} from '../src/lib/calculations'
import { TIMEZONE } from '../src/lib/time'

function createSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'test-session',
    startTime: new Date('2024-01-15T09:00:00+01:00'),
    endTime: new Date('2024-01-15T17:00:00+01:00'),
    durationHours: 8,
    verification: {
      method: 'geolocation',
      distanceMeters: 100,
      withinRadius: true,
      accuracyMeters: 10,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('calculateActualHours', () => {
  it('should sum duration of closed sessions', () => {
    const sessions = [
      createSession({ durationHours: 8 }),
      createSession({ durationHours: 6.5 }),
      createSession({ durationHours: 7 }),
    ]
    expect(calculateActualHours(sessions)).toBeCloseTo(21.5)
  })

  it('should ignore open sessions (endTime is null)', () => {
    const sessions = [
      createSession({ durationHours: 8 }),
      createSession({ endTime: null, durationHours: null }),
    ]
    expect(calculateActualHours(sessions)).toBeCloseTo(8)
  })

  it('should return 0 for no sessions', () => {
    expect(calculateActualHours([])).toBe(0)
  })

  it('should return 0 when all sessions are open', () => {
    const sessions = [
      createSession({ endTime: null, durationHours: null }),
    ]
    expect(calculateActualHours(sessions)).toBe(0)
  })
})

describe('calculateAttendanceCount', () => {
  it('should count unique days', () => {
    const sessions = [
      createSession({ startTime: new Date('2024-01-15T09:00:00+01:00') }),
      createSession({ startTime: new Date('2024-01-16T09:00:00+01:00') }),
      createSession({ startTime: new Date('2024-01-17T09:00:00+01:00') }),
    ]
    expect(calculateAttendanceCount(sessions)).toBe(3)
  })

  it('should not double-count same day sessions', () => {
    const sessions = [
      createSession({ startTime: new Date('2024-01-15T09:00:00+01:00') }),
      createSession({ startTime: new Date('2024-01-15T14:00:00+01:00') }),
    ]
    expect(calculateAttendanceCount(sessions)).toBe(1)
  })

  it('should return 0 for no sessions', () => {
    expect(calculateAttendanceCount([])).toBe(0)
  })
})

describe('calculateAverageStay', () => {
  it('should calculate average hours per day', () => {
    const sessions = [
      createSession({
        startTime: new Date('2024-01-15T09:00:00+01:00'),
        durationHours: 8,
      }),
      createSession({
        startTime: new Date('2024-01-16T09:00:00+01:00'),
        durationHours: 6,
      }),
    ]
    expect(calculateAverageStay(sessions)).toBeCloseTo(7) // (8+6)/2
  })

  it('should aggregate multiple sessions on same day', () => {
    const sessions = [
      createSession({
        startTime: new Date('2024-01-15T09:00:00+01:00'),
        durationHours: 4,
      }),
      createSession({
        startTime: new Date('2024-01-15T14:00:00+01:00'),
        durationHours: 4,
      }),
    ]
    // Total 8 hours, 1 day attended = 8 avg
    expect(calculateAverageStay(sessions)).toBeCloseTo(8)
  })

  it('should return 0 for no sessions', () => {
    expect(calculateAverageStay([])).toBe(0)
  })

  it('should ignore open sessions', () => {
    const sessions = [
      createSession({ durationHours: 6 }),
      createSession({ endTime: null, durationHours: null }),
    ]
    expect(calculateAverageStay(sessions)).toBeCloseTo(6)
  })
})

describe('shouldBeRed', () => {
  it('should return true when behind', () => {
    expect(shouldBeRed(20, 30)).toBe(true)
  })

  it('should return false when on track', () => {
    expect(shouldBeRed(30, 30)).toBe(false)
  })

  it('should return false when ahead', () => {
    expect(shouldBeRed(35, 30)).toBe(false)
  })

  it('should return false when both are 0', () => {
    expect(shouldBeRed(0, 0)).toBe(false)
  })
})

describe('isStaleSession', () => {
  it('should return false for a closed session', () => {
    const session = createSession({
      endTime: new Date(),
    })
    expect(isStaleSession(session)).toBe(false)
  })

  it('should return false for an open session from today', () => {
    const session = createSession({
      startTime: new Date(), // today
      endTime: null,
    })
    expect(isStaleSession(session)).toBe(false)
  })

  it('should return true for an open session from yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(10, 0, 0, 0)

    const session = createSession({
      startTime: yesterday,
      endTime: null,
      durationHours: null,
    })
    expect(isStaleSession(session)).toBe(true)
  })
})

describe('calculateAutoCloseEndTime', () => {
  it('should cap at start + 2 hours when that is before end of day', () => {
    // Session started at 10:00 AM -> should close at 12:00 PM
    const session = createSession({
      startTime: new Date('2024-01-15T10:00:00+01:00'),
      endTime: null,
    })
    const endTime = calculateAutoCloseEndTime(session)
    const endDt = DateTime.fromJSDate(endTime).setZone(TIMEZONE)
    expect(endDt.hour).toBe(12)
    expect(endDt.minute).toBe(0)
  })

  it('should cap at 23:59 when start + 2 hours exceeds midnight', () => {
    // Session started at 11:30 PM -> start + 2h = 1:30 AM next day -> should cap at 23:59
    const session = createSession({
      startTime: new Date('2024-01-15T23:30:00+01:00'),
      endTime: null,
    })
    const endTime = calculateAutoCloseEndTime(session)
    const endDt = DateTime.fromJSDate(endTime).setZone(TIMEZONE)
    expect(endDt.hour).toBe(23)
    expect(endDt.minute).toBe(59)
    expect(endDt.day).toBe(15)
  })

  it('should use start + 2 hours for mid-day sessions', () => {
    const session = createSession({
      startTime: new Date('2024-01-15T14:00:00+01:00'),
      endTime: null,
    })
    const endTime = calculateAutoCloseEndTime(session)
    const endDt = DateTime.fromJSDate(endTime).setZone(TIMEZONE)
    expect(endDt.hour).toBe(16)
  })
})

describe('calculateDurationHours', () => {
  it('should calculate correct duration', () => {
    const start = new Date('2024-01-15T09:00:00+01:00')
    const end = new Date('2024-01-15T17:00:00+01:00')
    expect(calculateDurationHours(start, end)).toBeCloseTo(8)
  })

  it('should handle partial hours', () => {
    const start = new Date('2024-01-15T09:00:00+01:00')
    const end = new Date('2024-01-15T10:30:00+01:00')
    expect(calculateDurationHours(start, end)).toBeCloseTo(1.5)
  })

  it('should return 0 for same time', () => {
    const time = new Date('2024-01-15T09:00:00+01:00')
    expect(calculateDurationHours(time, time)).toBeCloseTo(0)
  })
})

describe('calculateSignOutEndTime', () => {
  it('should return current time for same-day sign out', () => {
    const session = createSession({
      startTime: new Date(), // today
      endTime: null,
    })
    const endTime = calculateSignOutEndTime(session)
    // Should be approximately now
    const diff = Math.abs(endTime.getTime() - Date.now())
    expect(diff).toBeLessThan(5000) // within 5 seconds
  })

  it('should apply punishment rule for next-day sign out', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(10, 0, 0, 0)

    const session = createSession({
      startTime: yesterday,
      endTime: null,
    })
    const endTime = calculateSignOutEndTime(session)
    const endDt = DateTime.fromJSDate(endTime).setZone(TIMEZONE)
    // Should be capped at yesterday 12:00 (10:00 + 2 hours)
    expect(endDt.hour).toBe(12)
  })
})

describe('getSessionsLast7Days', () => {
  it('should include sessions from recent days', () => {
    const recentSession = createSession({
      startTime: new Date(), // today
    })
    const result = getSessionsLast7Days([recentSession])
    expect(result.length).toBe(1)
  })

  it('should exclude sessions older than 7 days', () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 10)
    const oldSession = createSession({
      startTime: oldDate,
    })
    const result = getSessionsLast7Days([oldSession])
    expect(result.length).toBe(0)
  })

  it('should include session from exactly 7 days ago', () => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(12, 0, 0, 0)
    const session = createSession({
      startTime: sevenDaysAgo,
    })
    const result = getSessionsLast7Days([session])
    expect(result.length).toBe(1)
  })
})
