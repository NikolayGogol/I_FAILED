import { defineStore } from 'pinia'
import { auth, provider, signInWithPopup } from '@/firebase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    error: null,
  }),
  actions: {
    async signInWithGoogle () {
      this.loading = true
      this.error = null
      try {
        const result = await signInWithPopup(auth, provider)
        this.user = result.user
        console.log('User signed in:', this.user)
      } catch (error) {
        console.error('Error signing in with Google:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    async logout () {
      try {
        await auth.signOut()
        this.user = null
      } catch (error) {
        console.error('Error signing out:', error)
      }
    },
  },
  persist: true,
})
