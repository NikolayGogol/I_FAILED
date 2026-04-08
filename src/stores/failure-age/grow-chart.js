import { collection, getDocs, query } from 'firebase/firestore' // Removed 'where' from import
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth.js'

const VITE_POST_COLLECTION = import.meta.env.VITE_POST_COLLECTION
const VITE_COMMENTS = import.meta.env.VITE_COMMENTS

export const useGrowChartStore = defineStore('growChart', () => {
  const lessonLearnedPosts = ref([])
  const commentsList = ref([])
  const commentsListOwn = ref([])
  const likesListOwn = ref([])
  const likesList = ref([])
  const loading = ref(false)
  const error = ref(null)
  const authStore = useAuthStore()
  const posts = reactive({
    learnedOwn: [],
    learnedCommunity: [],
    postOwn: [],
    postCommunity: [],
  })
  async function fetchLessonLearnedPosts () {
    loading.value = true
    error.value = null

    const currentUser = authStore.user
    if (!currentUser || !currentUser.uid) {
      error.value = 'User not authenticated.'
      loading.value = false
      return
    }

    try {
      const postsRef = collection(db, VITE_POST_COLLECTION)
      // Fetch all posts from the collection
      const q = query(postsRef) // Simplified query
      const querySnapshot = await getDocs(q)

      const posts = []
      // eslint-disable-next-line
      querySnapshot.forEach((doc) => { // Using forEach for iteration
        const postData = doc.data()
        // Client-side filter: check for lessonLearned and exclude current user's posts
        if (postData.lessonLearned && postData.uid !== currentUser.uid) {
          posts.push({ id: doc.id, ...postData })
        }
      })
      lessonLearnedPosts.value = posts
    } catch (error_) {
      error.value = 'Failed to fetch lesson learned posts.'
      console.error('Error fetching lesson learned posts:', error_)
    } finally {
      loading.value = false
    }
  }
  async function fetchComments () {
    const currentUser = authStore.user
    if (!currentUser || !currentUser.uid) {
      error.value = 'User not authenticated.'
      loading.value = false
      return
    }
    try {
      const postsRef = collection(db, VITE_COMMENTS)
      // Fetch all comments from the collection
      const q = query(postsRef) // Simplified query
      const querySnapshot = await getDocs(q)
      const comments = []
      const commentsOwn = []
      // eslint-disable-next-line
      querySnapshot.forEach((doc) => { // Using forEach for iteration
        const postData = doc.data()
        // Client-side filter: check for lessonLearned and exclude current user's posts
        if (postData.user.uid === currentUser.uid) {
          commentsOwn.push({ id: doc.id, ...postData })
        } else {
          comments.push({ id: doc.id, ...postData })
        }
      })
      commentsList.value = comments
      commentsListOwn.value = commentsOwn
      likesListOwn.value = comments.filter(el => el.likes.includes(currentUser.uid))
      likesList.value = comments.filter(el => el.likes.length)
    } catch (error_) {
      error.value = 'Failed to fetch lesson learned posts.'
      console.error('Error fetching lesson learned posts:', error_)
    }
  }
  async function fetchResilience () {
    const currentUser = authStore.user
    if (!currentUser || !currentUser.uid) {
      error.value = 'User not authenticated.'
      loading.value = false
      return
    }
    const postsRef = collection(db, VITE_POST_COLLECTION)
    const q = query(postsRef) // Simplified query
    const querySnapshot = await getDocs(q)
    // eslint-disable-next-line
    querySnapshot.forEach(doc => {
      const postData = doc.data()
      // Client-side filter: check for lessonLearned and exclude current user's posts
      if (postData.lessonLearned && postData.uid !== currentUser.uid) {
        posts.learnedCommunity.push({ id: doc.id, ...postData })
      }
      if (postData.lessonLearned && postData.uid === currentUser.uid) {
        posts.learnedOwn.push({ id: doc.id, ...postData })
      }
      if (postData.uid !== currentUser.uid) {
        posts.postCommunity.push({ id: doc.id, ...postData })
      }
      if (postData.uid === currentUser.uid) {
        posts.postOwn.push({ id: doc.id, ...postData })
      }
    })
    return posts
  }
  return {
    lessonLearnedPosts,
    commentsList,
    likesList,
    commentsListOwn,
    likesListOwn,
    loading,
    error,
    posts,
    fetchLessonLearnedPosts,
    fetchComments,
    fetchResilience,
  }
})
