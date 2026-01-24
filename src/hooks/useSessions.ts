import { useState, useEffect, useRef } from 'react'
import { subscribeToSessions, getOpenSession, closeSession } from '../lib/firestore'
import {
  type Session,
  isStaleSession,
  calculateAutoCloseEndTime,
  calculateDurationHours,
} from '../lib/calculations'

export interface SessionsState {
  sessions: Session[]
  openSession: Session | null
  loading: boolean
}

export function useSessions(): SessionsState {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const autoCloseProcessed = useRef<Set<string>>(new Set())

  useEffect(() => {
    const unsubscribe = subscribeToSessions(async (newSessions) => {
      setSessions(newSessions)
      setLoading(false)

      // Auto-close stale sessions
      for (const session of newSessions) {
        if (isStaleSession(session) && !autoCloseProcessed.current.has(session.id)) {
          autoCloseProcessed.current.add(session.id)
          const endTime = calculateAutoCloseEndTime(session)
          const duration = calculateDurationHours(session.startTime, endTime)
          try {
            await closeSession(session.id, endTime, duration)
          } catch (err) {
            console.error('Failed to auto-close session:', err)
            autoCloseProcessed.current.delete(session.id)
          }
        }
      }
    })

    return unsubscribe
  }, [])

  const openSession = getOpenSession(sessions)

  return { sessions, openSession, loading }
}
