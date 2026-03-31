// =================================================================================================
// Imports
// =================================================================================================
import { doc, updateDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { auth, db } from '@/firebase.js'
import { useAuthStore } from '@/stores/auth.js'

const VITE_USERS_COLLECTION = import.meta.env.VITE_USERS_COLLECTION

// =================================================================================================
// Settings Store
// =================================================================================================
export const useSettingsStore = defineStore('settings', {
  state: () => ({
    loading: false,
    error: null,
  }),
  actions: {
    /**
     * Updates the user's account information.
     * @param {object} accountData - The new account data.
     * @param {string} accountData.displayName - The new display name.
     * @param {string} accountData.bio - The new bio.
     * @param {string} accountData.userName - The new username.
     * @param {string} accountData.email - The new email.
     * @returns {Promise<boolean>} A promise that resolves with true if the update was successful.
     */
    async updateAccountSettings ({ displayName, bio, userName, email }) {
      this.loading = true
      this.error = null
      const authStore = useAuthStore()

      try {
        const user = auth.currentUser
        if (!user) {
          throw new Error('No user logged in')
        }

        const userDocRef = doc(db, VITE_USERS_COLLECTION, user.uid)

        const dataToUpdate = {
          displayName,
          bio,
          userName,
          email,
        }

        await updateDoc(userDocRef, dataToUpdate)

        // Update the local user state in the auth store
        authStore.$patch({
          user: {
            ...authStore.user,
            ...dataToUpdate,
          },
        })

        return true
      } catch (error) {
        console.error('Error updating account settings:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
