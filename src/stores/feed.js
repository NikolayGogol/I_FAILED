import { defineStore } from 'pinia'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db, auth } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

export const useFeedStore = defineStore('feed', {
  actions: {
    async mutePost (postId) {
      const authStore = useAuthStore()
      if (!authStore.user) {
        console.error('User not authenticated')
        return false
      }
      const currentUserId = authStore.user.uid
      const currentUserRef = doc(db, 'users', currentUserId)

      try {
        await updateDoc(currentUserRef, {
          mutedPosts: arrayUnion(postId),
        })
        // Optimistically update the local user object
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
