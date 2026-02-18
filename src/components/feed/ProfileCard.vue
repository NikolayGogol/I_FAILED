<template>
  <section class="right-card profile-card">
    <div class="profile-top">
      <template  v-if="currentUserName">
        <div class="profile-avatar">
          <span>{{ currentUserInitials }}</span>
        </div>
        <div class="profile-info">
          <div class="profile-name">
            {{ currentUserName }}
          </div>
          <div class="profile-handle">
            {{ currentUserHandle }}
          </div>
        </div>
      </template>
      <v-spacer />
      <v-btn
        v-if="authStore.user"
        class="logout-btn"
        size="small"
        variant="text"
        @click="handleLogout"
      >
        Log out
      </v-btn>
      <v-btn
        v-else
        class="logout-btn"
        size="small"
        to="/login"
        variant="text"
      >
        Log in
      </v-btn>
    </div>

    <v-text-field
      v-model="search"
      class="profile-search"
      density="compact"
      hide-details
      placeholder="Search"
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
    />
  </section>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import '@/styles/components/profile-card.scss'

  const authStore = useAuthStore()
  const search = ref('')

  const currentUserName = computed(() => authStore.user?.displayName)
  const currentUserHandle = computed(() => authStore.user?.email)
  const currentUserInitials = computed(() => {
    const name = currentUserName.value
    const parts = name.split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
  })

  async function handleLogout () {
    await authStore.logout()
  }
</script>
