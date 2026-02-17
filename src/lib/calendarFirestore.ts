import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'

export interface DayCheckboxes {
  reading: boolean
  gym: boolean
  called: boolean
  ml: boolean
  uni: boolean
  n: boolean
}

export const DEFAULT_CHECKBOXES: DayCheckboxes = {
  reading: false,
  gym: false,
  called: false,
  ml: false,
  uni: false,
  n: false,
}

export interface CalendarMonthData {
  entries: Record<string, DayCheckboxes>
  updatedAt: Date
}

/**
 * Calculate the score for a day based on its checkboxes.
 * Score = count of main 5 checked - (N ? 1 : 0)
 * Range: -1 to 5
 */
export function calculateDayScore(checkboxes: DayCheckboxes): number {
  const mainCount = [
    checkboxes.reading,
    checkboxes.gym,
    checkboxes.called,
    checkboxes.ml,
    checkboxes.uni,
  ].filter(Boolean).length
  return mainCount - (checkboxes.n ? 1 : 0)
}

function getDocId(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function isValidDayCheckboxes(value: unknown): value is DayCheckboxes {
  return typeof value === 'object' && value !== null && 'reading' in value
}

/**
 * Subscribe to a calendar month's entries in realtime.
 */
export function subscribeToCalendarMonth(
  year: number,
  month: number,
  callback: (data: CalendarMonthData) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const docRef = doc(db, 'calendarEntries', getDocId(year, month))

  return onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) {
        callback({ entries: {}, updatedAt: new Date() })
        return
      }
      const data = snap.data()
      const rawEntries = data.entries ?? {}

      // Filter out old numeric entries (backward compatibility)
      const entries: Record<string, DayCheckboxes> = {}
      for (const [key, value] of Object.entries(rawEntries)) {
        if (isValidDayCheckboxes(value)) {
          entries[key] = value
        }
      }

      callback({
        entries,
        updatedAt: data.updatedAt?.toDate() ?? new Date(),
      })
    },
    (error) => {
      console.error('Error subscribing to calendar month:', error)
      callback({ entries: {}, updatedAt: new Date() })
      if (onError) {
        onError(error)
      }
    }
  )
}

/**
 * Update a single day's checkboxes in the calendar.
 */
export async function updateCalendarDay(
  year: number,
  month: number,
  day: number,
  checkboxes: DayCheckboxes
): Promise<void> {
  const docRef = doc(db, 'calendarEntries', getDocId(year, month))
  const snap = await getDoc(docRef)

  const allFalse = Object.values(checkboxes).every(v => !v)

  if (!snap.exists()) {
    await setDoc(docRef, {
      entries: allFalse ? {} : { [String(day)]: checkboxes },
      updatedAt: Timestamp.now(),
    })
  } else {
    if (allFalse) {
      // Remove entry when all unchecked (saves storage)
      const currentEntries = { ...(snap.data().entries ?? {}) }
      delete currentEntries[String(day)]
      await updateDoc(docRef, {
        entries: currentEntries,
        updatedAt: Timestamp.now(),
      })
    } else {
      await updateDoc(docRef, {
        [`entries.${day}`]: checkboxes,
        updatedAt: Timestamp.now(),
      })
    }
  }
}
