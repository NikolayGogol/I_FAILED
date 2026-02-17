import { defineStore } from 'pinia'
import api from '@/axios'
import {
  auth,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  facebookProvider,
  googleProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updatePassword,
} from '@/firebase'

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
    async signUpWithEmail (email, password, displayName, whyJoining) {
      this.error = null
      try {
        const result = await createUserWithEmailAndPassword(auth, email, password)
        this.user = result.user

        // Update display name if provided
        if (displayName && this.user) {
          await this.user.updateProfile({
            displayName,
          })
        }

        // TODO: Save whyJoining to Firestore user profile if needed
        if (whyJoining) {
          console.log('Why joining:', whyJoining)
        }

        console.log('User signed up:', this.user)
        return result.user
      } catch (error) {
        console.error('Error signing up:', error)
        this.error = this.getErrorMessage(error.code)
        throw error
      }
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

    // Send password reset email (Firebase default)
    async sendPasswordResetEmail (email) {
      this.error = null
      try {
        await sendPasswordResetEmail(auth, email)
        console.log('Password reset email sent to:', email)
        return true
      } catch (error) {
        console.error('Error sending password reset email:', error)
        this.error = this.getErrorMessage(error.code)
        throw error
      }
    },

    // Send OTP code via Cloud Function
    async sendPasswordResetOTP (email) {
      this.error = null
      try {
        const response = await api.post('/sendPasswordResetOTP', { email })
        console.log('OTP sent to:', email)
        return response.data
      } catch (error) {
        console.error('Error sending OTP:', error)
        this.error = error.response?.data?.error || 'Failed to send verification code'
        throw error
      }
    },

    // Confirm password reset with action code
    async confirmPasswordReset (actionCode, newPassword) {
      this.error = null
      try {
        await confirmPasswordReset(auth, actionCode, newPassword)
        console.log('Password reset confirmed')
        return true
      } catch (error) {
        console.error('Error confirming password reset:', error)
        this.error = this.getErrorMessage(error.code)
        throw error
      }
    },

    // Update password (for authenticated users)
    async updateUserPassword (newPassword) {
      this.error = null
      try {
        if (!this.user) {
          throw new Error('User must be authenticated')
        }
        await updatePassword(this.user, newPassword)
        console.log('Password updated successfully')
        return true
      } catch (error) {
        console.error('Error updating password:', error)
        this.error = this.getErrorMessage(error.code)
        throw error
      }
    },

    // Verify password reset OTP code via Cloud Function
    async verifyPasswordResetOTP (email, code) {
      this.error = null
      try {
        const response = await api.post('/verifyPasswordResetOTP', { email, code })
        console.log('OTP verified for:', email)
        return response.data
      } catch (error) {
        console.error('Error verifying OTP:', error)
        this.error = error.response?.data?.error || 'Invalid verification code'
        throw error
      }
    },

    // Reset password with verified OTP via Cloud Function
    async resetPasswordWithOTP (email, code, newPassword) {
      this.error = null
      try {
        const response = await api.post('/resetPasswordWithOTP', { email, code, newPassword })
        console.log('Password reset successful for:', email)
        return response.data
      } catch (error) {
        console.error('Error resetting password:', error)
        this.error = error.response?.data?.error || 'Failed to reset password'
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

    // Test Cloud Function
    async testCloudFunction () {
      try {
        const response = await api.get('/helloWorld')
        return response.data
      } catch (error) {
        console.error('Error calling Cloud Function:', error)
        throw error
      }
    },
  },
  persist: true,
})
