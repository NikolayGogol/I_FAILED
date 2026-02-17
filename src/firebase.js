import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFunctions } from 'firebase/functions'
import { useToast } from 'vue-toastification'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const functions = getFunctions(app)
const provider = new GoogleAuthProvider()
const toast = useToast()

// Global error handler for Firebase Auth
auth.onAuthStateChanged(user => {
  // You can handle auth state changes here
  console.log(user)
}, error => {
  console.error('Firebase Auth Error:', error)
  toast.error(error.message)
})

export { auth, functions, provider }
export { signInWithPopup } from 'firebase/auth'
export { httpsCallable } from 'firebase/functions'
