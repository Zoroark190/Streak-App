import { toAmsterdamDateTime } from './time'
import type { Session } from './calculations'
import type { MLSession } from './mlFirestore'

/**
 * Sum university session hours for a given day (ISO date string like "2026-02-15").
 */
export function getUniHoursForDay(sessions: Session[], isoDate: string): number {
  return sessions
    .filter(s => {
      if (s.endTime === null || s.durationHours === null) return false
      return toAmsterdamDateTime(s.startTime).toISODate() === isoDate
    })
    .reduce((sum, s) => sum + (s.durationHours ?? 0), 0)
}

/**
 * Sum ML session hours for a given day (ISO date string like "2026-02-15").
 */
export function getMLHoursForDay(mlSessions: MLSession[], isoDate: string): number {
  return mlSessions
    .filter(s => {
      if (s.endTime === null || s.durationHours === null) return false
      return toAmsterdamDateTime(s.startTime).toISODate() === isoDate
    })
    .reduce((sum, s) => sum + (s.durationHours ?? 0), 0)
}

/**
 * Compute the auto-tick defaults for ML and Uni checkboxes for a given day.
 */
export function computeAutoTicks(
  sessions: Session[],
  mlSessions: MLSession[],
  isoDate: string
): { ml: boolean; uni: boolean } {
  return {
    ml: getMLHoursForDay(mlSessions, isoDate) >= 1,
    uni: getUniHoursForDay(sessions, isoDate) >= 8,
  }
}
