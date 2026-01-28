import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  orderBy,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Session } from './calculations'

export interface AppConfig {
  monthStartAnchorDateTime: string | null
  dailyTargetHours: number
  holidayExclusionsEnabled: boolean
  // ML Learning fields
  mlWeeklyTargetHours: number
  mlWeekStartAnchor: string | null
  mlLastPageMathML: number
  mlLastPageProbML: number
}

const CONFIG_DOC_PATH = 'config/app'

/**
 * Get the app config document.
 */
export async function getConfig(): Promise<AppConfig> {
  const docRef = doc(db, CONFIG_DOC_PATH)
  const snap = await getDoc(docRef)

  if (!snap.exists()) {
    return {
      monthStartAnchorDateTime: null,
      dailyTargetHours: 7.5,
      holidayExclusionsEnabled: true,
      mlWeeklyTargetHours: 20,
      mlWeekStartAnchor: null,
      mlLastPageMathML: 0,
      mlLastPageProbML: 0,
    }
  }

  const data = snap.data()
  return {
    monthStartAnchorDateTime: data.monthStartAnchorDateTime ?? null,
    dailyTargetHours: data.dailyTargetHours ?? 7.5,
    holidayExclusionsEnabled: data.holidayExclusionsEnabled ?? true,
    mlWeeklyTargetHours: data.mlWeeklyTargetHours ?? 20,
    mlWeekStartAnchor: data.mlWeekStartAnchor ?? null,
    mlLastPageMathML: data.mlLastPageMathML ?? 0,
    mlLastPageProbML: data.mlLastPageProbML ?? 0,
  }
}

/**
 * Subscribe to config changes in realtime.
 */
export function subscribeToConfig(callback: (config: AppConfig) => void): Unsubscribe {
  const docRef = doc(db, CONFIG_DOC_PATH)
  return onSnapshot(docRef, (snap) => {
    if (!snap.exists()) {
      callback({
        monthStartAnchorDateTime: null,
        dailyTargetHours: 7.5,
        holidayExclusionsEnabled: true,
        mlWeeklyTargetHours: 20,
        mlWeekStartAnchor: null,
        mlLastPageMathML: 0,
        mlLastPageProbML: 0,
      })
      return
    }

    const data = snap.data()
    callback({
      monthStartAnchorDateTime: data.monthStartAnchorDateTime ?? null,
      dailyTargetHours: data.dailyTargetHours ?? 7.5,
      holidayExclusionsEnabled: data.holidayExclusionsEnabled ?? true,
      mlWeeklyTargetHours: data.mlWeeklyTargetHours ?? 20,
      mlWeekStartAnchor: data.mlWeekStartAnchor ?? null,
      mlLastPageMathML: data.mlLastPageMathML ?? 0,
      mlLastPageProbML: data.mlLastPageProbML ?? 0,
    })
  })
}

/**
 * Set the month anchor (one-time initialization).
 */
export async function setMonthAnchor(anchorDateTime: string): Promise<void> {
  const docRef = doc(db, CONFIG_DOC_PATH)
  const snap = await getDoc(docRef)

  if (snap.exists()) {
    await updateDoc(docRef, { monthStartAnchorDateTime: anchorDateTime })
  } else {
    await setDoc(docRef, {
      monthStartAnchorDateTime: anchorDateTime,
      dailyTargetHours: 7.5,
      holidayExclusionsEnabled: true,
    })
  }
}

/**
 * Update config fields.
 */
export async function updateConfig(updates: Partial<Omit<AppConfig, 'monthStartAnchorDateTime'>>): Promise<void> {
  const docRef = doc(db, CONFIG_DOC_PATH)
  await updateDoc(docRef, updates)
}

/**
 * Create a new session.
 */
export async function createSession(
  startTime: Date,
  verification: {
    method: string
    distanceMeters: number
    withinRadius: boolean
    accuracyMeters: number | null
  }
): Promise<string> {
  const sessionsRef = collection(db, 'sessions')
  const newDocRef = doc(sessionsRef)

  await setDoc(newDocRef, {
    startTime: Timestamp.fromDate(startTime),
    endTime: null,
    savedTime: null,
    durationHours: null,
    verification,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })

  return newDocRef.id
}

/**
 * Save a checkpoint time for a session.
 */
export async function saveSession(sessionId: string, savedTime: Date): Promise<void> {
  const docRef = doc(db, 'sessions', sessionId)
  await updateDoc(docRef, {
    savedTime: Timestamp.fromDate(savedTime),
    updatedAt: Timestamp.now(),
  })
}

/**
 * Close a session by setting endTime and durationHours.
 */
export async function closeSession(
  sessionId: string,
  endTime: Date,
  durationHours: number
): Promise<void> {
  const docRef = doc(db, 'sessions', sessionId)
  await updateDoc(docRef, {
    endTime: Timestamp.fromDate(endTime),
    durationHours,
    updatedAt: Timestamp.now(),
  })
}

/**
 * Subscribe to all sessions in realtime.
 */
export function subscribeToSessions(callback: (sessions: Session[]) => void): Unsubscribe {
  const sessionsRef = collection(db, 'sessions')
  const q = query(sessionsRef, orderBy('startTime', 'desc'))

  return onSnapshot(q, (snapshot) => {
    const sessions: Session[] = snapshot.docs.map(docSnap => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        startTime: (data.startTime as Timestamp).toDate(),
        endTime: data.endTime ? (data.endTime as Timestamp).toDate() : null,
        savedTime: data.savedTime ? (data.savedTime as Timestamp).toDate() : null,
        durationHours: data.durationHours ?? null,
        verification: data.verification,
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: (data.updatedAt as Timestamp).toDate(),
      }
    })
    callback(sessions)
  })
}

/**
 * Get the currently open session (endTime == null).
 */
export function getOpenSession(sessions: Session[]): Session | null {
  return sessions.find(s => s.endTime === null) ?? null
}

/**
 * Subscribe to open session only.
 */
export function subscribeToOpenSession(callback: (session: Session | null) => void): Unsubscribe {
  const sessionsRef = collection(db, 'sessions')
  const q = query(sessionsRef, where('endTime', '==', null))

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(null)
      return
    }

    const docSnap = snapshot.docs[0]
    const data = docSnap.data()
    callback({
      id: docSnap.id,
      startTime: (data.startTime as Timestamp).toDate(),
      endTime: null,
      savedTime: data.savedTime ? (data.savedTime as Timestamp).toDate() : null,
      durationHours: null,
      verification: data.verification,
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
    })
  })
}
