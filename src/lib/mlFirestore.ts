import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'

export interface MLSession {
  id: string
  startTime: Date
  endTime: Date | null
  pausedDuration: number // Accumulated paused time in milliseconds
  isPaused: boolean
  currentPauseStart: Date | null
  pageMathML: number
  pageProbML: number
  notes: string | null
  durationHours: number | null
  createdAt: Date
  updatedAt: Date
}

const CONFIG_DOC_PATH = 'config/app'

/**
 * Create a new ML session.
 */
export async function createMLSession(startTime: Date): Promise<string> {
  const sessionsRef = collection(db, 'mlSessions')
  const newDocRef = doc(sessionsRef)

  await setDoc(newDocRef, {
    startTime: Timestamp.fromDate(startTime),
    endTime: null,
    pausedDuration: 0,
    isPaused: false,
    currentPauseStart: null,
    pageMathML: 0,
    pageProbML: 0,
    notes: null,
    durationHours: null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })

  return newDocRef.id
}

/**
 * Pause an ML session.
 */
export async function pauseMLSession(sessionId: string, pauseTime: Date): Promise<void> {
  const docRef = doc(db, 'mlSessions', sessionId)
  await updateDoc(docRef, {
    isPaused: true,
    currentPauseStart: Timestamp.fromDate(pauseTime),
    updatedAt: Timestamp.now(),
  })
}

/**
 * Resume an ML session.
 */
export async function resumeMLSession(
  sessionId: string,
  resumeTime: Date,
  currentPauseStart: Date,
  currentPausedDuration: number
): Promise<void> {
  const docRef = doc(db, 'mlSessions', sessionId)

  // Calculate additional paused time from this pause period
  const additionalPausedMs = resumeTime.getTime() - currentPauseStart.getTime()
  const newPausedDuration = currentPausedDuration + additionalPausedMs

  await updateDoc(docRef, {
    isPaused: false,
    currentPauseStart: null,
    pausedDuration: newPausedDuration,
    updatedAt: Timestamp.now(),
  })
}

/**
 * Close an ML session with end data.
 */
export async function closeMLSession(
  sessionId: string,
  endData: {
    endTime: Date
    pageMathML: number
    pageProbML: number
    notes: string | null
    durationHours: number
  }
): Promise<void> {
  const docRef = doc(db, 'mlSessions', sessionId)
  await updateDoc(docRef, {
    endTime: Timestamp.fromDate(endData.endTime),
    pageMathML: endData.pageMathML,
    pageProbML: endData.pageProbML,
    notes: endData.notes,
    durationHours: endData.durationHours,
    isPaused: false,
    currentPauseStart: null,
    updatedAt: Timestamp.now(),
  })
}

/**
 * Delete an ML session without saving it.
 */
export async function deleteMLSession(sessionId: string): Promise<void> {
  const docRef = doc(db, 'mlSessions', sessionId)
  await deleteDoc(docRef)
}

/**
 * Subscribe to all ML sessions in realtime.
 */
export function subscribeToMLSessions(
  callback: (sessions: MLSession[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const sessionsRef = collection(db, 'mlSessions')

  // Subscribe without orderBy to avoid index requirement
  // We'll sort client-side instead
  return onSnapshot(
    sessionsRef,
    (snapshot) => {
      console.log('ML Sessions snapshot received:', snapshot.docs.length, 'documents')
      const sessions: MLSession[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data()
        console.log('Processing ML session:', docSnap.id, data)
        return {
          id: docSnap.id,
          startTime: (data.startTime as Timestamp).toDate(),
          endTime: data.endTime ? (data.endTime as Timestamp).toDate() : null,
          pausedDuration: data.pausedDuration ?? 0,
          isPaused: data.isPaused ?? false,
          currentPauseStart: data.currentPauseStart ? (data.currentPauseStart as Timestamp).toDate() : null,
          pageMathML: data.pageMathML ?? 0,
          pageProbML: data.pageProbML ?? 0,
          notes: data.notes ?? null,
          durationHours: data.durationHours ?? null,
          createdAt: (data.createdAt as Timestamp).toDate(),
          updatedAt: (data.updatedAt as Timestamp).toDate(),
        }
      })
      // Sort by startTime descending (newest first) client-side
      sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      console.log('Calling callback with', sessions.length, 'sessions, open session:', sessions.find(s => s.endTime === null)?.id)
      callback(sessions)
    },
    (error) => {
      console.error('Error subscribing to ML sessions:', error)
      // Call callback with empty array so loading completes
      callback([])
      if (onError) {
        onError(error)
      }
    }
  )
}

/**
 * Get the currently open ML session (endTime == null).
 */
export function getOpenMLSession(sessions: MLSession[]): MLSession | null {
  return sessions.find(s => s.endTime === null) ?? null
}

/**
 * Update ML last page numbers and week anchor in config.
 */
export async function updateMLConfig(updates: {
  mlLastPageMathML?: number
  mlLastPageProbML?: number
  mlWeekStartAnchor?: string
  mlWeeklyTargetHours?: number
}): Promise<void> {
  const docRef = doc(db, CONFIG_DOC_PATH)
  await updateDoc(docRef, updates)
}
