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
   * @param {string} interval The plan interval ('monthly' or 'yearly')
   * @returns {Promise<boolean>} True if checkout URL was successfully retrieved, false otherwise.
   */
  async function createCheckout (interval = 'monthly', isTrial = false) {
    loading.value = true
    error.value = null

    try {
      const user = authStore.user
      if (!user || !user.uid) {
        throw new Error('No authenticated user found.')
      }

      const response = await api.post('/create-checkout', {
        uid: user.uid,
        interval,
        isTrial,
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

  async function cancelSubscription () {
    loading.value = true
    error.value = null

    try {
      const user = authStore.user
      if (!user || !user.uid) {
        throw new Error('No authenticated user found.')
      }

      await api.post('/cancel-subscription', { uid: user.uid })
      return true
    } catch (error_) {
      console.error('Error canceling subscription:', error_)
      error.value = error_.response?.data?.message || error_.message || 'An unexpected error occurred.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function renewSubscription (interval) {
    loading.value = true
    error.value = null

    try {
      const user = authStore.user
      if (!user || !user.uid) {
        throw new Error('No authenticated user found.')
      }

      await api.post('/renew-subscription', { uid: user.uid, interval })
      return true
    } catch (error_) {
      console.error('Error renewing subscription:', error_)
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
    cancelSubscription,
    renewSubscription,
  }
})
