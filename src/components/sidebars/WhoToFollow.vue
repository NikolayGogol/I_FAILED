<script setup>
  import { computed, onMounted } from 'vue'
  import { useToast } from 'vue-toastification'
  import { useAuthStore } from '@/stores/auth'
  import { useWhoToFollowStore } from '@/stores/who-to-follow'
  import '@/styles/components/sidebars/who-to-follow.scss'

  const whoToFollowStore = useWhoToFollowStore()
  const authStore = useAuthStore()
  const toast = useToast()

  onMounted(() => {
    whoToFollowStore.fetchAllUsers()
  })

  const filteredUsers = computed(() => {
    if (!authStore.user) {
      return whoToFollowStore.users
    }
    return whoToFollowStore.users.filter(user => user.id !== authStore.user.uid)
  })

  const sortedUsers = computed(() => {
    const usersWithAvatars = filteredUsers.value.filter(user => user.photoURL)
    const usersWithoutAvatars = filteredUsers.value.filter(user => !user.photoURL)
    return [...usersWithAvatars, ...usersWithoutAvatars].slice(0, 5)
  })

  const backgroundColors = [
    '#ffcdd2', '#f8bbd0', '#e1bee7', '#d1c4e9', '#c5cae9',
    '#bbdefb', '#b3e5fc', '#b2ebf2', '#b2dfdb', '#c8e6c9',
    '#dcedc8', '#f0f4c3', '#fff9c4', '#ffecb3', '#ffe0b2',
    '#ffccbc', '#d7ccc8', '#cfd8dc',
  ]

  function getRandomColor () {
    const randomIndex = Math.floor(Math.random() * backgroundColors.length)
    return backgroundColors[randomIndex]
  }

  function getInitials (name) {
    if (!name) return ''
    const parts = name.split(' ')
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase()
    }
    return (parts[0].charAt(0) + (parts[1]?.charAt(0) || '')).toUpperCase()
  }

  function isFollowing (userId) {
    if (!authStore.user || !authStore.user.following) return false
    return authStore.user.following.includes(userId)
  }

  async function handleFollowClick (userId, userName) {
    if (isFollowing(userId)) {
      const success = await whoToFollowStore.unfollowUser(userId)
      if (success) {
        toast.info(`Unfollowed ${userName}`)
      } else {
        toast.error(`Failed to unfollow ${userName}`)
      }
    } else {
      const success = await whoToFollowStore.followUser(userId)
      if (success) {
        toast.info(`Following ${userName}`)
      } else {
        toast.error(`Failed to follow ${userName}`)
      }
    }
  }
</script>
<template>
  <section class="right-card follow-card">
    <header class="right-card-header">
      <h3 class="font-weight-semibold">Who to follow</h3>
    </header>
    <div v-if="whoToFollowStore.loading">
      <!-- You can add a loading skeleton here -->
      <p>Loading...</p>
    </div>
    <div v-else-if="whoToFollowStore.error">
      <p class="text-error">{{ whoToFollowStore.error }}</p>
    </div>
    <template v-else>
      <div
        v-for="user in sortedUsers"
        :key="user.id"
        class="follow-row py-2"
      >
        <div
          class="follow-avatar mr-3"
        >
          <img v-if="user.photoURL" alt="User avatar" class="avatar-image" :src="user.photoURL">
          <span v-else class="avatar-initials" :style="{ backgroundColor: getRandomColor() }">{{ getInitials(user.displayName) }}</span>
        </div>
        <div class="follow-info">
          <div class="follow-name">
            {{ user.displayName }}
            <v-tooltip
              activator="parent"
              content-class="custom-tooltip"
              location="top"
            >{{ user.displayName }}</v-tooltip>
          </div>
          <div class="follow-handle">
            @{{ user.displayName?.replace(/\s/g, '') || 'user' }}
            <v-tooltip
              activator="parent"
              content-class="custom-tooltip"
              location="bottom"
            >@{{ user.displayName?.replace(/\s/g, '') || 'user' }}</v-tooltip>
          </div>
        </div>
        <v-spacer />
        <div
          class="follow-btn"
          @click="handleFollowClick(user.id, user.displayName)"
        >
          {{ isFollowing(user.id) ? 'Unfollow' : 'Follow' }}
        </div>
      </div>
    </template>
  </section>
</template>
