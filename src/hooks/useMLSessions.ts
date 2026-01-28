import { useState, useEffect } from 'react'
import { subscribeToMLSessions, getOpenMLSession, type MLSession } from '../lib/mlFirestore'

export interface MLSessionsState {
  mlSessions: MLSession[]
  openMLSession: MLSession | null
  loading: boolean
}

export function useMLSessions(): MLSessionsState {
  const [mlSessions, setMLSessions] = useState<MLSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('useMLSessions: Setting up subscription')
    const unsubscribe = subscribeToMLSessions((newSessions) => {
      console.log('useMLSessions: Received', newSessions.length, 'sessions')
      setMLSessions(newSessions)
      setLoading(false)
    })

    return () => {
      console.log('useMLSessions: Cleaning up subscription')
      unsubscribe()
    }
  }, [])

  const openMLSession = getOpenMLSession(mlSessions)
  console.log('useMLSessions: Rendering with', mlSessions.length, 'sessions, openMLSession:', openMLSession?.id ?? 'none')

  return { mlSessions, openMLSession, loading }
}
