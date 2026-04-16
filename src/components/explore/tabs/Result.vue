<script setup>
  import { storeToRefs } from 'pinia'
  import { VProgressLinear } from 'vuetify/components'
  import { backgroundColors } from '@/models/no-data.js'
  import { useAuthStore } from '@/stores/auth.js'
  import { useResultsStore } from '@/stores/explore/results.js'
  import { useWhoToFollowStore } from '@/stores/who-to-follow.js'
  import { transformUsername } from '@/utils/transform-username.js'

  const store = useResultsStore()
  const authStore = useAuthStore()
  const whoToFollowStore = useWhoToFollowStore()
  //
  const { posts, users, isLoading } = storeToRefs(store)
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
  function handleFollowClick (uid) {
    const userId = uid
    if (isFollowing(userId)) {
      whoToFollowStore.unfollowUser(userId)
    } else {
      whoToFollowStore.followUser(userId)
    }
  }
</script>

<template>
  <div class="tab tab-result">
    <div class="d-flex align-center justify-space-between">
      <h3 class="font-weight-semibold">Result</h3>
      <p class="text-description">{{ posts.length + users.length }} results found</p>
    </div>
    <v-progress-linear
      v-if="isLoading"
      class="my-4"
      color="primary"
      indeterminate
    />
    <template v-else>
      <div v-if="users.length > 0" class="posts-container">
        <div v-for="user in users" :key="user.id" class="post">
          <div class="d-flex align-center">
            <div class="d-block ml-6 w-100">
              <div class="d-flex">
                <v-img
                  v-if="user?.photoURL"
                  :alt="user?.displayName"
                  class="user-avatar"
                  cover
                  :src="user?.photoURL"
                />
                <div v-else class="avatar" :style="{ backgroundColor: getRandomColor() }">
                  {{ getInitials(user.displayName) }}
                </div>
                <div class="user-info ml-4 w-100">
                  <div class="d-flex align-center justify-space-between w-100">
                    <div class="d-block">
                      <p class="title mt-0">{{ user.displayName }}</p>
                      <p class="text-description">{{ transformUsername(user.userName, user.displayName) }}</p>
                    </div>
                    <div class="follow cancel-btn" @click="handleFollowClick(user.id)">
                      {{ isFollowing(user.id) ? 'Unfollow' : 'Follow' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="posts.length > 0">
        <post-card v-for="item in posts" :key="item.id" :post="item" />
      </div>
      <div v-if="users.length === 0 && posts.length === 0" class="d-flex justify-center my-10">Nothing to show</div>
    </template>
  </div>

</template>
