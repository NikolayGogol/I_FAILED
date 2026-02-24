import { arrayRemove, arrayUnion, collection, doc, getCountFromServer, increment, query, updateDoc, where } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { auth, db } from '@/firebase'

export const usePostCardStore = defineStore('postCard', {
  actions: {
    async toggleLike ({ postId, liked }) {
      if (!auth.currentUser) {
        console.log('You must be logged in to like a post.')
        return { success: false, error: 'User not logged in' }
      }

      if (!postId) {
        console.error('Invalid post ID.')
        return { success: false, error: 'Invalid post ID' }
      }

      const postRef = doc(db, 'posts', postId)
      const uid = auth.currentUser.uid

      try {
        if (liked) {
          // User wants to like the post
          await updateDoc(postRef, {
            likes: increment(1),
            likedBy: arrayUnion(uid),
          })
        } else {
          // User wants to unlike the post
          await updateDoc(postRef, {
            likes: increment(-1),
            likedBy: arrayRemove(uid),
          })
        }
        return { success: true }
      } catch (error) {
        console.error('Error updating likes:', error)
        return { success: false, error: error.message }
      }
    },
    async getCommentCount (postId) {
      try {
        const q = query(collection(db, 'comments'), where('postId', '==', postId))
        const snapshot = await getCountFromServer(q)
        return snapshot.data().count
      } catch (error) {
        console.error('Error getting comment count:', error)
        return 0
      }
    }
  },
})
