<script setup>
  import dayjs from 'dayjs'
  import { onMounted, reactive } from 'vue'
  import { useRouter } from 'vue-router'
  import { backgroundColors } from '@/models/no-data.js'
  import { useAuthStore } from '@/stores/auth.js'
  import { useUserStore } from '@/stores/user.js'
  import { useWhoToFollowStore } from '@/stores/who-to-follow.js'
  const authStore = useAuthStore()
  const whoToFollowStore = useWhoToFollowStore()
  const router = useRouter()
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
  function timeAgo (time) {
    if (window.innerWidth > 768) {
      if (time?.seconds) {
        return dayjs.unix(time.seconds).fromNow()
      }
      return ''
    } else {
      if (!time?.seconds) {
        return ''
      }
      const date = dayjs.unix(time.seconds)
      const now = dayjs()
      const diffYears = now.diff(date, 'year')
      if (diffYears > 0) {
        return `${diffYears}y ago`
      }
      const diffMonths = now.diff(date, 'month')
      if (diffMonths > 0) {
        return `${diffMonths}M ago`
      }
      const diffDays = now.diff(date, 'day')
      if (diffDays > 0) {
        return `${diffDays}d ago`
      }
      const diffHours = now.diff(date, 'hour')
      if (diffHours > 0) {
        return `${diffHours}h ago`
      }
      const diffMinutes = now.diff(date, 'minute')
      if (diffMinutes > 0) {
        return `${diffMinutes}m ago`
      }
      const diffSeconds = now.diff(date, 'second')
      if (diffSeconds > 0) {
        return `${diffSeconds}s ago`
      }
      return 'just now'
    }
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
  function goToProfile (user) {
    router.push('/user-info/' + user.id)
  }
</script>

<template>
  <div class="card-notify" :class="{'need2Read': !data.isRead}">
    <div class="d-flex align-start user-avatar-wrapper">
      <div class="position-relative">
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
          <template v-if="isFollowing(data.followerId)">
            <v-icon icon="mdi-plus-circle-outline" />
          </template>
          <template v-else>
            <v-icon icon="mdi-minus-circle-outline" />
          </template>
        </div>
      </div>
      <div class="d-flex flex-column ml-3 w-100">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex">
            <span class="user-name cursor-pointer" @click="goToProfile(cardData.user)">{{ cardData.user?.displayName }}</span>
            <span class="time"> • {{ timeAgo(cardData.createdAt) }}</span>
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
