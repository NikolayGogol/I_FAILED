<script setup>
  import dayjs from 'dayjs'
  import { onMounted, reactive } from 'vue'
  import NotifyMenu from '@/components/notifications/NotifyMenu.vue'
  import ProfileInfo from '@/components/notifications/ProfileInfo.vue'
  import { backgroundColors } from '@/models/no-data.js'
  import { useSinglePostStore } from '@/stores/single-post/single-post.js'
  import { useUserStore } from '@/stores/user.js'

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
  const singlePostStore = useSinglePostStore()
  const userStore = useUserStore()

  onMounted(() => {
    switch (props.data.likeType) {
      case 'postLike':
      case 'likePost': {
        getPostCard(props.data)
        break
      }
      case 'likeComment':
      case 'commentLike': {
        getCommentCard(props.data)
        break
      }
      case 'likeReply':
      case 'replyLike': {
        getCommentCard(props.data)
        break
      }
    }
  })

  function getPostCard (data) {
    userStore.getUserById(data.uid).then(user => {
      cardData.user = user
    })
    cardData.createdAt = data.createdAt
    singlePostStore.getPostById(data.postId)
      .then(res => {
        cardData.description = res.whatHappened
      })
  }

  function getCommentCard (data) {
    userStore.getUserById(data.uid).then(user => {
      cardData.user = user
    })
    cardData.createdAt = data.createdAt
    singlePostStore.getComments(data.postId)
      .then(comments => {
        const comment = comments.find(c => c.id === data.commentId)
        if (comment) {
          cardData.description = comment.text
        }
      })
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

  function transformText (text) {
    switch (text) {
      case 'postLike': {
        return 'Liked your post'
      }
      case 'likeComment':
      case 'commentLike': {
        return 'Liked your comment'
      }
      case 'likeReply':
      case 'replyLike': {
        return 'Liked your reply'
      }
      default: {
        return ''
      }
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
</script>

<template>
  <div class="card-notify" :class="{'need2Read': !data.isRead}">
    <div class="d-flex align-start user-avatar-wrapper w-100">
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
        <div class="bg-icon like-icon">
          <template v-if="data.likeType === 'replyLike' || data.likeType === 'likeReply'">
            <v-icon icon="mdi-share-circle" />
          </template>
          <template v-else>
            <v-icon icon="mdi-heart-circle-outline" />
          </template>
        </div>
        <ProfileInfo :data="cardData" :follower-id="data.uid" />

      </div>
      <div class="d-flex flex-column ml-3 w-100">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex">
            <span class="user-name cursor-pointer">{{ cardData.user?.displayName }}</span>
            <span class="time"> • {{ timeAgo(cardData.createdAt) }}</span>
          </div>
          <NotifyMenu :data="data" />
        </div>
        <p class="text-description">{{ transformText(data.likeType) }}</p>
        <p class="text-main" v-html="cardData.description" />
      </div>
    </div>
  </div>
</template>
