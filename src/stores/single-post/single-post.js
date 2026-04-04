import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { defineStore } from 'pinia'
import api from '@/axios.js'
import { auth, db } from '@/firebase.js'
import { useAuthStore } from '@/stores/auth.js'
import { useUserStore } from '@/stores/user.js'
import { findSwitch } from '@/utils/find-switch.js'

// Firestore collection names from environment variables
const collection_db = import.meta.env.VITE_POST_COLLECTION
const user_category_reads_collection = import.meta.env.VITE_USER_CATEGORY_READS_COLLECTION
const VITE_USERS_COLLECTION = import.meta.env.VITE_USERS_COLLECTION
const VITE_NOTIFICATION_COLLECTION = import.meta.env.VITE_NOTIFICATION_COLLECTION
const VITE_STATISTIC_COLLECTION = import.meta.env.VITE_STATISTIC_COLLECTION

/**
 * Helper function to check if Do Not Disturb (DND) is active for a user.
 * @param {object} dndSettings - The DND settings object from the user's profile.
 * @returns {boolean} - True if DND is active, false otherwise.
 */
export function isDoNotDisturbActive (dndSettings) {
  if (!dndSettings || !dndSettings.from || !dndSettings.to) {
    return false
  }

  const { from, to, timezone } = dndSettings

  if (!timezone) {
    return false
  }

  try {
    const now = new Date()
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
    const startTime = new Date(userTime)
    startTime.setHours(from.hours, from.minutes, 0, 0)
    const endTime = new Date(userTime)
    endTime.setHours(to.hours, to.minutes, 0, 0)

    if (startTime > endTime) {
      return userTime >= startTime || userTime < endTime
    }

    return userTime >= startTime && userTime < endTime
  } catch (error) {
    console.error('Error checking Do Not Disturb status:', error)
    return false
  }
}

/**
 * Creates a document ID for user-category reads.
 * @param {object} params - The parameters for creating the doc ID.
 * @param {string} params.userId - The user's ID.
 * @param {string} params.categoryId - The category's ID.
 * @returns {string} - The generated document ID.
 */
function getDocId ({ userId, categoryId }) {
  return `${userId}__${encodeURIComponent(String(categoryId))}`
}

export const useSinglePostStore = defineStore('singlePost', {
  state: () => ({
    topCategories: [],
  }),
  actions: {
    /**
     * Fetches a single post by its ID.
     * @param {string} id - The ID of the post to fetch.
     * @returns {Promise<object|string>} - The post object or an error message.
     */
    async getPostById (id) {
      try {
        const docRef = doc(db, collection_db, id)
        const docSnap = await getDoc(docRef)
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : 'Post not found.'
      } catch {
        return 'Failed to load the post.'
      }
    },

    /**
     * Increments the view count of a post.
     * @param {string} id - The ID of the post.
     */
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

    /**
     * Increments the read count for a specific category for a user.
     * @param {object} params - The parameters.
     * @param {string} params.userId - The user's ID.
     * @param {object} params.category - The category object.
     */
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

    /**
     * Fetches all users for mention suggestions.
     * @returns {Promise<Array<object>>} - An array of user objects.
     */
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

    /**
     * Sends an email notification for a new comment.
     * @param {object} params - The parameters.
     * @param {object} params.post - The post object.
     * @param {object} params.authStore - The auth store user object.
     * @param {object} params.comment - The comment object.
     */
    async sendCommentEmail ({ post, authStore, comment }) {
      const userStore = useUserStore()
      const res = await userStore.getUserById(post.uid)

      const dndSettings = res?.settings?.notify?.doNotDisturb
      if (isDoNotDisturbActive(dndSettings)) {
        console.log('Do Not Disturb is active for user. Email notification not sent.')
        return
      }

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

    /**
     * Sends a push notification for a new comment.
     * @param {object} payload - The post object.
     * @param {string} id - The comment ID.
     */
    async sendCommentPush (payload, id) {
      const userStore = useUserStore()
      const res = await userStore.getUserById(payload.uid)

      const dndSettings = res?.settings?.notify?.doNotDisturb
      if (isDoNotDisturbActive(dndSettings)) {
        console.log('Do Not Disturb is active for user. Push notification not sent.')
        return
      }

      const authStore = useAuthStore()

      const obj = res?.settings?.notify?.push
      const commentSwitch = findSwitch(obj?.switches, 1)
      if (obj && commentSwitch) {
        try {
          await api.post('/send-comment-push', {
            fcmToken: res.fcmToken,
            postTitle: payload.title,
            likedBy: authStore.user?.displayName,
            type: 'comment',
            postId: payload.id,
            commentID: id,
          })
          return { success: true }
        } catch (error) {
          console.error('Error sending comment notification email:', error)
          return { success: false, error: error.message }
        }
      }
    },

    /**
     * Saves a notification for a comment action.
     * @param {object} post - The post object.
     * @param {object} comment - The comment object.
     */
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
    },

    /**
     * Saves a notification for a mention action.
     * @param {object} post - The post object.
     * @param {object} comment - The comment object.
     * @param {object} mentionedUser - The user who was mentioned.
     * @param {object} mentionerUser - The user who made the mention.
     */
    async saveMentionAction (post, comment, mentionedUser, mentionerUser) {
      if (!auth.currentUser) {
        console.error('No user logged in to save mention action.')
        return
      }

      const mentionerUid = mentionerUser.uid
      const mentionedUid = mentionedUser.uid
      const postId = post.id
      const commentId = comment.id
      const commentText = comment.text

      if (mentionerUid === mentionedUid) {
        return
      }

      const mentionsNotificationCollectionRef = collection(db, VITE_NOTIFICATION_COLLECTION, mentionedUid, 'mentions')
      const q = query(
        mentionsNotificationCollectionRef,
        where('postId', '==', postId),
        where('commentId', '==', commentId),
        where('mentionerUid', '==', mentionerUid),
      )
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        const notificationPayload = {
          postId,
          commentId,
          mentionerUid,
          commentText,
          createdAt: serverTimestamp(),
        }
        return await addDoc(mentionsNotificationCollectionRef, notificationPayload)
      }
    },

    /**
     * Sends an email notification for a mention.
     * @param {object} post - The post object.
     * @param {object} comment - The comment object.
     * @param {object} mentionedUser - The user who was mentioned.
     * @param {object} mentionerUser - The user who made the mention.
     */
    async sendMentionEmail (post, comment, mentionedUser, mentionerUser) {
      const dndSettings = mentionedUser?.settings?.notify?.doNotDisturb
      if (isDoNotDisturbActive(dndSettings)) {
        console.log('Do Not Disturb is active for user. Mention email not sent.')
        return
      }

      const obj = mentionedUser?.settings?.notify?.email
      const mentionSwitch = findSwitch(obj?.switches, 2)

      if (obj && mentionSwitch) {
        try {
          await api.post('/send-mention-email', {
            recipientEmail: mentionedUser.email,
            mentionerName: mentionerUser.displayName,
            postTitle: post.title,
            commentText: comment.text,
            postLink: `${window.location.origin}/post/${post.id}`,
          })
          return { success: true }
        } catch (error) {
          console.error('Error sending mention notification email:', error)
          return { success: false, error: error.message }
        }
      }
    },

    /**
     * Sends a push notification for a mention.
     * @param {object} post - The post object.
     * @param {object} mentionedUser - The user who was mentioned.
     */
    async sendMentionPush (post, mentionedUser) {
      const dndSettings = mentionedUser?.settings?.notify?.doNotDisturb
      if (isDoNotDisturbActive(dndSettings)) {
        console.log('Do Not Disturb is active for user. Mention push not sent.')
        return
      }

      const authStore = useAuthStore()
      const pushObj = mentionedUser?.settings?.notify?.push
      const pushSwitch = findSwitch(pushObj?.switches, 2)
      if (pushObj && pushSwitch && mentionedUser.fcmToken) {
        try {
          await api.post('/send-mention-push', {
            fcmToken: mentionedUser.fcmToken,
            postTitle: post.title,
            likedBy: authStore.user?.displayName,
            type: 'mention',
            postId: post.id,
          })
        } catch (error) {
          console.error('Error sending mention push notification:', error)
        }
      }
    },

    /**
     * Adds a post to a user's "read" list.
     * @param {object} payload - The post object.
     */
    async addToRead (payload) {
      try {
        const uid = auth.currentUser.uid
        const readCollectionRef = collection(db, VITE_STATISTIC_COLLECTION, uid, 'what_I_read')
        const q = query(readCollectionRef,
          where('postId', '==', payload.id),
          where('uid', '==', uid),
        )
        const querySnapshot = await getDocs(q)
        const res = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        if (res.length === 0) {
          const params = {
            postId: payload.id,
            uid,
            createdAt: serverTimestamp(),
          }
          return await addDoc(readCollectionRef, params)
        }
      } catch (error) {
        console.error('Error adding to read:', error)
        return 'Failed to add to read list.'
      }
    },
  },
})
