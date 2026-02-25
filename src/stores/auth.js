import { defineStore } from 'pinia'
import {
  auth,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
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
import { onSnapshot } from 'firebase/firestore'

// Helper function to extract serializable user data
const getSerializableUser = (user) => {
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

  // If the root email is missing, try to get it from the provider data
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
    stsTokenManager: {
      refreshToken: stsTokenManager.refreshToken,
      accessToken: stsTokenManager.accessToken,
      expirationTime: stsTokenManager.expirationTime,
    },
    createdAt,
    lastLoginAt,
  }
}

// Function to save user to Firestore
const saveUserToFirestore = async (user) => {
  if (!user) {
    return
  }
  const userRef = doc(db, 'users', user.uid)
  const userDoc = await getDoc(userRef)

  // Get the primary provider ID
  const providerId = user.providerData && user.providerData.length > 0
    ? user.providerData[0].providerId
    : 'password'

  const userData = {
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    providerId, // Add provider information
    lastLoginAt: serverTimestamp(),
  }

  if (!userDoc.exists()) {
    // New user, add createdAt
    userData.createdAt = serverTimestamp()
  }

  // Use setDoc with merge: true to create or update
  await setDoc(userRef, userData, { merge: true })
}

let unsubscribeFromUserDoc = null

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    error: null,
  }),
  actions: {
    // Initialize auth state listener
    initAuthListener () {
      onAuthStateChanged(auth, (user) => {
        if (unsubscribeFromUserDoc) {
          unsubscribeFromUserDoc()
          unsubscribeFromUserDoc = null
        }

        if (user) {
          const authData = getSerializableUser(user)
          const userRef = doc(db, 'users', user.uid)

          unsubscribeFromUserDoc = onSnapshot(userRef, (docSnapshot) => {
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

    // Sign up with email and password
    async createAcc (payload) {
      // This now only needs to call the client-side Firebase method
      const { email, password, displayName } = payload
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(userCredential.user, { displayName })
      // The onAuthStateChanged listener will handle the rest
      return userCredential
    },
    // Sign in with email and password
    async signInWithEmail (email, password, rememberMe = false) {
      this.error = null
      try {
        const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence
        await setPersistence(auth, persistence)
        const result = await signInWithEmailAndPassword(auth, email, password)
        // onAuthStateChanged will handle user saving
        return getSerializableUser(result.user)
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
        googleProvider.addScope('profile')
        googleProvider.addScope('email')
        googleProvider.setCustomParameters({
          prompt: 'select_account',
        })
        const result = await signInWithPopup(auth, googleProvider)
        // onAuthStateChanged will handle user saving
        return getSerializableUser(result.user)
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
        facebookProvider.addScope('email')
        facebookProvider.addScope('public_profile')
        facebookProvider.setCustomParameters({
          display: 'popup',
        })

        const result = await signInWithPopup(auth, facebookProvider)
        // onAuthStateChanged will handle user saving
        return getSerializableUser(result.user)
      } catch (error) {
        console.error('Error signing in with Facebook:', error)
        this.error = this.getErrorMessage(error.code)
        throw error
      }
    },
    // Logout
    async logout () {
      try {
        if (unsubscribeFromUserDoc) {
          unsubscribeFromUserDoc()
          unsubscribeFromUserDoc = null
        }
        await auth.signOut()
        this.user = null
        console.log('User logged out')
      } catch (error) {
        console.error('Error signing out:', error)
        this.error = this.getErrorMessage(error.code)
        throw error
      }
    },

    // Send password reset OTP
    async sendPasswordResetOTP (email) {
      this.error = null
      try {
        await sendPasswordResetEmail(auth, email)
      } catch (error) {
        console.error('Error sending password reset email:', error)
        this.error = this.getErrorMessage(error.code)
        throw error
      }
    },

    // Update password for currently logged in user
    async updateUserPassword (newPassword) {
      this.error = null
      try {
        if (!auth.currentUser) {
          throw new Error('No user logged in')
        }
        await updatePassword(auth.currentUser, newPassword)
        console.log('Password updated successfully')
      } catch (error) {
        console.error('Error updating password:', error)
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
