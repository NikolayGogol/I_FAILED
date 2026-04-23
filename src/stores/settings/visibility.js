import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/firebase.js'
import { useAuthStore } from '@/stores/auth'
const USER_COLLECTION = import.meta.env.VITE_USERS_COLLECTION

export const useVisibilityStore = defineStore('visibility', () => {
  const isPrivate = ref(false)
  const isLoading = ref(false)
  const showConfirmationModal = ref(false)

  function setPrivate (value) {
    isPrivate.value = value
  }

  function setLoading (value) {
    isLoading.value = value
  }

  function setShowConfirmationModal (value) {
    showConfirmationModal.value = value
  }

  async function initializePrivacy () {
    const authStore = useAuthStore()
    if (!authStore.user) {
      return
    }

    setLoading(true)
    try {
      const userRef = doc(db, USER_COLLECTION, authStore.user.uid)
      const userDoc = await getDoc(userRef)
      if (userDoc.exists()) {
        setPrivate(userDoc.data().isPrivate || false)
      }
    } catch (error) {
      console.error('Failed to initialize privacy setting:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updatePrivacy (value) {
    const authStore = useAuthStore()
    if (!authStore.user) {
      return
    }

    setLoading(true)
    try {
      const userRef = doc(db, USER_COLLECTION, authStore.user.uid)
      await updateDoc(userRef, { isPrivate: value })
      setPrivate(value)
    } catch (error) {
      console.error('Failed to update privacy:', error)
      // Optionally revert state or show error
    } finally {
      setLoading(false)
    }
  }

  function handlePrivateToggle (newValue) {
    if (newValue === true && isPrivate.value === false) {
      setShowConfirmationModal(true)
    } else {
      updatePrivacy(newValue)
    }
  }

  async function onConfirmPrivacyChange () {
    setShowConfirmationModal(false)
    await updatePrivacy(true)
  }

  function onCancelPrivacyChange () {
    setShowConfirmationModal(false)
  }

  return {
    isPrivate,
    isLoading,
    showConfirmationModal,
    setPrivate,
    setLoading,
    setShowConfirmationModal,
    initializePrivacy,
    handlePrivateToggle,
    onConfirmPrivacyChange,
    onCancelPrivacyChange,
  }
})
