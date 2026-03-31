<script setup>
  import dayjs from 'dayjs'
  import { onMounted, reactive } from 'vue'
  import { useRouter } from 'vue-router'
  import NotifyMenu from '@/components/notifications/NotifyMenu.vue'
  import ProfileInfo from '@/components/notifications/ProfileInfo.vue'
  import { backgroundColors } from '@/models/no-data.js'
  import { useUserStore } from '@/stores/user.js'
  //
  const userStore = useUserStore()
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
  onMounted(() => {
    getMentionCard(props.data)
  })
  //
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
  function parseUserTags (text, commentID, postID) {
    const regex = /@\[([^\]]+)\]\(([^)]+)\)/g

    return text.replace(regex, (match, name, id) => {
      return `<a href="/post/${postID}#${commentID}" uid="${id}" class="text-primary font-weight-semibold">@ ${name}</a>`
    })
  }
  function getMentionCard (data) {
    userStore.getUserById(data.mentionerUid).then(user => {
      cardData.user = user
    })
    cardData.createdAt = data.createdAt
    cardData.description = parseUserTags(data.commentText, data.commentId, data.postId)
  }
  function goToProfile (user) {
    router.push('/user-info/' + user.id)
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
        <div class="bg-icon mention-icon">
          <v-icon icon="mdi-at" />
        </div>
        <ProfileInfo :data="cardData" :follower-id="data.mentionerUid" />

      </div>
      <div class="d-flex flex-column ml-3 w-100">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex">
            <span class="user-name cursor-pointer" @click="goToProfile(cardData.user)">{{ cardData.user?.displayName }}</span>
            <span class="time"> • {{ timeAgo(cardData.createdAt) }}</span>
          </div>
          <NotifyMenu :data="data" />
        </div>
        <p class="text-description">Mentioned you</p>
        <div class="text-main" v-html="cardData.description" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

</style>
