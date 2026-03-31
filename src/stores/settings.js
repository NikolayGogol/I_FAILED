import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
// =================================================================================================
// Imports
// =================================================================================================
import { doc, updateDoc } from 'firebase/firestore'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage' // Import storage functions
import { defineStore } from 'pinia'
import api from '@/axios.js' // Import axios for backend calls
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
     * Updates the user's account information.
     * @param {object} accountData - The new account data.
     * @param {string} accountData.displayName - The new display name.
     * @param {string} accountData.bio - The new bio.
     * @param {string} accountData.userName - The new username.
     * @param {string} accountData.email - The new email.
     * @param {File} [accountData.photoFile] - Optional new profile photo file.
     * @returns {Promise<boolean>} A promise that resolves with true if the update was successful.
     */
    async updateAccountSettings ({ displayName, bio, userName, email, photoFile }) {
      this.loading = true
      this.error = null
      const authStore = useAuthStore()

      try {
        const user = auth.currentUser
        if (!user) {
          throw new Error('No user logged in')
        }

        let newPhotoURL = user.photoURL // Start with current photo URL

        // If a new photo file is provided, upload it to Firebase Storage
        if (photoFile) {
          const fileRef = storageRef(storage, `profile_photos/${user.uid}/${photoFile.name}`);
          const snapshot = await uploadBytes(fileRef, photoFile);
          newPhotoURL = await getDownloadURL(snapshot.ref);
        }

        // Update Firebase Authentication profile (for displayName and photoURL)
        await updateProfile(user, {
          displayName: displayName,
          photoURL: newPhotoURL,
        });

        const userDocRef = doc(db, VITE_USERS_COLLECTION, user.uid)

        const dataToUpdate = {
          displayName,
          bio,
          userName,
          email, // Always update email in Firestore immediately
          photoURL: newPhotoURL, // Include newPhotoURL in Firestore update
        }

        const emailChanged = email !== user.email

        await updateDoc(userDocRef, dataToUpdate)

        // If email changed, send a request to the backend to send a verification email
        if (emailChanged) {
          await api.post('/send-verification-email', {
            newEmail: email,
            uid: user.uid,
          })
          // Note: Firebase Auth email itself is NOT updated here. It will be updated
          // only after the user clicks the verification link sent by your backend.
          // The local authStore user object will reflect the new email for display purposes.
        }

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
