import { useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithRedirect,
  signOut as firebaseSignOut,
  getRedirectResult,
  type User,
} from 'firebase/auth'
import { auth, googleProvider, JAMES_EMAIL, PARTNER_EMAIL } from '../lib/firebase'

export interface AuthState {
  user: User | null
  loading: boolean
  isJames: boolean
  isPartner: boolean
  isAuthorized: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for redirect result on mount
    getRedirectResult(auth).catch(() => {
      // Redirect result errors are non-fatal
    })

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const email = user?.email ?? ''
  const isJames = email === JAMES_EMAIL
  const isPartner = email === PARTNER_EMAIL
  const isAuthorized = isJames || isPartner

  const signIn = async () => {
    await signInWithRedirect(auth, googleProvider)
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  return {
    user,
    loading,
    isJames,
    isPartner,
    isAuthorized,
    signIn,
    signOut,
  }
}
