import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { defineStore } from 'pinia'
import api from '@/axios'
import { auth, db } from '@/firebase'
import { useAuthStore } from '@/stores/auth.js'
import { isDoNotDisturbActive } from '@/stores/single-post/single-post.js'
import { useUserStore } from '@/stores/user.js'
import { findSwitch } from '@/utils/find-switch.js'

const userStore = useUserStore()
const VITE_POST_COLLECTION = import.meta.env.VITE_POST_COLLECTION
const VITE_COMMENTS_COLLECTION = import.meta.env.VITE_COMMENTS
const VITE_BOOKMARKS_COLLECTION = import.meta.env.VITE_BOOKMARKS
const VITE_NOTIFICATION_COLLECTION = import.meta.env.VITE_NOTIFICATION_COLLECTION

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
    async sendLikeNotification (payload) {
      const res = await userStore.getUserById(payload.uid)

      const dndSettings = res?.settings?.notify?.doNotDisturb
      if (isDoNotDisturbActive(dndSettings)) {
        console.log('Do Not Disturb is active for user. Notification not sent.')
        return
      }

      const authStore = useAuthStore()

      const pushObj = res?.settings?.notify?.push
      const pushSwitch = findSwitch(pushObj?.switches, 0)

      if (pushObj && pushSwitch && res.fcmToken) {
        try {
          await api.post('/send-like-push', {
            fcmToken: res.fcmToken,
            postTitle: payload.title,
            likedBy: authStore.user?.displayName,
            type: 'like',
            postId: payload.id,
          })
        } catch (error) {
          console.error('Error sending like push notification:', error)
        }
      }

      const obj = res?.settings?.notify?.email
      const emailSwitch = findSwitch(obj?.switches, 0)
      if (obj && emailSwitch) {
        try {
          await api.post('/send-like-email', payload)
          return { success: true }
        } catch (error) {
          console.error('Error sending like notification:', error)
          return { success: false, error: error.message }
        }
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
    async saveLikeAction (payload, likeType = 'postCard') {
      if (!auth.currentUser) {
        console.error('No user logged in to save like action.')
        return
      }
      const likerUid = auth.currentUser.uid
      const postOwnerUid = payload.uid

      // Do not save a notification if a user likes their own post.
      if (likerUid === postOwnerUid) {
        return
      }

      const likesCollectionRef = collection(db, VITE_NOTIFICATION_COLLECTION, postOwnerUid, 'likes')
      const q = query(likesCollectionRef,
        where('postId', '==', payload.postId),
        where('commentId', '==', payload.id),
        where('uid', '==', likerUid))
      const querySnapshot = await getDocs(q)
      if (querySnapshot.empty) {
        const notificationPayload = {
          postId: payload.postId,
          uid: likerUid, // UID of the user who liked the post
          createdAt: serverTimestamp(),
          commentId: payload.id,
          likeType,
        }
        return await addDoc(likesCollectionRef, notificationPayload)
      }
      // If a like action from this user for this post already exists, do nothing.
      console.log('Like action already exists.')
    },
  },
})
