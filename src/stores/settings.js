import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
// =================================================================================================
// Imports
// =================================================================================================
import { doc, updateDoc } from 'firebase/firestore'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage' // Import storage functions
import { defineStore } from 'pinia'
import { auth, db, storage, updateProfile } from '@/firebase.js' // Import storage and updateProfile
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
     * Re-authenticates the user with their password.
     * @param {string} password - The user's current password.
     * @returns {Promise<boolean>} A promise that resolves with true if re-authentication is successful.
     */
    async reauthenticateUser (password) {
      this.loading = true
      this.error = null
      try {
        const user = auth.currentUser
        if (!user) {
          throw new Error('No user logged in')
        }
        const credential = EmailAuthProvider.credential(user.email, password)
        await reauthenticateWithCredential(user, credential)
        return true
      } catch (error) {
        console.error('Re-authentication failed:', error)
        this.error = 'Re-authentication failed. Please check your password.'
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Updates the user's account information in Firestore and Firebase Auth.
     * This is the root function for persisting settings data.
     */
    async updateAccountSettings ({ displayName, bio, userName, email, dob, photoFile }) {
      this.loading = true
      this.error = null
      const authStore = useAuthStore()

      try {
        const user = auth.currentUser
        if (!user) {
          throw new Error('No user logged in')
        }

        let newPhotoURL = user.photoURL

        if (photoFile) {
          const fileRef = storageRef(storage, `profile_photos/${user.uid}/${photoFile.name}`)
          const snapshot = await uploadBytes(fileRef, photoFile)
          newPhotoURL = await getDownloadURL(snapshot.ref)
        }

        await updateProfile(user, {
          displayName,
          photoURL: newPhotoURL,
        })

        const userDocRef = doc(db, VITE_USERS_COLLECTION, user.uid)
        const dataToUpdate = {
          displayName,
          bio,
          userName,
          email,
          dob: dob ?? authStore.user.dob,
          photoURL: newPhotoURL,
        }
        await updateDoc(userDocRef, dataToUpdate)

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
