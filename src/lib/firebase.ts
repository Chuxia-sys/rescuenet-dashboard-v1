import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

let firebaseApp: FirebaseApp | null = null
let firebaseAnalytics: Analytics | null = null

export const initFirebase = async () => {
  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig)
  }

  if (typeof window !== 'undefined' && !firebaseAnalytics) {
    const isLocalhost = window.location.hostname === 'localhost'
    if (import.meta.env.PROD && !isLocalhost) {
      try {
        const supported = await isSupported()
        if (supported) {
          firebaseAnalytics = getAnalytics(firebaseApp)
        }
      } catch (error) {
        console.warn('Firebase analytics initialization failed.', error)
      }
    }
  }

  return { app: firebaseApp, analytics: firebaseAnalytics }
}

export const getFirebaseApp = () => firebaseApp
export const getFirebaseAnalytics = () => firebaseAnalytics
