<script setup>
  // =================================================================================================
  // Imports
  // =================================================================================================
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import { useAuthStore } from '@/stores/auth'
  import { useWhoToFollowStore } from '@/stores/who-to-follow'
  import '@/styles/components/sidebars/who-to-follow.scss'

  // =================================================================================================
  // Stores & Hooks
  // =================================================================================================
  const whoToFollowStore = useWhoToFollowStore()
  const authStore = useAuthStore()
  const toast = useToast()
  const router = useRouter()

  // =================================================================================================
  // Local State
  // =================================================================================================
  const displayLimit = ref(4)

  // =================================================================================================
  // Lifecycle Hooks
  // =================================================================================================
  // Fetch all users when the component is mounted
  onMounted(() => {
    whoToFollowStore.fetchAllUsers()
  })

  // =================================================================================================
  // Computed Properties
  // =================================================================================================
  // Filter users to exclude the current user and any blocked users
  const filteredUsers = computed(() => {
    if (!authStore.user) {
      return whoToFollowStore.users
    }
    const blockedUserIds = authStore.user.blockedUsers || []
    return whoToFollowStore.users.filter(user => {
      return user.id !== authStore.user.uid && !blockedUserIds.includes(user.id)
    })
  })

  // Sort users by post count in descending order
  const allSortedUsers = computed(() => {
    return [...filteredUsers.value]
      .toSorted((a, b) => (b.postCount || 0) - (a.postCount || 0))
  })

  // Take users up to the display limit
  const visibleUsers = computed(() => {
    return allSortedUsers.value.slice(0, displayLimit.value)
  })

  const hasMoreUsers = computed(() => {
    return allSortedUsers.value.length > displayLimit.value
  })

  // =================================================================================================
  // Mock Data
  // =================================================================================================
  // Background colors for user avatars
  const backgroundColors = [
    '#ffcdd2', '#f8bbd0', '#e1bee7', '#d1c4e9', '#c5cae9',
    '#bbdefb', '#b3e5fc', '#b2ebf2', '#b2dfdb', '#c8e6c9',
    '#dcedc8', '#f0f4c3', '#fff9c4', '#ffecb3', '#ffe0b2',
    '#ffccbc', '#d7ccc8', '#cfd8dc',
  ]

  // =================================================================================================
  // Functions
  // =================================================================================================
  // Get a random background color for the avatar
  function getRandomColor () {
    const randomIndex = Math.floor(Math.random() * backgroundColors.length)
    return backgroundColors[randomIndex]
  }

  // Get the initials from a user's name
  function getInitials (name) {
    if (!name) return ''
    const parts = name.split(' ')
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase()
    }
    return (parts[0].charAt(0) + (parts[1]?.charAt(0) || '')).toUpperCase()
  }

  // Check if the current user is following a specific user
  function isFollowing (userId) {
    if (!authStore.user || !authStore.user.following) return false
    return authStore.user.following.includes(userId)
  }

  // Handle the follow/unfollow button click
  async function handleFollowClick (userId, userName) {
    if (!authStore.user) {
      router.push('/login')
      return
    }

    // Check if the user is following
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

  // Navigate to a user's profile page
  function openUserProfile (user) {
    router.push(`/user-info/${user.id}`)
  }

  function showMoreUsers () {
    displayLimit.value += 5
  }
</script>
<template>
  <section class="right-card follow-card">
    <header class="right-card-header">
      <h3 class="font-weight-semibold">Who to follow</h3>
    </header>
    <!-- Loading state -->
    <div v-if="whoToFollowStore.loading">
      <!-- You can add a loading skeleton here -->
      <p>Loading...</p>
    </div>
    <!-- Error state -->
    <div v-else-if="whoToFollowStore.error">
      <p class="text-error">{{ whoToFollowStore.error }}</p>
    </div>
    <!-- User list -->
    <template v-else>
      <div
        v-for="user in visibleUsers"
        :key="user.id"
        class="follow-row py-2"
      >
        <div
          class="follow-avatar cursor-pointer mr-3"
          @click="openUserProfile(user)"
        >
          <!-- User avatar image -->
          <img v-if="user.photoURL" alt="User avatar" class="avatar-image" :src="user.photoURL">
          <!-- User initials fallback -->
          <span
            v-else
            class="avatar-initials"
            :style="{ backgroundColor: getRandomColor() }"
          >{{ getInitials(user.displayName) }}</span>
        </div>
        <div class="follow-info cursor-pointer" @click="openUserProfile(user)">
          <!-- User display name -->
          <div class="follow-name">
            {{ user.displayName }}
            <v-tooltip
              activator="parent"
              content-class="custom-tooltip"
              location="top"
            >{{ user.displayName }}
            </v-tooltip>
          </div>
          <!-- User handle -->
          <div class="follow-handle">
            @{{ user.displayName?.replaceAll(' ', '_') || 'user' }}
            <v-tooltip
              activator="parent"
              content-class="custom-tooltip"
              location="bottom"
            >@{{ user.displayName?.replaceAll(' ', '_') || 'user' }}
            </v-tooltip>
          </div>
        </div>
        <v-spacer />
        <!-- Follow/Unfollow button -->
        <div
          class="follow-btn"
          @click="handleFollowClick(user.id, user.displayName)"
        >
          {{ isFollowing(user.id) ? 'Unfollow' : 'Follow' }}
        </div>
      </div>

      <!-- Show More Button -->
      <div v-if="hasMoreUsers" class="mt-2">
        <div
          class="text-decoration-underline px-0 font-weight-semibold cursor-pointer"
          style="font-size: 14px;"
          @click="showMoreUsers"
        >
          Show more
        </div>
      </div></template>
  </section>
</template>
