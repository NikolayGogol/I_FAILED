import { deleteUser, getAuth, signOut } from 'firebase/auth'
import { deleteDoc, doc, getFirestore } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export const useAccountStore = defineStore('account', () => {
  // --- State ---
  const isDeleting = ref(false)

  // --- Composables ---
  const router = useRouter() // Correctly called at the top level

  // --- Getters ---
  // (none for now)

  // --- Actions ---
  async function deleteAccount () {
    isDeleting.value = true
    const auth = getAuth()
    const db = getFirestore()
    const usersCollection = import.meta.env.VITE_USERS_COLLECTION
    const user = auth.currentUser

    if (user) {
      try {
        await deleteDoc(doc(db, usersCollection, user.uid))
        console.log('User document deleted from Firestore')

        await deleteUser(user)
        console.log('User deleted from Firebase Auth')

        await signOut(auth)
        console.log('User signed out')

        router.push('/login')
        return true
      } catch (error) {
        console.error('Error deleting account:', error.message)
        if (error.code === 'auth/requires-recent-login') {
          alert('Please log in again to delete your account.')
          await signOut(auth)
          router.push('/login')
        } else {
          alert('Failed to delete account. Please try again.')
        }
        return false
      } finally {
        isDeleting.value = false
      }
    } else {
      console.warn('No user is currently logged in.')
      router.push('/login')
      isDeleting.value = false
      return false
    }
  }

  return {
    isDeleting,
    deleteAccount,
  }
})
