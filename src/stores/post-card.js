import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, getCountFromServer, getDocs, increment, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { auth, db } from '@/firebase'

const VITE_POST_COLLECTION = import.meta.env.VITE_POST_COLLECTION
const VITE_COMMENTS_COLLECTION = import.meta.env.VITE_COMMENTS
const VITE_BOOKMARKS_COLLECTION = import.meta.env.VITE_BOOKMARKS

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

      const postRef = doc(db, VITE_POST_COLLECTION, postId)
      const uid = auth.currentUser.uid

      try {
        // eslint-disable-next-line unicorn/prefer-ternary
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

    async toggleBookmark ({ postId, bookmarked }) {
      if (!auth.currentUser) {
        console.log('You must be logged in to bookmark a post.')
        return { success: false, error: 'User not logged in' }
      }

      if (!postId) {
        console.error('Invalid post ID.')
        return { success: false, error: 'Invalid post ID' }
      }

      const postRef = doc(db, VITE_POST_COLLECTION, postId)
      const uid = auth.currentUser.uid
      const bookmarksCollectionRef = collection(db, VITE_BOOKMARKS_COLLECTION)

      try {
        if (bookmarked) {
          // User wants to bookmark the post
          await updateDoc(postRef, {
            bookmarks: increment(1),
            bookmarkedBy: arrayUnion(uid),
          })
          await addDoc(bookmarksCollectionRef, {
            userId: uid,
            postId,
            createdAt: serverTimestamp(),
          })
        } else {
          // User wants to unbookmark the post
          await updateDoc(postRef, {
            bookmarks: increment(-1),
            bookmarkedBy: arrayRemove(uid),
          })
          const q = query(bookmarksCollectionRef, where('userId', '==', uid), where('postId', '==', postId))
          const querySnapshot = await getDocs(q)
          // eslint-disable-next-line unicorn/no-array-for-each
          querySnapshot.forEach(async document => {
            await deleteDoc(doc(db, VITE_BOOKMARKS_COLLECTION, document.id))
          })
        }
        return { success: true }
      } catch (error) {
        console.error('Error updating bookmarks:', error)
        return { success: false, error: error.message }
      }
    },

    async toggleReaction ({ postId, reactionId, active }) {
      if (!auth.currentUser) {
        console.log('You must be logged in to react to a post.')
        return { success: false, error: 'User not logged in' }
      }

      if (!postId || !reactionId) {
        console.error('Invalid post ID or reaction ID.')
        return { success: false, error: 'Invalid post ID or reaction ID' }
      }

      const postRef = doc(db, VITE_POST_COLLECTION, postId)
      const uid = auth.currentUser.uid

      try {
        const updateData = {}
        const reactionCountPath = `reactions.${reactionId}.count`
        const reactionUsersPath = `reactions.${reactionId}.users`

        if (active) {
          // User wants to add this reaction
          updateData[reactionCountPath] = increment(1)
          updateData[reactionUsersPath] = arrayUnion(uid)
        } else {
          // User wants to remove this reaction
          updateData[reactionCountPath] = increment(-1)
          updateData[reactionUsersPath] = arrayRemove(uid)
        }

        await updateDoc(postRef, updateData)
        return { success: true }
      } catch (error) {
        console.error('Error updating reaction:', error)
        return { success: false, error: error.message }
      }
    },

    async getCommentCount (postId) {
      try {
        const q = query(collection(db, VITE_COMMENTS_COLLECTION), where('postId', '==', postId))
        const snapshot = await getCountFromServer(q)
        return snapshot.data().count
      } catch (error) {
        console.error('Error getting comment count:', error)
        return 0
      }
    },
  },
})
