<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { auth } from '@/firebase'
  import { usePostCardStore } from '@/stores/post-card.js'
  import '@/styles/components/feed/post-card.scss'

  const p = defineProps({
    post: {
      type: Object,
      required: true,
    },
  })

  const postCardStore = usePostCardStore()
  const router = useRouter()
  const isExpanded = ref(false)
  const maxLength = 200

  const isLiked = ref(false)
  const likeCount = ref(p.post.likes || 0)
  const isLiking = ref(false) // To disable the button during the request
  const commentCount = ref(0)

  const userInitial = computed(() => {
    return p.post.user?.displayName?.charAt(0).toUpperCase() || ''
  })

  onMounted(async () => {
    const currentUser = auth.currentUser
    if (currentUser && p.post.likedBy?.includes(currentUser.uid)) {
      isLiked.value = true
    }
    commentCount.value = await postCardStore.getCommentCount(p.post.id)
  })

  const truncatedBody = computed(() => {
    const description = p.post.stepTwo.description
    if (isExpanded.value || description.length <= maxLength) {
      return description
    }
    return description.slice(0, Math.max(0, maxLength)) + '...'
  })

  const showReadMore = computed(() => {
    return !isExpanded.value && p.post.stepTwo.description.length > maxLength
  })

  function readMore () {
    isExpanded.value = true
  }

  async function handleLike () {
    if (isLiking.value) return // Prevent multiple clicks
    isLiking.value = true

    const originalIsLiked = isLiked.value
    const originalLikeCount = likeCount.value
    const newIsLiked = !isLiked.value

    // Optimistic UI update
    isLiked.value = newIsLiked
    likeCount.value += newIsLiked ? 1 : -1

    const result = await postCardStore.toggleLike({
      postId: p.post.id,
      liked: newIsLiked,
    })

    if (!result.success) {
      // Revert UI on failure
      isLiked.value = originalIsLiked
      likeCount.value = originalLikeCount
      console.error('Failed to update like status:', result.error)
      // Optionally, show a notification to the user
    }

    isLiking.value = false
  }

  function openPost () {
    router.push(`/post/${p.post.id}`)
  }
</script>

<template>
  <div v-if="post" class="post-card">
    <header class="post-header" @click="openPost">
      <div class="post-avatar">
        <img v-if="post.user.photoURL" alt="User avatar" :src="post.user.photoURL">
        <span v-else>{{ userInitial }}</span>
      </div>
      <div class="post-author">
        <div class="post-author-name">{{ post.user.displayName }}</div>
        <div class="post-author-handle">@{{ post.user.displayName.replace(/\s/g, '') }}</div>
      </div>
      <v-spacer />
      <v-btn icon size="small" variant="text">
        <v-icon>mdi-dots-horizontal</v-icon>
      </v-btn>
    </header>

    <div class="post-tags">
     <span>{{ post.stepOne.selectedCategories.map(el => el.label).join(' / ') }}</span>
    </div>

    <h2 class="post-title">
      {{ post.stepTwo.title }}
    </h2>

    <p class="post-body" v-html="truncatedBody" />
    <button v-if="showReadMore" class="read-more" @click="readMore">Read more</button>

    <div class="post-chips">
      <span
        v-for="chip in post.stepFour.emotionTags"
        :key="chip"
        class="post-chip"
      >
        {{ chip.emoji }}
        {{ chip.label }}
      </span>
    </div>

    <div class="post-meta">
      <div class="meta-item">
        <span class="meta-label">💰    Cost:</span>
        <span>$ {{ post.stepFour.cost }}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">⏱️   Recovery:</span>
        <span>{{ post.stepFour?.recoveryTime?.title }}</span>
      </div>
    </div>

    <footer class="post-footer">
      <button class="icon-btn" :class="{ 'liked': isLiked }" :disabled="isLiking" @click.stop.prevent="handleLike">
        <v-icon size="18">{{ isLiked ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
        <span>{{ likeCount }}</span>
      </button>
      <button class="icon-btn">
        <v-icon size="18">mdi-comment-outline</v-icon>
        <span>{{ commentCount }}</span>
      </button>
      <button class="icon-btn">
        <v-icon size="18">mdi-eye-outline</v-icon>
        <span>{{ post.views }}</span>
      </button>
      <v-spacer />
      <button class="icon-btn">
        <v-icon size="18">mdi-bookmark-outline</v-icon>
      </button>
      <button class="icon-btn">
        <v-icon size="18">mdi-share-variant</v-icon>
      </button>
    </footer>
  </div>
</template>
