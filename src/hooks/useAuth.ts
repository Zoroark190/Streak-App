import { useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
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

function isMobile(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribe: () => void

    const init = async () => {
      // Handle redirect result FIRST for mobile sign-in
      // This must complete before we consider auth state resolved
      try {
        const result = await getRedirectResult(auth)
        if (result?.user) {
          setUser(result.user)
        }
      } catch (error) {
        console.error('Redirect result error:', error)
      }

      // Now set up the auth state listener
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
    if (isMobile()) {
      await signInWithRedirect(auth, googleProvider)
    } else {
      await signInWithPopup(auth, googleProvider)
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
