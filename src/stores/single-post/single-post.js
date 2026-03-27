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
import api from '@/axios.js'
import { auth, db } from '@/firebase.js'
import { useUserStore } from '@/stores/user.js'
import { findSwitch } from '@/utils/find-switch.js'
const userStore = useUserStore()

const collection_db = import.meta.env.VITE_POST_COLLECTION
const comments_collection = import.meta.env.VITE_COMMENTS
const user_category_reads_collection = import.meta.env.VITE_USER_CATEGORY_READS_COLLECTION
const VITE_USERS_COLLECTION = import.meta.env.VITE_USERS_COLLECTION
const VITE_NOTIFICATION_COLLECTION = import.meta.env.VITE_NOTIFICATION_COLLECTION

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

    async addComment (postId, user, text) {
      try {
        // Fetch the post details to get the post owner's UID
        const post = await this.getPostById(postId)

        if (!post || post === 'Post not found.') {
          console.error('Post not found for comment notification.')
          return
        }

        const newCommentData = {
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
        }

        const docRef = await addDoc(collection(db, comments_collection), newCommentData)
        const commentId = docRef.id

        // Now call saveCommentAction
        await this.saveCommentAction(post, { id: commentId, text })

        return commentId
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
    async sendCommentEmail ({ post, authStore, comment }) {
      const res = await userStore.getUserById(post.uid)
      const obj = res?.settings?.notify?.email
      const commentSwitch = findSwitch(obj?.switches, 1)
      if (obj && commentSwitch) {
        try {
          await api.post('/send-comment-email', { post, authStore, comment })
          return { success: true }
        } catch (error) {
          console.error('Error sending comment notification email:', error)
          return { success: false, error: error.message }
        }
      }
    },
    async saveCommentAction (post, comment) {
      if (!auth.currentUser) {
        console.error('No user logged in to save comment action.')
        return
      }

      const commenterUid = auth.currentUser.uid
      const postOwnerUid = post.uid
      const postId = post.id
      const commentId = comment.id
      const commentText = comment.text

      // Do not save a notification if a user comments on their own post.
      if (commenterUid === postOwnerUid) {
        return
      }

      const commentsNotificationCollectionRef = collection(db, VITE_NOTIFICATION_COLLECTION, postOwnerUid, 'comments')
      const q = query(
        commentsNotificationCollectionRef,
        where('postId', '==', postId),
        where('commentId', '==', commentId),
        where('commenterUid', '==', commenterUid),
      )
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        const notificationPayload = {
          postId,
          commentId,
          commenterUid,
          commentText,
          createdAt: serverTimestamp(),
        }
        return await addDoc(commentsNotificationCollectionRef, notificationPayload)
      }
      console.log('Comment notification for this comment already exists.')
    },
  },
})
