import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Global computed property to track the user's premium status.
 * Evaluates lazily, so it's safe to import anywhere.
 */
export const isPremium = computed(() => {
  const authStore = useAuthStore()
  return !!authStore.user?.isPremium
})

export const premiumUntil = computed(() => {
  const authStore = useAuthStore()
  const dateStr = authStore.user?.premiumUntil
  if (!dateStr) {
    return null
  }
  return new Date(dateStr)
})
