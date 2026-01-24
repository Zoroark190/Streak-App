import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

// Whitelisted emails
export const JAMES_EMAIL = 'ptcgjamesc@gmail.com'
export const PARTNER_EMAIL = 'datnumberguy20@gmail.com'

// University coordinates
export const UNI_COORDS = {
  latitude: 51.91741972748361,
  longitude: 4.526238323980921,
}
export const ALLOWED_RADIUS_METERS = 1000

// Dev mode
export const DEV_BYPASS_LOCATION = import.meta.env.VITE_DEV_BYPASS_LOCATION === 'true'
