import { collection, getDocs, query, where } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/firebase'
import { useAuthStore } from './auth'

const VITE_POST_COLLECTION = import.meta.env.VITE_POST_COLLECTION
const VITE_COMMENTS_COLLECTION = import.meta.env.VITE_COMMENTS

export const useFailureAgeStore = defineStore('failureAge', () => {
  // --- State ---
  const majorFailuresShared = ref(0)
  const lessonsLearnedCount = ref(0)
  const helpfulCommentsCount = ref(0)
  const unresolvedFailures = ref(0)
  const loading = ref(false)
  const error = ref(null)
  const countHelpfull = 2
  // --- Actions ---
  async function fetchFailureAgeStats () {
    const authStore = useAuthStore()
    const user = authStore.user

    if (!user || !user.uid) {
      console.warn('User is not authenticated. Cannot fetch stats.')
      majorFailuresShared.value = 0
      lessonsLearnedCount.value = 0
      helpfulCommentsCount.value = 0
      return
    }

    loading.value = true
    error.value = null

    try {
      // Fetch posts for Major Failures and Lessons Learned
      const postsRef = collection(db, VITE_POST_COLLECTION)
      const postsQuery = query(postsRef, where('uid', '==', user.uid))
      const postsSnapshot = await getDocs(postsQuery)

      majorFailuresShared.value = postsSnapshot.size

      let lessonsCount = 0
      let withoutLessonsCount = 0
      // eslint-disable-next-line
      postsSnapshot.forEach(doc => {
        if (doc.data().lessonLearned) {
          lessonsCount++
        } else {
          withoutLessonsCount++
        }
      })
      lessonsLearnedCount.value = lessonsCount
      unresolvedFailures.value = withoutLessonsCount

      // Fetch comments for Helpful Comments
      const commentsRef = collection(db, VITE_COMMENTS_COLLECTION)
      const commentsQuery = query(commentsRef, where('user.uid', '==', user.uid))
      const commentsSnapshot = await getDocs(commentsQuery)

      let helpfulCount = 0
      // eslint-disable-next-line
      commentsSnapshot.forEach(doc => {
        if (doc.data().likes?.length >= 2) {
          helpfulCount++
        }
      })
      helpfulCommentsCount.value = helpfulCount
    } catch (error_) {
      console.error('Error fetching failure age stats:', error_)
      error.value = 'Failed to fetch stats.'
      majorFailuresShared.value = 0
      lessonsLearnedCount.value = 0
      helpfulCommentsCount.value = 0
    } finally {
      loading.value = false
    }
  }

  return {
    majorFailuresShared,
    lessonsLearnedCount,
    helpfulCommentsCount,
    unresolvedFailures,
    loading,
    error,
    fetchFailureAgeStats,
  }
})
