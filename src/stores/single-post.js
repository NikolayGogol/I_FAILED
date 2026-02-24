import { addDoc, arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, increment, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase'

const collection_db = import.meta.env.VITE_POST_COLLECTION
const comments_collection = import.meta.env.VITE_COMMENTS

export const useSinglePostStore = defineStore('singlePost', {
  state: () => ({}),
  actions: {
    async getPostById (id) {
      try {
        const docRef = doc(db, collection_db, id)
        const docSnap = await getDoc(docRef)

        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : 'Post not found.'
      } catch {
        return 'Failed to load the post.'
      }
    },
    async incrementViewCount (id) {
      try {
        const docRef = doc(db, collection_db, id)
        await updateDoc(docRef, {
          views: increment(1),
        })
      } catch (error) {
        console.error('Error incrementing view count:', error)
      }
    },
    async addComment (postId, user, text) {
      try {
        await addDoc(collection(db, comments_collection), {
          postId,
          parentId: null,
          user: {
            uid: user.uid,
            displayName: user.displayName,
            photoURL: user.photoURL,
          },
          text,
          likes: [],
          createdAt: serverTimestamp(),
        })
      } catch (error) {
        console.error('Error adding comment:', error)
        throw error
      }
    },
    async addReply (postId, parentId, user, text) {
      try {
        await addDoc(collection(db, comments_collection), {
          postId,
          parentId,
          user: {
            uid: user.uid,
            displayName: user.displayName,
            photoURL: user.photoURL,
          },
          text,
          likes: [],
          createdAt: serverTimestamp(),
        })
      } catch (error) {
        console.error('Error adding reply:', error)
        throw error
      }
    },
    async toggleCommentLike (commentId, userId, isLiked) {
      try {
        const docRef = doc(db, comments_collection, commentId)
        await updateDoc(docRef, {
          likes: isLiked ? arrayRemove(userId) : arrayUnion(userId),
        })
      } catch (error) {
        console.error('Error toggling like:', error)
      }
    },
    async getComments (postId) {
      try {
        const q = query(
          collection(db, comments_collection),
          where('postId', '==', postId),
          orderBy('createdAt', 'desc'),
        )
        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      } catch (error) {
        console.error('Error getting comments:', error)
        return []
      }
    },
  },
})
