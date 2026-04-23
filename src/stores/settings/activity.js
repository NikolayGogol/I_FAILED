import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/firebase.js'
import { useAuthStore } from '@/stores/auth'
const USER_COLLECTION = import.meta.env.VITE_USERS_COLLECTION

export const useActivityStore = defineStore('activity', () => {
  const selectedLikes = ref('all')
  const selectedComments = ref('all')
  const isLoading = ref(false)

  function setLoading(value) {
    isLoading.value = value
  }

  async function initializeActivitySettings() {
    const authStore = useAuthStore()
    if (!authStore.user) {
      return
    }

    setLoading(true)
    try {
      const userRef = doc(db, USER_COLLECTION, authStore.user.uid)
      const userDoc = await getDoc(userRef)
      if (userDoc.exists()) {
        const data = userDoc.data()
        selectedLikes.value = data.likesVisibility || 'all'
        selectedComments.value = data.commentsVisibility || 'all'
      }
    } catch (error) {
      console.error('Failed to initialize activity settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateLikesVisibility(value) {
    const authStore = useAuthStore()
    if (!authStore.user) {
      return
    }

    setLoading(true)
    try {
      const userRef = doc(db, USER_COLLECTION, authStore.user.uid)
      await updateDoc(userRef, { likesVisibility: value })
      selectedLikes.value = value
    } catch (error) {
      console.error('Failed to update likes visibility:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateCommentsVisibility(value) {
    const authStore = useAuthStore()
    if (!authStore.user) {
      return
    }

    setLoading(true)
    try {
      const userRef = doc(db, USER_COLLECTION, authStore.user.uid)
      await updateDoc(userRef, { commentsVisibility: value })
      selectedComments.value = value
    } catch (error) {
      console.error('Failed to update comments visibility:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    selectedLikes,
    selectedComments,
    isLoading,
    initializeActivitySettings,
    updateLikesVisibility,
    updateCommentsVisibility,
  }
})
