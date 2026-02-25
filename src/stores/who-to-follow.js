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
        return
      }
      const currentUserId = authStore.user.uid
      const userToFollowRef = doc(db, 'users', userIdToFollow)
      const currentUserRef = doc(db, 'users', currentUserId)

      try {
        // Add userIdToFollow to the 'following' array of the current user
        await updateDoc(currentUserRef, {
          following: arrayUnion(userIdToFollow),
        })

        // Add currentUserId to the 'followers' array of the user being followed
        await updateDoc(userToFollowRef, {
          followers: arrayUnion(currentUserId),
        })

        // Update the local state
        const user = this.users.find(u => u.id === userIdToFollow)
        if (user) {
          if (!user.followers) {
            user.followers = []
          }
          user.followers.push(currentUserId)
        }
        const currentUser = this.users.find(u => u.id === currentUserId)
        if (currentUser) {
          if (!currentUser.following) {
            currentUser.following = []
          }
          currentUser.following.push(userIdToFollow)
        }
      } catch (error) {
        console.error('Error following user:', error)
      }
    },

    async unfollowUser (userIdToUnfollow) {
      const authStore = useAuthStore()
      if (!authStore.user) {
        console.error('User not authenticated')
        return
      }
      const currentUserId = authStore.user.uid
      const userToUnfollowRef = doc(db, 'users', userIdToUnfollow)
      const currentUserRef = doc(db, 'users', currentUserId)

      try {
        // Remove userIdToUnfollow from the 'following' array of the current user
        await updateDoc(currentUserRef, {
          following: arrayRemove(userIdToUnfollow),
        })

        // Remove currentUserId from the 'followers' array of the user being unfollowed
        await updateDoc(userToUnfollowRef, {
          followers: arrayRemove(currentUserId),
        })

        // Update the local state
        const user = this.users.find(u => u.id === userIdToUnfollow)
        if (user && user.followers) {
          user.followers = user.followers.filter(id => id !== currentUserId)
        }
        const currentUser = this.users.find(u => u.id === currentUserId)
        if (currentUser && currentUser.following) {
          currentUser.following = currentUser.following.filter(id => id !== userIdToUnfollow)
        }
      } catch (error) {
        console.error('Error unfollowing user:', error)
      }
    },
  },
})
