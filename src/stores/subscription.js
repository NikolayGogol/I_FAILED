import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/axios.js'
import { useAuthStore } from '@/stores/auth.js'

export const useSubscriptionStore = defineStore('subscription', () => {
  const authStore = useAuthStore()

  const loading = ref(false)
  const error = ref(null)

  /**
   * Creates a new premium checkout for the current user.
   * @returns {Promise<boolean>} True if checkout URL was successfully retrieved, false otherwise.
   */
  async function createCheckout () {
    loading.value = true
    error.value = null

    try {
      const user = authStore.user
      if (!user || !user.uid) {
        throw new Error('No authenticated user found.')
      }

      const response = await api.post('/create-checkout', {
        uid: user.uid,
      })

      if (response.data.checkoutUrl) {
          window.location.href = response.data.checkoutUrl
          return true
      } else {
        error.value = response.data.message || 'Failed to create checkout.'
        return false
      }
    } catch (error_) {
      console.error('Error creating checkout:', error_)
      error.value = error_.response?.data?.message || error_.message || 'An unexpected error occurred.'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    createCheckout,
  }
})
