<script setup>
  import dayjs from 'dayjs'
  import { useRouter } from 'vue-router'
  import { getIcon } from '@/models/icons.js'
  import { backgroundColors } from '@/models/no-data.js'
  import { useAuthStore } from '@/stores/auth.js'
  import { useWhoToFollowStore } from '@/stores/who-to-follow.js'
  //
  const props = defineProps({
    data: {
      type: Object,
      required: true,
    },
    followerId: {
      type: String,
      required: true,
    },
  })
  const authStore = useAuthStore()
  const whoToFollowStore = useWhoToFollowStore()
  const router = useRouter()
  //
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
    const userId = props.followerId
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
  <div class="drop-modal">
    <div class="d-flex flex-column">
      <div class="d-flex">
        <div class="d-block mr-3" @click="goToProfile(data.user)">
          <v-img
            v-if="data.user?.photoURL"
            :alt="data.user?.displayName"
            class="user-avatar"
            cover
            :src="data.user?.photoURL"
          />
          <span
            v-else
            class="avatar-initials"
            :style="{ backgroundColor: getRandomColor() }"
          >{{ getInitials(data.user?.displayName) }}</span>
        </div>
        <div class="d-block">
          <span class="user-name cursor-pointer" @click="goToProfile(data.user)">{{ data.user?.displayName }}</span>
          <p class="text-description">@{{ data.user?.displayName?.replaceAll(' ', '_') }}</p>
        </div>
        <div class="d-block ml-6">
          <div class="submit-btn text-no-wrap" @click="handleFollowClick">{{ isFollowing(followerId) ? 'Unfollow' : 'Follow back' }}</div>
        </div>
      </div>

      <p class="bio">{{ data?.user?.bio || 'Entrepreneur learning from startup failures. Sharing my journey to help others.' }}</p>
      <div class="d-flex align-center">
        <div class="d-flex mr-1 fill-grey" v-html="getIcon('calendar', 20, 20)" />
        <p class="join-date">Joined {{ dayjs.unix(data?.user?.createdAt?.seconds).format('MMMM YYYY') }}</p>
      </div>
      <div class="d-flex mt-3">
        <p class="follow-block">
          <b>
            {{ data?.user?.followers?.length || 0 }}
          </b>
          <span>followers</span>
        </p>
        <p class="follow-block ml-5">
          <b>{{ data?.user?.following?.length || 0 }}</b>
          <span>following</span>
        </p>
      </div>
    </div>
  </div>
</template>
