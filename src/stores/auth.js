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
  updateProfile,
} from '@/firebase'

// Helper function to extract serializable user data
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

// Function to save user to Firestore
async function saveUserToFirestore (user) {
  if (!user || !user.uid) {
    return
  }
  const userRef = doc(db, 'users', user.uid)
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

  if (!userDoc.exists()) {
    userData.createdAt = serverTimestamp()
  }

  await setDoc(userRef, userData, { merge: true })
}

let unsubscribeFromUserDoc = null

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    error: null,
  }),
  actions: {
    initAuthListener () {
      onAuthStateChanged(auth, user => {
        if (unsubscribeFromUserDoc) {
          unsubscribeFromUserDoc()
          unsubscribeFromUserDoc = null
        }

        if (user) {
          const authData = getSerializableUser(user)
          const userRef = doc(db, 'users', user.uid)

          unsubscribeFromUserDoc = onSnapshot(userRef, docSnapshot => {
            if (docSnapshot.exists()) {
              this.user = { ...authData, ...docSnapshot.data() }
            } else {
              this.user = authData
              saveUserToFirestore(authData)
            }
          })
        } else {
          this.user = null
        }
      })
    },

    async createAcc (payload) {
      return await api.post('createUser', payload)
    },

    async verifyUser (token) {
      return await api.post('verifyUser', { token })
    },

    async resendVerificationEmail (token) {
      return await api.post('resendVerificationEmail', { token })
    },

    async signInWithEmail (email, password, rememberMe = false) {
      this.error = null
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence
      await setPersistence(auth, persistence)
      const result = await signInWithEmailAndPassword(auth, email, password)
      return getSerializableUser(result.user)
    },

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

    async logout () {
      if (unsubscribeFromUserDoc) {
        unsubscribeFromUserDoc()
        unsubscribeFromUserDoc = null
      }
      await auth.signOut()
      this.user = null
    },

    async sendPasswordResetOTP (email) {
      return await api.post('forgotPassword', { email })
    },

    async verifyOTP (email, code) {
      return await api.post('verifyOTP', { email, code })
    },

    async resetPassword (email, code, password) {
      return await api.post('resetPassword', { email, code, password })
    },

    async updateUserPassword (newPassword) {
      this.error = null
      if (!auth.currentUser) {
        throw new Error('No user logged in')
      }
      await updatePassword(auth.currentUser, newPassword)
    },

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
      }
      return errorMessages[errorCode] || 'An error occurred'
    },
  },
  persist: true,
})
