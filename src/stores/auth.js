import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import api from '@/axios'
import {
  auth,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  db,
  facebookProvider,
  googleProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updatePassword,
  updateProfile,
} from '@/firebase'

const USERS_COLLECTION = import.meta.env.VITE_USERS_COLLECTION

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    error: null,
  }),
  actions: {
    // Initialize auth state listener
    initAuthListener () {
      onAuthStateChanged(auth, user => {
        this.user = user
      })
    },

    // Sign up with email and password
    async createAcc (payload) {
      return await api.post('/createUser', payload)
    },
    // Sign in with email and password
    async signInWithEmail (email, password) {
      this.error = null
      try {
        const result = await signInWithEmailAndPassword(auth, email, password)
        this.user = result.user
        console.log('User signed in:', this.user)
        return result.user
      } catch (error) {
        console.error('Error signing in:', error)
        this.error = this.getErrorMessage(error.code)
        throw error
      }
    },

    // Sign in with Google
    async signInWithGoogle () {
      this.error = null
      try {
        const result = await signInWithPopup(auth, googleProvider)
        this.user = result.user
        console.log('User signed in with Google:', this.user)
        return result.user
      } catch (error) {
        console.error('Error signing in with Google:', error)
        this.error = this.getErrorMessage(error.code)
        throw error
      }
    },

    // Sign in with Facebook
    async signInWithFacebook () {
      this.error = null
      try {
        const result = await signInWithPopup(auth, facebookProvider)
        this.user = result.user
        console.log('User signed in with Facebook:', this.user)
        return result.user
      } catch (error) {
        console.error('Error signing in with Facebook:', error)
        this.error = this.getErrorMessage(error.code)
        throw error
      }
    },
    // Logout
    async logout () {
      try {
        await auth.signOut()
        this.user = null
        console.log('User logged out')
      } catch (error) {
        console.error('Error signing out:', error)
        this.error = this.getErrorMessage(error.code)
        throw error
      }
    },

    // Get user-friendly error message
    getErrorMessage (errorCode) {
      const errorMessages = {
        'auth/email-already-in-use': 'This email is already registered',
        'auth/invalid-email': 'Invalid email address',
        'auth/operation-not-allowed': 'Operation not allowed',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/user-disabled': 'This account has been disabled',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/invalid-credential': 'Invalid email or password',
        'auth/too-many-requests': 'Too many requests. Please try again later',
        'auth/network-request-failed': 'Network error. Please check your connection',
        'auth/popup-closed-by-user': 'Sign-in popup was closed',
        'auth/cancelled-popup-request': 'Only one popup request is allowed at a time',
        'auth/expired-action-code': 'The action code has expired',
        'auth/invalid-action-code': 'The action code is invalid',
        'auth/user-token-expired': 'Your session has expired. Please sign in again',
      }
      return errorMessages[errorCode] || errorCode || 'An error occurred'
    },
  },
  persist: true,
})
