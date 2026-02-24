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
          <img v-if="user.photoURL" :src="user.photoURL" alt="User avatar" class="avatar-image">
          <span v-else :style="{ backgroundColor: getRandomColor() }" class="avatar-initials">{{ getInitials(user.displayName) }}</span>
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
        >
          Follow
        </div>
      </div>
    </template>
  </section>
</template>

<script setup>
  import { computed, onMounted } from 'vue'
  import { useWhoToFollowStore } from '@/stores/who-to-follow'
  import { useAuthStore } from '@/stores/auth'
  import '@/styles/components/sidebars/who-to-follow.scss'

  const whoToFollowStore = useWhoToFollowStore()
  const authStore = useAuthStore()

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

    // Shuffle both lists independently
    const shuffledWithAvatars = usersWithAvatars.sort(() => 0.5 - Math.random())
    const shuffledWithoutAvatars = usersWithoutAvatars.sort(() => 0.5 - Math.random())

    // Combine and take the first 5
    return [...shuffledWithAvatars, ...shuffledWithoutAvatars].slice(0, 5)
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
</script>
