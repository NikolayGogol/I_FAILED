import { arrayRemove, arrayUnion, doc, increment, updateDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { auth, db } from '@/firebase'

export const usePostCardStore = defineStore('postCard', {
  state: () => ({
    // We don't need to store post-specific state globally
  }),
  actions: {
    async toggleLike (post) {
      if (!auth.currentUser) {
        console.log('You must be logged in to like a post.')
        return { success: false, error: 'User not logged in' }
      }

      if (!post || !post.id) {
        console.error('Invalid post object. Post ID is missing.')
        return { success: false, error: 'Invalid post ID' }
      }

      const postRef = doc(db, 'posts', post.id)
      const uid = auth.currentUser.uid
      const isCurrentlyLiked = post.likedBy?.includes(uid)

      try {
        if (isCurrentlyLiked) {
          await updateDoc(postRef, {
            likes: increment(-1),
            likedBy: arrayRemove(uid),
          })
          return { success: true, liked: false, newCount: (post.likes || 0) - 1 }
        } else {
          await updateDoc(postRef, {
            likes: increment(1),
            likedBy: arrayUnion(uid),
          })
          return { success: true, liked: true, newCount: (post.likes || 0) + 1 }
        }
      } catch (error) {
        console.error('Error updating likes:', error)
        return { success: false, error: error.message }
      }
    },
  },
})
