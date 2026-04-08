<script setup>
  import dayjs from 'dayjs'
  import { onMounted, reactive } from 'vue'
  import ProfileInfo from '@/components/notifications/ProfileInfo.vue'
  import { backgroundColors } from '@/models/no-data.js'
  import { useAuthStore } from '@/stores/auth.js'
  import { useUserStore } from '@/stores/user.js'
  import { useWhoToFollowStore } from '@/stores/who-to-follow.js'
  import {timeTransformAgo} from "@/utils/time.js";
  const authStore = useAuthStore()
  const whoToFollowStore = useWhoToFollowStore()
  //
  const props = defineProps({
    data: {
      type: Object,
      required: true,
    },
  })
  const cardData = reactive({
    user: null,
    createdAt: null,
    description: '',
  })
  const userStore = useUserStore()
  //
  onMounted(() => {
    getFollowCard(props.data)
  })
  function getFollowCard (data) {
    userStore.getUserById(data.followerId).then(user => {
      cardData.user = user
    })
    cardData.createdAt = data.createdAt
  }

  function getInitials (name) {
    if (!name) return ''
    const parts = name.split(' ')
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase()
    }
    return (parts[0].charAt(0) + (parts[1]?.charAt(0) || '')).toUpperCase()
  }
  function getRandomColor () {
    const randomIndex = Math.floor(Math.random() * backgroundColors.length)
    return backgroundColors[randomIndex]
  }
  function isFollowing (userId) {
    if (!authStore.user || !authStore.user.following) return false
    return authStore.user.following.includes(userId)
  }
  function handleFollowClick () {
    const userId = props.data.followerId
    if (isFollowing(userId)) {
      whoToFollowStore.unfollowUser(userId)
    } else {
      whoToFollowStore.followUser(userId)
    }
  }
</script>

<template>
  <div class="card-notify" :class="{'need2Read': !data.isRead}">
    <div class="d-flex align-start user-avatar-wrapper">
      <div class="position-relative popup-hover">
        <v-img
          v-if="cardData.user?.photoURL"
          :alt="cardData.user?.displayName"
          class="user-avatar"
          cover
          :src="cardData.user?.photoURL"
        />
        <span
          v-else
          class="avatar-initials"
          :style="{ backgroundColor: getRandomColor() }"
        >{{ getInitials(cardData.user?.displayName) }}</span>
        <div class="bg-icon follow-icon">
          <template v-if="!isFollowing(data.followerId)">
            <v-icon icon="mdi-plus-circle-outline" />
          </template>
          <template v-else>
            <v-icon icon="mdi-minus-circle-outline" />
          </template>
        </div>
        <ProfileInfo :data="cardData" :follower-id="data.followerId" />
      </div>
      <div class="d-flex flex-column ml-3 w-100">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex">
            <span class="user-name cursor-pointer">{{ cardData.user?.displayName }}</span>
            <span class="time"> • {{ timeTransformAgo(cardData.createdAt) }}</span>
          </div>
          <NotifyMenu :data="data" />
        </div>
        <p class="text-description">Started following you</p>
        <div class="d-flex justify-start mt-3">
          <div class="submit-btn" @click="handleFollowClick">{{ isFollowing(props.data.followerId) ? 'Unfollow' : 'Follow back' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

</style>
