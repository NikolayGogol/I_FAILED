<script setup>
  import { storeToRefs } from 'pinia'
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth.js'
  import '@/styles/components/profile/user-card.scss'

  const authStore = useAuthStore()
  const router = useRouter()
  const { user } = storeToRefs(authStore)

  const displayName = computed(() => user.value?.displayName || 'User')
  const email = computed(() => user.value?.email || '')
  const photoURL = computed(() => user.value?.photoURL)
  const initials = computed(() => {
    const name = displayName.value
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + (parts[1]?.charAt(0) || '')).toUpperCase()
  })
  const joinDate = computed(() => {
    if (user.value?.metadata?.creationTime) {
      return new Date(user.value.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
    return 'Unknown'
  })

  function goToSettings () {
    router.push('/settings')
  }
</script>

<template>
  <div class="user-card">
    <div class="user-card-header">
      <div class="user-avatar">
        <v-img
          v-if="photoURL"
          alt="Profile"
          cover
          :src="photoURL"
        />
        <span v-else>{{ initials }}</span>
      </div>

      <div class="user-main-info">
        <div class="user-name-row">
          <h2>{{ displayName }}</h2>
          <button class="edit-profile-btn" @click="goToSettings">Edit profile</button>
        </div>
        <p class="user-email">{{ email }}</p>
        <p class="user-bio">Entrepreneur learning from startup failures. Sharing my journey to help others.</p>

        <div class="user-meta">
          <span class="join-date">Joined {{ joinDate }}</span>
        </div>

        <div class="user-stats">
          <span><strong>2</strong> followers</span>
          <span><strong>2</strong> following</span>
        </div>

        <div class="user-badge">
          Failure Age: 24.5 years
        </div>
      </div>
    </div>

    <hr class="user-card-divider">

    <div class="user-activity-footer">
      <div class="activity-stat">
        <span class="stat-value">12</span>
        <span class="stat-label">Posts</span>
      </div>
      <div class="activity-stat">
        <span class="stat-value">45</span>
        <span class="stat-label">Comments</span>
      </div>
      <div class="activity-stat">
        <span class="stat-value">156</span>
        <span class="stat-label">Reactions Received</span>
      </div>
      <div class="activity-stat">
        <span class="stat-value">89</span>
        <span class="stat-label">Reactions Given</span>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
