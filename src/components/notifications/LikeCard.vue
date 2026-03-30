<script setup>
  import dayjs from 'dayjs'
  import { onMounted, reactive } from 'vue'
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
      case 'postLike': {
        getPostCard(props.data)
        break
      }
      case 'commentLike': {
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
    console.log(data)
    console.log('Fetching user with UID:', data.uid)
    userStore.getUserById(data.uid).then(user => {
      console.log('User object received:', user)
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
    if (time?.seconds) {
      return dayjs.unix(time.seconds).fromNow()
    }
    return ''
  }
  function transformText (text) {
    switch (text) {
      case 'postLike': {
        return 'Liked your post'
      }
      case 'commentLike': {
        return 'Liked your comment'
      }
      case 'replyLike': {
        return 'Liked your reply'
      }
      default: {
        return ''
      }
    }
  }
</script>

<template>
  <div class="card-notify" :class="{'need2Read': !data.isRead}">
    <div class="d-flex">
      <div class="d-flex align-start user-avatar-wrapper">
        <div class="position-relative">
          <v-img
            :alt="cardData.user?.displayName"
            class="user-avatar"
            cover
            :src="cardData.user?.photoURL"
          />
          <div class="bg-icon like-icon">
            <v-icon icon="mdi-heart-circle-outline" />
          </div>
        </div>
        <div class="d-flex flex-column ml-3">
          <div class="d-flex">
            <span class="user-name">{{ cardData.user?.displayName }}</span>
            <span class="time"> • {{ timeAgo(cardData.createdAt) }}</span>
          </div>
          <p class="text-description">{{ transformText(data.likeType) }}</p>
          <p class="text-main" v-html="cardData.description" />
        </div>
      </div>
    </div>
  </div>
</template>
