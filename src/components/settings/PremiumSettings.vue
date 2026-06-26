<script setup>
  import dayjs from 'dayjs'
  import { computed } from 'vue'
  import { useAuthStore } from '@/stores/auth.js'

  const authStore = useAuthStore()

  const isPremium = computed(() => authStore.user?.isPremium)
  const premiumUntilDate = computed(() => {
    if (authStore.user?.premiumUntil) {
      const seconds = authStore.user.premiumUntil.seconds
      if (seconds) return dayjs.unix(seconds).format('MMMM D, YYYY')
      return dayjs(authStore.user.premiumUntil).format('MMMM D, YYYY')
    }
    return null
  })
</script>

<template>
  <div class="settings-section">
    <h2>Premium</h2>
    <div class="setting-item">
      <label>Current Plan</label>
      <div class="value">
        <span v-if="isPremium" class="text-primary font-weight-bold">✨ Premium</span>
        <span v-else>Free</span>
      </div>
      <div v-if="isPremium && premiumUntilDate" class="text-caption mt-1">Valid until: {{ premiumUntilDate }}</div>
      <button v-if="!isPremium" class="upgrade-btn" @click="$router.push('/premium')">Upgrade</button>
    </div>
    <div class="setting-item">
      <label>Billing History</label>
      <button class="view-btn">View</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/components/settings/premium.scss';
</style>
