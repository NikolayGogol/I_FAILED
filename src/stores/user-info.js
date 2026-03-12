import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase'
const VITE_USERS_COLLECTION = import.meta.env.VITE_USERS_COLLECTION
const VITE_POST_COLLECTION = import.meta.env.VITE_POST_COLLECTION
const VITE_COMMENTS = import.meta.env.VITE_COMMENTS

export const useUserInfoStore = defineStore('userInfo', {
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
    user: null,
  }),
  actions: {
    async fetchUser (userId) {
      this.loading = true
      this.error = null
      try {
        const userDoc = await getDoc(doc(db, VITE_USERS_COLLECTION, userId))
        if (userDoc.exists()) {
          this.user = { id: userDoc.id, ...userDoc.data() }
        } else {
          this.error = 'User not found'
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        this.error = 'Failed to fetch user.'
      } finally {
        this.loading = false
      }
    },

    async fetchUserPosts (userId) {
      this.loading = true
      this.error = null
      this.posts = []

      try {
        const postsRef = collection(db, VITE_POST_COLLECTION)
        const q = query(postsRef, where('uid', '==', userId))
        const querySnapshot = await getDocs(q)

        const posts = []
        // Fetch user data once to reuse
        let userData = this.user
        if (!userData || userData.id !== userId) {
          const userDoc = await getDoc(doc(db, VITE_USERS_COLLECTION, userId))
          if (userDoc.exists()) {
            userData = { id: userDoc.id, ...userDoc.data() }
          }
        }

        for (const doc of querySnapshot.docs) {
          const postData = doc.data()
          // Filter out anonymous posts if viewing another user's profile
          // Assuming we want to show all posts if it's the current user viewing their own profile,
          // but the requirement is for a public user info page, so we should probably hide anonymous posts
          // unless we are the owner. But for now, let's just filter based on the isAnonymous flag.
          if (postData.isAnonymous) {
            continue
          }

          const post = { id: doc.id, ...postData }
          if (post.uid && userData) {
            post.user = {
              displayName: userData.displayName,
              photoURL: userData.photoURL,
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
        let publicPostsCount = 0

        for (const doc of postsSnapshot.docs) {
          const data = doc.data()
          // Only count non-anonymous posts for public profile stats?
          // Or count all? Usually stats count everything, but let's stick to what's visible if needed.
          // For now, let's count all, but maybe we should filter anonymous ones if we want to be strict.
          // Let's count all for activity stats.
          reactionsReceivedCount += (data.likes || 0)
          publicPostsCount++
        }

        // 2. Fetch user's comments
        const commentsQuery = query(collection(db, VITE_COMMENTS), where('user.uid', '==', userId))
        const commentsSnapshot = await getDocs(commentsQuery)

        // 3. Fetch user's given reactions (posts liked by user)
        const reactionsGivenQuery = query(collection(db, VITE_POST_COLLECTION), where('likedBy', 'array-contains', userId))
        const reactionsGivenSnapshot = await getDocs(reactionsGivenQuery)

        // 4. Update state
        this.userActivity = {
          posts: publicPostsCount,
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
  },
})
