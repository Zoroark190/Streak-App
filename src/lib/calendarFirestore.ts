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

// Value meanings: -1=white/none, 0=green, 1=red, 2=dark red
export type DayValue = -1 | 0 | 1 | 2

export interface CalendarMonthData {
  entries: Record<string, DayValue>
  updatedAt: Date
}

function getDocId(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
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
      callback({
        entries: data.entries ?? {},
        updatedAt: data.updatedAt?.toDate() ?? new Date(),
      })
    },
    (error) => {
      console.error('Error subscribing to calendar month:', error)
      // Return empty entries so loading completes
      callback({ entries: {}, updatedAt: new Date() })
      if (onError) {
        onError(error)
      }
    }
  )
}

/**
 * Update a single day's value in the calendar.
 */
export async function updateCalendarDay(
  year: number,
  month: number,
  day: number,
  value: DayValue
): Promise<void> {
  const docRef = doc(db, 'calendarEntries', getDocId(year, month))
  const snap = await getDoc(docRef)

  if (!snap.exists()) {
    // Create document if it doesn't exist
    await setDoc(docRef, {
      entries: value === -1 ? {} : { [String(day)]: value },
      updatedAt: Timestamp.now(),
    })
  } else {
    // Update existing document
    if (value === -1) {
      // Remove entry for white (saves storage)
      const currentEntries = { ...(snap.data().entries ?? {}) }
      delete currentEntries[String(day)]
      await updateDoc(docRef, {
        entries: currentEntries,
        updatedAt: Timestamp.now(),
      })
    } else {
      await updateDoc(docRef, {
        [`entries.${day}`]: value,
        updatedAt: Timestamp.now(),
      })
    }
  }
}
