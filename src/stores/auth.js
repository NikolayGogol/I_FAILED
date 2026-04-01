// =================================================================================================
// Imports
// =================================================================================================
import { onSnapshot } from 'firebase/firestore'
import { defineStore } from 'pinia'
import api from '@/axios' // Using the configured axios instance
import {
  auth,
  browserLocalPersistence,
  browserSessionPersistence,
  db,
  doc,
  facebookProvider,
  getDoc,
  googleProvider,
  onAuthStateChanged,
  serverTimestamp,
  setDoc,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  updatePassword,
} from '@/firebase'
const USER_COLLECTION = import.meta.env.VITE_USERS_COLLECTION
// =================================================================================================
// Helper Functions
// =================================================================================================
/**
 * Extracts serializable user data from the Firebase user object.
 * This is necessary to avoid storing non-serializable data in the Pinia store.
 * @param {object} user - The Firebase user object.
 * @returns {object|null} A serializable user object or null.
 */
function getSerializableUser (user) {
  if (!user) {
    return null
  }
  const {
    uid,
    email,
    displayName,
    photoURL,
    emailVerified,
    isAnonymous,
    providerData,
    stsTokenManager,
    createdAt,
    lastLoginAt,
  } = user

  // Fallback to find email from provider data if it's not directly available
  let finalEmail = email
  if (!finalEmail && providerData && providerData.length > 0) {
    const providerWithEmail = providerData.find(p => p.email)
    if (providerWithEmail) {
      finalEmail = providerWithEmail.email
    }
  }

  return {
    uid,
    email: finalEmail,
    displayName,
    photoURL,
    emailVerified,
    isAnonymous,
    providerData,
    stsTokenManager: stsTokenManager
      ? {
          refreshToken: stsTokenManager.refreshToken,
          accessToken: stsTokenManager.accessToken,
          expirationTime: stsTokenManager.expirationTime,
        }
      : null,
    createdAt,
    lastLoginAt,
  }
}

/**
 * Saves or updates user data in the Firestore database.
 * @param {object} user - The serializable user object.
 */
async function saveUserToFirestore (user) {
  if (!user || !user.uid) {
    return
  }
  const userRef = doc(db, USER_COLLECTION, user.uid)
  const userDoc = await getDoc(userRef)

  const providerId = user.providerData && user.providerData.length > 0
    ? user.providerData[0].providerId
    : 'password'

  const userData = {
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    providerId,
    lastLoginAt: serverTimestamp(),
  }

  // Set createdAt timestamp only if the user is new
  if (!userDoc.exists()) {
    userData.createdAt = serverTimestamp()
  }

  await setDoc(userRef, userData, { merge: true })
}

// =================================================================================================
// Auth Store
// =================================================================================================
let unsubscribeFromUserDoc = null

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    error: null,
  }),
  actions: {
    /**
     * Initializes the authentication state listener.
     * This keeps the user state in sync with Firebase Authentication.
     */
    initAuthListener () {
      onAuthStateChanged(auth, user => {
        // Unsubscribe from previous user document listener if it exists
        if (unsubscribeFromUserDoc) {
          unsubscribeFromUserDoc()
          unsubscribeFromUserDoc = null
        }

        if (user) {
          const authData = getSerializableUser(user)
          const userRef = doc(db, USER_COLLECTION, user.uid)

          // Subscribe to real-time updates of the user document in Firestore
          unsubscribeFromUserDoc = onSnapshot(userRef, docSnapshot => {
            if (docSnapshot.exists()) {
              this.user = { ...authData, ...docSnapshot.data() }
            } else {
              // If user document doesn't exist, create it
              this.user = authData
              saveUserToFirestore(authData)
            }
          })
        } else {
          // User is logged out
          this.user = null
        }
      })
    },

    /**
     * Creates a new user account-tabs.
     * @param {object} payload - The user creation data.
     * @returns {Promise} A promise that resolves with the API response.
     */
    async createAcc (payload) {
      return await api.post('createUser', payload)
    },

    /**
     * Verifies a user's email address.
     * @param {string} token - The verification token.
     * @returns {Promise} A promise that resolves with the API response.
     */
    async verifyUser (token) {
      return await api.post('verifyUser', { token })
    },

    /**
     * Resends the verification email.
     * @param {string} token - The user's token.
     * @returns {Promise} A promise that resolves with the API response.
     */
    async resendVerificationEmail (token) {
      return await api.post('resendVerificationEmail', { token })
    },

    /**
     * Signs in a user with email and password.
     * @param {string} email - The user's email.
     * @param {string} password - The user's password.
     * @param {boolean} rememberMe - Whether to persist the session.
     * @returns {Promise<object>} A promise that resolves with the serializable user object.
     */
    async signInWithEmail (email, password, rememberMe = false) {
      this.error = null
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence
      await setPersistence(auth, persistence)
      const result = await signInWithEmailAndPassword(auth, email, password)
      return getSerializableUser(result.user)
    },

    /**
     * Signs in a user with Google.
     * @returns {Promise<object>} A promise that resolves with the serializable user object.
     */
    async signInWithGoogle () {
      this.error = null
      try {
        googleProvider.addScope('profile')
        googleProvider.addScope('email')
        googleProvider.setCustomParameters({ prompt: 'select_account' })

        const result = await signInWithPopup(auth, googleProvider)
        const serializableUser = getSerializableUser(result.user)
        await saveUserToFirestore(serializableUser)
        return serializableUser
      } catch (error) {
        console.error('Error signing in with Google:', error)
        this.error = this.getErrorMessage(error.code)
        throw error
      }
    },

    /**
     * Signs in a user with Facebook.
     * @returns {Promise<object>} A promise that resolves with the serializable user object.
     */
    async signInWithFacebook () {
      this.error = null
      try {
        facebookProvider.addScope('email')
        facebookProvider.addScope('public_profile')
        facebookProvider.setCustomParameters({ display: 'popup' })

        const result = await signInWithPopup(auth, facebookProvider)
        const serializableUser = getSerializableUser(result.user)
        await saveUserToFirestore(serializableUser)
        return serializableUser
      } catch (error) {
        console.error('Error signing in with Facebook:', error)
        this.error = this.getErrorMessage(error.code)
        throw error
      }
    },

    /**
     * Logs out the current user.
     */
    async logout () {
      if (unsubscribeFromUserDoc) {
        unsubscribeFromUserDoc()
        unsubscribeFromUserDoc = null
      }
      await auth.signOut()
      this.user = null
    },

    /**
     * Sends a password reset OTP to the user's email.
     * @param {string} email - The user's email.
     * @returns {Promise} A promise that resolves with the API response.
     */
    async sendPasswordResetOTP (email) {
      return await api.post('forgotPassword', { email })
    },

    /**
     * Verifies the password reset OTP.
     * @param {string} email - The user's email.
     * @param {string} code - The OTP code.
     * @returns {Promise} A promise that resolves with the API response.
     */
    async verifyOTP (email, code) {
      return await api.post('verifyOTP', { email, code })
    },

    /**
     * Resets the user's password.
     * @param {string} email - The user's email.
     * @param {string} code - The OTP code.
     * @param {string} password - The new password.
     * @returns {Promise} A promise that resolves with the API response.
     */
    async resetPassword (email, code, password) {
      return await api.post('resetPassword', { email, code, password })
    },

    /**
     * Updates the current user's password.
     * @param {string} newPassword - The new password.
     */
    async updateUserPassword (newPassword) {
      this.error = null
      if (!auth.currentUser) {
        throw new Error('No user logged in')
      }
      await updatePassword(auth.currentUser, newPassword)
    },

    /**
     * Maps Firebase error codes to user-friendly error messages.
     * @param {string} errorCode - The Firebase error code.
     * @returns {string} The corresponding error message.
     */
    getErrorMessage (errorCode) {
      const errorMessages = {
        'auth/email-already-in-use': 'This email is already registered',
        'auth/invalid-email': 'Invalid email address',
        'auth/operation-not-allowed': 'Operation not allowed',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/user-disabled': 'This account-tabs has been disabled',
        'auth/user-not-found': 'No account-tabs found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/invalid-credential': 'Invalid email or password',
        'auth/too-many-requests': 'Too many requests. Please try again later',
        'auth/network-request-failed': 'Network error. Please check your connection',
        'auth/popup-closed-by-user': 'Sign-in popup was closed',
        'auth/cancelled-popup-request': 'Only one popup request is allowed at a time',
      }
      return errorMessages[errorCode] || 'An error occurred'
    },
  },
  persist: true,
})
