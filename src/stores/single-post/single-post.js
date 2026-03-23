import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase.js'

const collection_db = import.meta.env.VITE_POST_COLLECTION
const comments_collection = import.meta.env.VITE_COMMENTS
const user_category_reads_collection = import.meta.env.VITE_USER_CATEGORY_READS_COLLECTION
const VITE_USERS_COLLECTION = import.meta.env.VITE_USERS_COLLECTION

function getDocId ({ userId, categoryId }) {
  // Firestore doc IDs cannot contain `/`, so we encode anything potentially unsafe.
  return `${userId}__${encodeURIComponent(String(categoryId))}`
}

export const useSinglePostStore = defineStore('singlePost', {
  state: () => ({
    topCategories: [],
  }),
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

    async incrementCategoryRead ({ userId, category }) {
      if (!userId || !category) {
        return
      }

      const categoryId = category.id || category.label
      const categoryLabel = category.label || categoryId
      if (!categoryId) {
        return
      }

      const docRef = doc(db, user_category_reads_collection, getDocId({ userId, categoryId }))
      await setDoc(docRef, {
        uid: userId,
        categoryId,
        categoryLabel,
        count: increment(1),
        lastReadAt: serverTimestamp(),
      }, { merge: true })
    },

    async fetchTopCategoriesForUser ({ userId, limit = 5 }) {
      if (!userId) {
        return []
      }

      try {
        const q = query(
          collection(db, user_category_reads_collection),
          where('uid', '==', userId),
        )
        const snapshot = await getDocs(q)

        const counts = snapshot.docs.map(d => d.data())
          .map(d => ({
            categoryId: d.categoryId,
            categoryLabel: d.categoryLabel,
            count: d.count || 0,
          }))

        counts.sort((a, b) => b.count - a.count)
        this.topCategories = counts.slice(0, limit)
        return this.topCategories
      } catch (error) {
        console.error('Error fetching top categories:', error)
        this.topCategories = []
        return []
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
    async getUsersForMentions () {
      try {
        const q = query(collection(db, VITE_USERS_COLLECTION))
        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map(doc => {
          const { displayName, photoURL } = doc.data()
          return { uid: doc.id, displayName, photoURL }
        })
      } catch (error) {
        console.error('Error getting users for mentions:', error)
        return []
      }
    },
  },
})
