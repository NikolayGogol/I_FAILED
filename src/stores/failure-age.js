import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
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
  const commentHelpFull = 2
  const actualAge = ref(34)
  const lessonsCount = ref(0)
  const withoutLessonsCount = ref(0)
  const shareFailurePublic = ref(0)
  const posts = ref([])
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
      const postsQuery = query(postsRef,
        orderBy('createdAt', 'desc'),
        where('uid', '==', user.uid))
      const postsSnapshot = await getDocs(postsQuery)

      majorFailuresShared.value = postsSnapshot.size

      // eslint-disable-next-line
      postsSnapshot.forEach(doc => {
        posts.value.push({
          id: doc.id,
          ...doc.data(),
        })
        if (doc.data().lessonLearned) {
          lessonsCount.value++
        } else {
          withoutLessonsCount.value++
        }
        if (doc.data().visibility.value === 1) {
          shareFailurePublic.value++
        }
      })
      lessonsLearnedCount.value = lessonsCount.value
      unresolvedFailures.value = withoutLessonsCount.value

      // Fetch comments for Helpful Comments
      const commentsRef = collection(db, VITE_COMMENTS_COLLECTION)
      const commentsQuery = query(commentsRef, where('user.uid', '==', user.uid))
      const commentsSnapshot = await getDocs(commentsQuery)

      let helpfulCount = 0
      // eslint-disable-next-line
      commentsSnapshot.forEach(doc => {
        if (doc.data().likes?.length >= commentHelpFull) {
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
  const majorFailuresSharedData = computed(() => {
    return {
      raw: majorFailuresShared.value,
      count: majorFailuresShared.value * 1,
    }
  })
  const helpfulCommentsTotalData = computed(() => {
    return {
      raw: helpfulCommentsCount.value,
      count: helpfulCommentsCount.value * 0.25,
    }
  })
  const unresolvedFailuresData = computed(() => {
    return {
      raw: unresolvedFailures.value,
      count: -unresolvedFailures.value * 0.1,
    }
  })
  const wisdomGapData = computed(() => {
    return majorFailuresSharedData.value.count + lessonsLearnedTotalData.value.count + helpfulCommentsTotalData.value.count + unresolvedFailuresData.value.count
  })
  const totalAgeData = computed(() => {
    return actualAge.value + wisdomGapData.value
  })
  const lessonsLearnedTotalData = computed(() => {
    return {
      raw: lessonsLearnedCount.value,
      count: lessonsLearnedCount.value * 0.5,
    }
  })
  const calculateProgressData = computed(() => ((totalAgeData.value - actualAge.value) * 100) / (50 - actualAge.value))

  return {
    // state
    actualAge,
    majorFailuresShared,
    shareFailurePublic,
    lessonsLearnedCount,
    //
    majorFailuresSharedData,
    helpfulCommentsTotalData,
    lessonsLearnedTotalData,
    unresolvedFailuresData,
    wisdomGapData,
    totalAgeData,
    calculateProgressData,
    posts,
    // Actions
    fetchFailureAgeStats,
  }
})
