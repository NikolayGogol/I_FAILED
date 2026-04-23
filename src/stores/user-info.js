import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

const VITE_USERS_COLLECTION = import.meta.env.VITE_USERS_COLLECTION
const VITE_POST_COLLECTION = import.meta.env.VITE_POST_COLLECTION
const VITE_COMMENTS = import.meta.env.VITE_COMMENTS

export const useUserInfoStore = defineStore('userInfo', () => {
  // --- State ---
  const posts = ref([])
  const loading = ref(false)
  const error = ref(null)
  const userActivity = ref({
    posts: 0,
    comments: 0,
    reactionsReceived: 0,
    reactionsGiven: 0,
  })
  const user = ref(null)

  // --- Composables ---
  const router = useRouter()
  const authStore = useAuthStore()

  // --- Getters ---
  const isLoggedIn = computed(() => !!authStore.user)

  // --- Actions ---
  function navigateBasedOnAuth () {
    if (isLoggedIn.value) {
      router.push('/profile')
    } else {
      router.push('/login')
    }
  }

  async function fetchUser (userId) {
    loading.value = true
    error.value = null
    try {
      const userDoc = await getDoc(doc(db, VITE_USERS_COLLECTION, userId))
      if (userDoc.exists()) {
        user.value = { id: userDoc.id, ...userDoc.data() }
        return user.value
      } else {
        error.value = 'User not found'
        // Maybe redirect to a 404 page or home
        // For now, just logging it.
        console.error('User not found with ID:', userId)
        navigateBasedOnAuth()
      }
    } catch (error_) {
      console.error('Error fetching user:', error_)
      error.value = 'Failed to fetch user.'
    } finally {
      loading.value = false
    }
  }

  async function fetchUserPosts (userId) {
    loading.value = true
    error.value = null
    posts.value = []

    try {
      const postsRef = collection(db, VITE_POST_COLLECTION)
      const q = query(postsRef, where('uid', '==', userId))
      const querySnapshot = await getDocs(q)

      let userData = user.value
      if (!userData || userData.id !== userId) {
        const userDoc = await getDoc(doc(db, VITE_USERS_COLLECTION, userId))
        if (userDoc.exists()) {
          userData = { id: userDoc.id, ...userDoc.data() }
        }
      }

      const fetchedPosts = []
      for (const doc of querySnapshot.docs) {
        const postData = doc.data()
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
        fetchedPosts.push(post)
      }
      posts.value = fetchedPosts
    } catch (error_) {
      console.error('Error fetching user posts:', error_)
      error.value = 'Failed to fetch posts.'
    } finally {
      loading.value = false
    }
  }

  async function fetchUserActivity (userId) {
    if (!userId) {
      return
    }

    loading.value = true
    error.value = null
    try {
      const postsQuery = query(collection(db, VITE_POST_COLLECTION), where('uid', '==', userId))
      const postsSnapshot = await getDocs(postsQuery)
      let reactionsReceivedCount = 0
      let publicPostsCount = 0

      for (const doc of postsSnapshot.docs) {
        const data = doc.data()
        reactionsReceivedCount += (data.likes || 0)
        publicPostsCount++
      }

      const commentsQuery = query(collection(db, VITE_COMMENTS), where('user.uid', '==', userId))
      const commentsSnapshot = await getDocs(commentsQuery)

      const reactionsGivenQuery = query(collection(db, VITE_POST_COLLECTION), where('likedBy', 'array-contains', userId))
      const reactionsGivenSnapshot = await getDocs(reactionsGivenQuery)

      userActivity.value = {
        posts: publicPostsCount,
        comments: commentsSnapshot.size,
        reactionsReceived: reactionsReceivedCount,
        reactionsGiven: reactionsGivenSnapshot.size,
      }
    } catch (error_) {
      console.error('Error fetching user activity:', error_)
      error.value = 'Failed to fetch user activity.'
    } finally {
      loading.value = false
    }
  }

  return {
    posts,
    loading,
    error,
    userActivity,
    user,
    fetchUser,
    fetchUserPosts,
    fetchUserActivity,
    navigateBasedOnAuth,
  }
})
