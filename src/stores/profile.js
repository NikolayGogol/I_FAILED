import { defineStore } from 'pinia'
import { auth, updateProfile } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

export const useProfileStore = defineStore('profile', {
  state: () => ({
    loading: false,
    error: null,
  }),
  actions: {
    async updateUserProfile ({ displayName, photoFile }) {
      this.loading = true
      this.error = null
      const authStore = useAuthStore()

      try {
        const user = auth.currentUser
        if (!user) throw new Error('No user logged in')

        // Photo upload logic commented out due to CORS issue
        /*
        let photoURL = user.photoURL

        if (photoFile) {
          const fileRef = storageRef(storage, `profile_photos/${user.uid}/${photoFile.name}`)
          const snapshot = await uploadBytes(fileRef, photoFile)
          photoURL = await getDownloadURL(snapshot.ref)
        }
        */

        await updateProfile(user, {
          displayName: displayName || user.displayName,
          // photoURL: photoURL,
        })

        // Update local user state in auth store
        authStore.user = { ...auth.currentUser }

        return true
      } catch (error) {
        console.error('Error updating profile:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
