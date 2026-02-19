import { initializeApp } from 'firebase/app'
import {
  browserLocalPersistence,
  browserSessionPersistence,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  updatePassword,
  updateProfile,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage'

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
const db = getFirestore(app)
const storage = getStorage(app)
const googleProvider = new GoogleAuthProvider()
const facebookProvider = new FacebookAuthProvider()

// Global error handler for Firebase Auth
onAuthStateChanged(auth, user => {
  // You can handle auth state changes here
}, error => {
  console.error('Firebase Auth Error:', error)
  // Error handling is done in auth store
})

export { auth, db, facebookProvider, functions, googleProvider, storage }
export {
  browserLocalPersistence,
  browserSessionPersistence,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  updatePassword,
  updateProfile,
} from 'firebase/auth'
export { doc, serverTimestamp, setDoc } from 'firebase/firestore'
export { httpsCallable } from 'firebase/functions'
export { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
