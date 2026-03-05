// =================================================================================================
// Imports
// =================================================================================================
import { arrayUnion, doc, updateDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
const USER_COLLECTION = import.meta.env.VITE_USERS_COLLECTION
const VITE_USERS_COLLECTION = import.meta.env.VITE_USERS_COLLECTION

// =================================================================================================
// Feed Store
// =================================================================================================
export const useFeedStore = defineStore('feed', {
  actions: {
    /**
     * Mutes a post for the current user.
     * This adds the post's ID to the user's `mutedPosts` array in Firestore.
     * @param {string} postId - The ID of the post to mute.
     * @returns {Promise<boolean>} A promise that resolves with true if the operation was successful, false otherwise.
     */
    async mutePost (postId) {
      const authStore = useAuthStore()
      if (!authStore.user) {
        console.error('User not authenticated')
        return false
      }
      const currentUserId = authStore.user.uid
      const currentUserRef = doc(db, USER_COLLECTION, currentUserId)

      try {
        // Add the post ID to the 'mutedPosts' array in the user's document
        await updateDoc(currentUserRef, {
          mutedPosts: arrayUnion(postId),
        })
        // Optimistically update the local user object to reflect the change immediately
        if (authStore.user.mutedPosts) {
          authStore.user.mutedPosts.push(postId)
        } else {
          authStore.user.mutedPosts = [postId]
        }
        return true
      } catch (error) {
        console.error('Error muting post:', error)
        return false
      }
    },
  },
})
