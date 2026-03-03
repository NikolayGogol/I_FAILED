import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { defineStore } from 'pinia'
import { auth, db, storage, updateProfile } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

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
    async fetchUserPosts (userId) {
      this.loading = true
      this.error = null
      this.posts = []

      try {
        const postsRef = collection(db, 'posts')
        const q = query(postsRef, where('uid', '==', userId))
        const querySnapshot = await getDocs(q)

        const posts = []
        for (const doc of querySnapshot.docs) {
          const post = { id: doc.id, ...doc.data() }
          if (post.uid) {
            const authStore = useAuthStore()
            post.user = {
              displayName: authStore.user?.displayName,
              photoURL: authStore.user?.photoURL,
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
        const postsQuery = query(collection(db, 'posts'), where('uid', '==', userId))
        const postsSnapshot = await getDocs(postsQuery)
        let reactionsReceivedCount = 0

        for (const doc of postsSnapshot.docs) {
          const data = doc.data()
          reactionsReceivedCount += (data.likes || 0)
        }

        // 2. Fetch user's comments
        // Note: Comments are stored with a nested user object: { user: { uid: ... } }
        // We need to query based on 'user.uid'
        const commentsQuery = query(collection(db, 'comments'), where('user.uid', '==', userId))
        const commentsSnapshot = await getDocs(commentsQuery)

        // 3. Fetch user's given reactions (posts liked by user)
        const reactionsGivenQuery = query(collection(db, 'posts'), where('likedBy', 'array-contains', userId))
        const reactionsGivenSnapshot = await getDocs(reactionsGivenQuery)

        // 4. Update state
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

    async fetchUserActivityDetails (userId) {
      this.loading = true
      this.error = null
      const activities = []

      try {
        // 1. Fetch user's posts
        const postsQuery = query(collection(db, 'posts'), where('uid', '==', userId))
        const postsSnapshot = await getDocs(postsQuery)

        postsSnapshot.forEach(doc => {
          const data = doc.data()
          activities.push({
            type: 'post',
            id: doc.id,
            title: data.stepTwo?.title || 'Untitled Post',
            content: data.stepTwo?.description || '',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            image: data.stepTwo?.images?.[0] || null,
          })
        })

        // 2. Fetch user's comments
        const commentsQuery = query(collection(db, 'comments'), where('user.uid', '==', userId))
        const commentsSnapshot = await getDocs(commentsQuery)

        commentsSnapshot.forEach(doc => {
          const data = doc.data()
          activities.push({
            type: 'comment',
            id: doc.id,
            postId: data.postId,
            content: data.text || '',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          })
        })

        // Sort by date descending
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

    async fetchUserInteractedPosts (userId) {
      this.loading = true
      this.error = null
      const posts = []
      const postIds = new Set()

      try {
        // 1. Fetch user's comments to get post IDs
        const commentsQuery = query(collection(db, 'comments'), where('user.uid', '==', userId))
        const commentsSnapshot = await getDocs(commentsQuery)

        commentsSnapshot.forEach(doc => {
          const data = doc.data()
          if (data.postId) {
            postIds.add(data.postId)
          }
        })

        // 2. Fetch each post details
        const fetchPromises = Array.from(postIds).map(async (postId) => {
          const postDocRef = doc(db, 'posts', postId)
          const postDoc = await getDoc(postDocRef)
          if (postDoc.exists()) {
            return { id: postDoc.id, ...postDoc.data() }
          }
          return null
        })

        const fetchedPosts = await Promise.all(fetchPromises)

        fetchedPosts.forEach(post => {
          if (post) {
            posts.push(post)
          }
        })

        return posts
      } catch (error) {
        console.error('Error fetching interacted posts:', error)
        this.error = 'Failed to fetch interacted posts.'
        return []
      } finally {
        this.loading = false
      }
    },

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

        if (photoFile) {
          const fileRef = storageRef(storage, `profile_photos/${user.uid}/${photoFile.name}`)
          const snapshot = await uploadBytes(fileRef, photoFile)
          newPhotoURL = await getDownloadURL(snapshot.ref)
        }

        await updateProfile(user, {
          displayName: newDisplayName,
          photoURL: newPhotoURL,
        })

        const userDocRef = doc(db, 'users', user.uid)
        await updateDoc(userDocRef, {
          displayName: newDisplayName,
          photoURL: newPhotoURL,
          bio: newBio,
        })

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
  },
})
