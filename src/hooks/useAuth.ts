import { useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  getRedirectResult,
  browserLocalPersistence,
  setPersistence,
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
    let unsubscribe: () => void

    const init = async () => {
      // Set persistence to local storage (survives browser restarts)
      try {
        await setPersistence(auth, browserLocalPersistence)
      } catch (error) {
        console.error('Persistence error:', error)
      }

      // Handle redirect result for mobile sign-in
      try {
        const result = await getRedirectResult(auth)
        if (result?.user) {
          setUser(result.user)
        }
      } catch (error) {
        console.error('Redirect result error:', error)
      }

      // Set up the auth state listener
      unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
        setUser(firebaseUser)
        setLoading(false)
      })
    }

    init()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const email = user?.email ?? ''
  const isJames = email === JAMES_EMAIL
  const isPartner = email === PARTNER_EMAIL
  const isAuthorized = isJames || isPartner

  const signIn = async () => {
    // Try popup first (works on most browsers including desktop)
    // Fall back to redirect if popup is blocked (common on mobile)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error: unknown) {
      const firebaseError = error as { code?: string }
      // Popup blocked or failed - use redirect instead
      if (
        firebaseError.code === 'auth/popup-blocked' ||
        firebaseError.code === 'auth/popup-closed-by-user' ||
        firebaseError.code === 'auth/cancelled-popup-request'
      ) {
        await signInWithRedirect(auth, googleProvider)
      } else {
        throw error
      }
    }
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
