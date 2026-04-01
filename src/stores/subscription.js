import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/axios.js'
import { useAuthStore } from '@/stores/auth.js'

export const useSubscriptionStore = defineStore('subscription', () => {
  const authStore = useAuthStore()

  const loading = ref(false)
  const error = ref(null)

  /**
   * Creates a new premium subscription for the current user.
   * @param {string} paymentMethodId - The Stripe PaymentMethod ID.
   * @returns {Promise<boolean>} True if subscription was successful, false otherwise.
   */
  async function createSubscription (paymentMethodId) {
    loading.value = true
    error.value = null

    try {
      const user = authStore.user
      if (!user || !user.uid) {
        throw new Error('No authenticated user found.')
      }

      const response = await api.post('/create-subscription', {
        uid: user.uid,
        paymentMethodId,
      })

      if (response.data.status === 'success') {
        // Update user's subscription status in auth store
        authStore.$patch({
          user: {
            ...authStore.user,
            isPremium: true,
            premiumSince: response.data.premiumSince,
            premiumUntil: response.data.premiumUntil,
          },
        })
        return true
      } else {
        error.value = response.data.message || 'Failed to create subscription.'
        return false
      }
    } catch (error_) {
      console.error('Error creating subscription:', error_)
      error.value = error_.response?.data?.message || error_.message || 'An unexpected error occurred.'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    createSubscription,
  }
})
