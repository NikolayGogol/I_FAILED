import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
const VITE_USERS_COLLECTION = import.meta.env.VITE_USERS_COLLECTION
const VITE_POST_COLLECTION = import.meta.env.VITE_POST_COLLECTION

export const useWhoToFollowStore = defineStore('whoToFollow', {
  state: () => ({
    users: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchAllUsers () {
      if (this.users.length > 0) {
        return
      }

      this.loading = true
      this.error = null
      try {
        const usersRef = collection(db, VITE_USERS_COLLECTION)
        const q = query(usersRef, limit(15)) // Get up to 15 users
        const querySnapshot = await getDocs(q)
        const users = []
        for (const doc of querySnapshot.docs) {
          const user = { id: doc.id, ...doc.data() }
          const postsQuery = query(collection(db, VITE_POST_COLLECTION), where('uid', '==', user.id))
          const postsSnapshot = await getDocs(postsQuery)
          user.postCount = postsSnapshot.size
          users.push(user)
        }
        this.users = users
      } catch (error) {
        this.error = 'Failed to fetch users.'
        console.error('Error fetching users:', error)
      } finally {
        this.loading = false
      }
    },
    async followUser (userIdToFollow) {
      const authStore = useAuthStore()
      if (!authStore.user) {
        console.error('User not authenticated')
        return false
      }
      const currentUserId = authStore.user.uid

      // Check if current user has blocked the target user
      if (authStore.user.blockedUsers && authStore.user.blockedUsers.includes(userIdToFollow)) {
        console.warn('You cannot follow a user you have blocked.')
        return false
      }

      const userToFollowRef = doc(db, VITE_USERS_COLLECTION, userIdToFollow)

      // Check if the target user has blocked the current user
      try {
        const userToFollowSnap = await getDoc(userToFollowRef)
        if (userToFollowSnap.exists()) {
          const userData = userToFollowSnap.data()
          if (userData.blockedUsers && userData.blockedUsers.includes(currentUserId)) {
            console.warn('Cannot follow this user as they have blocked you.')
            return false
          }
        }
      } catch (error) {
        console.error('Error checking user block status:', error)
        return false
      }

      const currentUserRef = doc(db, VITE_USERS_COLLECTION, currentUserId)

      try {
        await updateDoc(currentUserRef, {
          following: arrayUnion(userIdToFollow),
        })
        await updateDoc(userToFollowRef, {
          followers: arrayUnion(currentUserId),
        })

        return true
      } catch (error) {
        console.error('Error following user:', error)
        return false
      }
    },

    async unfollowUser (userIdToUnfollow) {
      const authStore = useAuthStore()
      if (!authStore.user) {
        console.error('User not authenticated')
        return false
      }
      const currentUserId = authStore.user.uid
      const userToUnfollowRef = doc(db, VITE_USERS_COLLECTION, userIdToUnfollow)
      const currentUserRef = doc(db, VITE_USERS_COLLECTION, currentUserId)

      try {
        await updateDoc(currentUserRef, {
          following: arrayRemove(userIdToUnfollow),
        })
        await updateDoc(userToUnfollowRef, {
          followers: arrayRemove(currentUserId),
        })

        return true
      } catch (error) {
        console.error('Error unfollowing user:', error)
        return false
      }
    },

    async blockUser (userIdToBlock) {
      const authStore = useAuthStore()
      if (!authStore.user) {
        console.error('User not authenticated')
        return false
      }
      const currentUserId = authStore.user.uid

      // Unfollow each other first
      await this.unfollowUser(userIdToBlock)
      // And make the other user unfollow the current user
      const userToBlockRef = doc(db, VITE_USERS_COLLECTION, userIdToBlock)
      const currentUserRef = doc(db, VITE_USERS_COLLECTION, currentUserId)
      try {
        await updateDoc(userToBlockRef, {
          following: arrayRemove(currentUserId),
        })
        await updateDoc(currentUserRef, {
          followers: arrayRemove(userIdToBlock),
        })
      } catch (error) {
        console.error('Error during mutual unfollow on block:', error)
        // We can continue even if this fails
      }

      // Now, block the user
      try {
        await updateDoc(currentUserRef, {
          blockedUsers: arrayUnion(userIdToBlock),
        })
        return true
      } catch (error) {
        console.error('Error blocking user:', error)
        return false
      }
    },

    async unblockUser (userIdToUnblock) {
      const authStore = useAuthStore()
      if (!authStore.user) {
        console.error('User not authenticated')
        return false
      }
      const currentUserId = authStore.user.uid
      const currentUserRef = doc(db, VITE_USERS_COLLECTION, currentUserId)

      try {
        await updateDoc(currentUserRef, {
          blockedUsers: arrayRemove(userIdToUnblock),
        })
        return true
      } catch (error) {
        console.error('Error unblocking user:', error)
        return false
      }
    },
  },
})
