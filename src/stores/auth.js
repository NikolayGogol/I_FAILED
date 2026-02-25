import { defineStore } from 'pinia'
import api from '@/axios'
import {
  auth,
  browserLocalPersistence,
  browserSessionPersistence,
  facebookProvider,
  googleProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  updatePassword,
} from '@/firebase'

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

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    error: null,
  }),
  actions: {
    // Initialize auth state listener
    initAuthListener () {
      onAuthStateChanged(auth, (user) => {
        this.user = getSerializableUser(user)
      })
    },

    // Sign up with email and password
    async createAcc (payload) {
      return await api.post('/createUser', payload)
    },
    // Sign in with email and password
    async signInWithEmail (email, password, rememberMe = false) {
      this.error = null
      try {
        const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence
        await setPersistence(auth, persistence)
        const result = await signInWithEmailAndPassword(auth, email, password)
        const serializableUser = getSerializableUser(result.user)
        this.user = serializableUser
        console.log('User signed in:', serializableUser)
        return serializableUser
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
        const serializableUser = getSerializableUser(result.user)
        this.user = serializableUser
        console.log('User signed in with Google:', serializableUser)
        return serializableUser
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
        const serializableUser = getSerializableUser(result.user)
        this.user = serializableUser
        console.log('User signed in with Facebook:', serializableUser)

        return serializableUser
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

    // Send password reset OTP
    async sendPasswordResetOTP (email) {
      this.error = null
      try {
        const response = await api.post('/forgotPassword', { email })
        return response.data
      } catch (error) {
        console.error('Error sending password reset OTP:', error)
        this.error = error.response?.data?.message || 'Failed to send verification code'
        throw error
      }
    },

    // Verify password reset OTP
    async verifyPasswordResetOTP (email, code) {
      this.error = null
      try {
        const response = await api.post('/verifyOTP', { email, code })
        return response.data
      } catch (error) {
        console.error('Error verifying OTP:', error)
        this.error = error.response?.data?.message || 'Invalid verification code'
        throw error
      }
    },

    // Reset password with OTP and new password
    async resetPasswordWithOTP (email, code, newPassword) {
      this.error = null
      try {
        const response = await api.post('/resetPassword', { email, code, password: newPassword })
        return response.data
      } catch (error) {
        console.error('Error resetting password:', error)
        this.error = error.response?.data?.message || 'Failed to reset password'
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

    // Resend verification email
    async resendVerificationEmail (token) {
      this.error = null
      if (!token) {
        this.error = 'Verification token is missing.'
        throw new Error(this.error)
      }
      try {
        const response = await api.post('/resendVerificationEmail', { token })
        return response.data
      } catch (error) {
        console.error('Error resending verification email:', error)
        this.error = error.response?.data?.message || 'Failed to resend verification email'
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
