// =================================================================================================
// Imports
// =================================================================================================
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { defineStore } from 'pinia'
import { auth, db, storage, updateProfile } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
const VITE_POST_COLLECTION = import.meta.env.VITE_POST_COLLECTION
const VITE_USERS_COLLECTION = import.meta.env.VITE_USERS_COLLECTION
const VITE_COMMENTS = import.meta.env.VITE_COMMENTS

// =================================================================================================
// Profile Store
// =================================================================================================
export const useProfileStore = defineStore('profile', {
  state: () => ({
    posts: [],
    loading: false,
    error: null,
    userActivity: {
      posts: 0,
      comments: 0,
      reactionsReceived: 0,
      reactionsGiven: 0,
    },
  }),
  actions: {
    /**
     * Fetches all posts for a specific user.
     * @param {string} userId - The ID of the user whose posts to fetch.
     */
    async fetchUserPosts (userId) {
      this.loading = true
      this.error = null
      this.posts = []

      try {
        const postsRef = collection(db, VITE_POST_COLLECTION)
        const q = query(postsRef, where('uid', '==', userId), orderBy('createdAt', 'desc'))
        const querySnapshot = await getDocs(q)

        const posts = []
        const authStore = useAuthStore()
        const user = authStore.user

        for (const doc of querySnapshot.docs) {
          const post = { id: doc.id, ...doc.data() }

          // Handle anonymous posts
          if (post.isAnonymous) {
            post.user = {
              displayName: 'Anonymous',
              photoURL: null,
            }
          } else if (post.uid && user) {
            // Assign user data to the post
            post.user = {
              displayName: user.displayName,
              photoURL: user.photoURL,
            }
          }
          posts.push(post)
        }
        this.posts = posts
      } catch (error) {
        console.error('Error fetching user posts:', error)
        this.error = 'Failed to fetch posts.'
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetches a summary of a user's activity (post count, comment count, etc.).
     * @param {string} userId - The ID of the user whose activity to fetch.
     */
    async fetchUserActivity (userId) {
      if (!userId) {
        return
      }

      this.loading = true
      this.error = null
      try {
        // 1. Fetch user's posts and calculate reactions received
        const postsQuery = query(collection(db, VITE_POST_COLLECTION), where('uid', '==', userId))
        const postsSnapshot = await getDocs(postsQuery)
        let reactionsReceivedCount = 0

        for (const doc of postsSnapshot.docs) {
          const data = doc.data()
          reactionsReceivedCount += (data.likes || 0)
        }

        // 2. Fetch user's comments
        const commentsQuery = query(collection(db, VITE_COMMENTS), where('user.uid', '==', userId))
        const commentsSnapshot = await getDocs(commentsQuery)

        // 3. Fetch user's given reactions (posts liked by user)
        const reactionsGivenQuery = query(collection(db, VITE_POST_COLLECTION), where('likedBy', 'array-contains', userId))
        const reactionsGivenSnapshot = await getDocs(reactionsGivenQuery)

        // 4. Update state with the fetched activity data
        this.userActivity = {
          posts: postsSnapshot.size,
          comments: commentsSnapshot.size,
          reactionsReceived: reactionsReceivedCount,
          reactionsGiven: reactionsGivenSnapshot.size,
        }
      } catch (error) {
        console.error('Error fetching user activity:', error)
        this.error = 'Failed to fetch user activity.'
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetches a detailed list of a user's activities (posts and comments).
     * @param {string} userId - The ID of the user whose activity details to fetch.
     * @returns {Promise<Array>} A promise that resolves with an array of activity objects.
     */
    async fetchUserActivityDetails (userId) {
      this.loading = true
      this.error = null
      const activities = []

      try {
        // 1. Fetch user's posts
        const postsQuery = query(collection(db, VITE_POST_COLLECTION), where('uid', '==', userId))
        const postsSnapshot = await getDocs(postsQuery)

        for (const doc of postsSnapshot.docs) {
          const data = doc.data()
          activities.push({
            type: 'post',
            id: doc.id,
            title: data.title || 'Untitled Post',
            content: data.whatHappened || '',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            image: data.images?.[0] || null,
          })
        }

        // 2. Fetch user's comments
        const commentsQuery = query(collection(db, VITE_COMMENTS), where('user.uid', '==', userId))
        const commentsSnapshot = await getDocs(commentsQuery)

        for (const doc of commentsSnapshot.docs) {
          const data = doc.data()
          activities.push({
            type: 'comment',
            id: doc.id,
            postId: data.postId,
            content: data.text || '',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          })
        }

        // Sort activities by date in descending order
        activities.sort((a, b) => b.createdAt - a.createdAt)

        return activities
      } catch (error) {
        console.error('Error fetching user activity details:', error)
        this.error = 'Failed to fetch activity details.'
        return []
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetches all posts that a user has interacted with (commented on).
     * @param {string} userId - The ID of the user.
     * @returns {Promise<Array>} A promise that resolves with an array of post objects.
     */
    async fetchUserInteractedPosts (userId) {
      this.loading = true
      this.error = null
      const posts = []
      const postIds = new Set()

      try {
        // 1. Fetch user's comments to get the IDs of the posts they commented on
        const commentsQuery = query(collection(db, VITE_COMMENTS), where('user.uid', '==', userId))
        const commentsSnapshot = await getDocs(commentsQuery)

        for (const doc of commentsSnapshot.docs) {
          const data = doc.data()
          if (data.postId) {
            postIds.add(data.postId)
          }
        }

        // 2. Fetch the details for each unique post ID
        const fetchPromises = Array.from(postIds).map(async postId => {
          const postDocRef = doc(db, VITE_POST_COLLECTION, postId)
          const postDoc = await getDoc(postDocRef)
          if (postDoc.exists()) {
            const postData = postDoc.data()
            const post = { id: postDoc.id, ...postData }

            // Handle anonymous posts
            if (post.isAnonymous) {
              post.user = {
                displayName: 'Anonymous',
                photoURL: null,
              }
            } else if (post.uid) {
              // Fetch the author's user data
              const userDocRef = doc(db, VITE_USERS_COLLECTION, post.uid)
              const userDoc = await getDoc(userDocRef)
              if (userDoc.exists()) {
                post.user = userDoc.data()
              }
            }
            return post
          }
          return null
        })

        const fetchedPosts = await Promise.all(fetchPromises)

        for (const post of fetchedPosts) {
          if (post) {
            posts.push(post)
          }
        }

        return posts
      } catch (error) {
        console.error('Error fetching interacted posts:', error)
        this.error = 'Failed to fetch interacted posts.'
        return []
      } finally {
        this.loading = false
      }
    },

    /**
     * Updates the user's profile information.
     * @param {object} profileData - The new profile data.
     * @param {string} profileData.displayName - The new display name.
     * @param {File} profileData.photoFile - The new profile photo file.
     * @param {string} profileData.bio - The new bio.
     * @returns {Promise<boolean>} A promise that resolves with true if the update was successful.
     */
    async updateUserProfile ({ displayName, photoFile, bio }) {
      this.loading = true
      this.error = null
      const authStore = useAuthStore()

      try {
        const user = auth.currentUser
        if (!user) {
          throw new Error('No user logged in')
        }

        let newPhotoURL = user.photoURL
        const newDisplayName = displayName || user.displayName
        const newBio = bio === undefined ? authStore.user?.bio : bio

        // If a new photo file is provided, upload it to Firebase Storage
        if (photoFile) {
          const fileRef = storageRef(storage, `profile_photos/${user.uid}/${photoFile.name}`)
          const snapshot = await uploadBytes(fileRef, photoFile)
          newPhotoURL = await getDownloadURL(snapshot.ref)
        }

        // Update the user's profile in Firebase Authentication
        await updateProfile(user, {
          displayName: newDisplayName,
          photoURL: newPhotoURL,
        })

        // Update the user's document in Firestore
        const userDocRef = doc(db, VITE_USERS_COLLECTION, user.uid)
        await updateDoc(userDocRef, {
          displayName: newDisplayName,
          photoURL: newPhotoURL,
          bio: newBio,
        })

        // Update the local user state in the auth store
        authStore.$patch({
          user: {
            ...authStore.user,
            displayName: newDisplayName,
            photoURL: newPhotoURL,
            bio: newBio,
          },
        })

        return true
      } catch (error) {
        console.error('Error updating profile:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Follows a user.
     * @param {string} targetUserId - The ID of the user to follow.
     */
    async followUser (targetUserId) {
      this.loading = true
      this.error = null
      const authStore = useAuthStore()
      const currentUserId = authStore.user?.uid

      if (!currentUserId) {
        return
      }

      // Check if current user has blocked the target user
      if (authStore.user.blockedUsers && authStore.user.blockedUsers.includes(targetUserId)) {
        console.warn('You cannot follow a user you have blocked.')
        return false
      }

      const userToFollowRef = doc(db, VITE_USERS_COLLECTION, targetUserId)

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

      try {
        // Add targetUserId to the current user's 'following' array
        const currentUserRef = doc(db, VITE_USERS_COLLECTION, currentUserId)
        await updateDoc(currentUserRef, {
          following: arrayUnion(targetUserId),
        })

        // Add currentUserId to the target user's 'followers' array
        const targetUserRef = doc(db, VITE_USERS_COLLECTION, targetUserId)
        await updateDoc(targetUserRef, {
          followers: arrayUnion(currentUserId),
        })

        // Update the local state to reflect the new following status
        const updatedFollowing = [...(authStore.user.following || []), targetUserId]
        authStore.$patch({
          user: {
            ...authStore.user,
            following: updatedFollowing,
          },
        })
      } catch (error) {
        console.error('Error following user:', error)
        this.error = 'Failed to follow user.'
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Unfollows a user.
     * @param {string} targetUserId - The ID of the user to unfollow.
     */
    async unfollowUser (targetUserId) {
      this.loading = true
      this.error = null
      const authStore = useAuthStore()
      const currentUserId = authStore.user?.uid

      if (!currentUserId) {
        return
      }

      try {
        // Remove targetUserId from the current user's 'following' array
        const currentUserRef = doc(db, VITE_USERS_COLLECTION, currentUserId)
        await updateDoc(currentUserRef, {
          following: arrayRemove(targetUserId),
        })

        // Remove currentUserId from the target user's 'followers' array
        const targetUserRef = doc(db, VITE_USERS_COLLECTION, targetUserId)
        await updateDoc(targetUserRef, {
          followers: arrayRemove(currentUserId),
        })

        // Update the local state to reflect the new following status
        const updatedFollowing = (authStore.user.following || []).filter(id => id !== targetUserId)
        authStore.$patch({
          user: {
            ...authStore.user,
            following: updatedFollowing,
          },
        })
      } catch (error) {
        console.error('Error unfollowing user:', error)
        this.error = 'Failed to unfollow user.'
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
