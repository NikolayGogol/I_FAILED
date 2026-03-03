import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  limit,
  query,
  updateDoc,
} from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

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
        const usersRef = collection(db, 'users')
        const q = query(usersRef, limit(15)) // Get up to 15 users
        const querySnapshot = await getDocs(q)
        this.users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
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
      const userToFollowRef = doc(db, 'users', userIdToFollow)
      const currentUserRef = doc(db, 'users', currentUserId)

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
      const userToUnfollowRef = doc(db, 'users', userIdToUnfollow)
      const currentUserRef = doc(db, 'users', currentUserId)

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
      const userToBlockRef = doc(db, 'users', userIdToBlock)
      const currentUserRef = doc(db, 'users', currentUserId)
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
      const currentUserRef = doc(db, 'users', currentUserId)

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
