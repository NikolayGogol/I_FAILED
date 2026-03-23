<script setup>
// =================================================================================================
// Imports
// =================================================================================================
import {computed, onMounted, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import PostMenu from '@/components/feed/PostMenu.vue'
import {auth} from '@/firebase'
import {useAuthStore} from '@/stores/auth.js'
import {usePostCardStore} from '@/stores/post-card.js'
import {formatNumber} from '@/utils/format-number.js'
import '@/styles/components/feed/post-card.scss'

// =================================================================================================
// Props
// =================================================================================================
const p = defineProps({
  post: {
    type: Object,
    required: true,
  },
})

// =================================================================================================
// Stores & Hooks
// =================================================================================================
const postCardStore = usePostCardStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// =================================================================================================
// State
// =================================================================================================
const isExpanded = ref(false)
const maxLength = 100
const isLiked = ref(false)
const likeCount = ref(p.post.likes || 0)
const isLiking = ref(false) // To disable the button during the request
const commentCount = ref(0)
const showSensitiveContent = ref(false)

// =================================================================================================
// Computed Properties
// =================================================================================================
// Get the first initial of the user's display name
const userInitial = computed(() => {
  return p.post.user?.displayName?.charAt(0).toUpperCase() || ''
})

// Check if the post is owned by the current user
const isOwnPost = computed(() => {
  if (!authStore.user) return false
  return authStore.user.uid === p.post.uid
})

// Check if the post's author is blocked by the current user
const isBlocked = computed(() => {
  if (!authStore.user || !authStore.user.blockedUsers) return false
  return authStore.user.blockedUsers.includes(p.post.uid)
})

// Check if the post is muted by the current user
const isMuted = computed(() => {
  if (route.name.includes('user-info')) return false
  if (!authStore.user || !authStore.user.mutedPosts) return false
  return authStore.user.mutedPosts.includes(p.post.id)
})

// Get the truncated body of the post
const truncatedBody = computed(() => {
  const description = p.post.whatHappened
  if (isExpanded.value || description.length <= maxLength) {
    return description
  }
  return description.slice(0, Math.max(0, maxLength)) + '...'
})

// Check if the "Read more" button should be shown
const showReadMore = computed(() => {
  return !isExpanded.value && p.post.whatHappened.length > maxLength
})

// =================================================================================================
// Lifecycle Hooks
// =================================================================================================
onMounted(async () => {
  const currentUser = auth.currentUser
  if (currentUser && p.post.likedBy?.includes(currentUser.uid)) {
    isLiked.value = true
  }
  commentCount.value = await postCardStore.getCommentCount(p.post.id)
})

// =================================================================================================
// Functions
// =================================================================================================
// Expand the post body to show the full content
function readMore() {
  isExpanded.value = true
}

// Handle the like button click
async function handleLike() {
  if (!authStore.user) {
    await router.push('/login')
    return
  }
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

  // Revert UI on failure
  if (!result.success) {
    isLiked.value = originalIsLiked
    likeCount.value = originalLikeCount
    console.error('Failed to update like status:', result.error)
  }

  isLiking.value = false
}

// Navigate to the single post page
function openPost() {
  router.push(`/post/${p.post.id}`)
}

// Navigate to the user's profile page
function openUserProfile() {
  if (p.post.isAnonymous) return
  authStore.user?.uid === p.post.uid ? router.push('/profile') : router.push(`/user-info/${p.post.uid}`)
}
</script>

<template>
  <!-- Post card is only rendered if the post exists, is not muted, and the author is not blocked -->
  <div v-if="post && !isMuted && !isBlocked" class="post-card">
    <!-- Post header -->
    <header class="post-header">
      <div class="post-avatar cursor-pointer" @click="openUserProfile">
        <img v-if="post.user.photoURL" alt="User avatar" :src="post.user.photoURL">
        <span v-else>{{ userInitial }}</span>
      </div>
      <div class="post-author cursor-pointer" @click="openUserProfile">
        <div class="post-author-name">{{ post.user.displayName }}</div>
        <div class="post-author-handle">@{{ post.user.displayName.replaceAll(' ', '_') }}</div>
      </div>
      <v-spacer/>
      <slot name="recovered-content"/>
      <!-- Post options menu -->
      <PostMenu v-if="!isOwnPost" :post="post"/>

    </header>
    <!-- Sensitive content warning -->
    <div v-if="post.enableTriggerWarning && !showSensitiveContent" class="sensitive-content">
      <div class="content">
        <p>
          ⚠️This post contains triggers: <span class="text-capitalize">{{
            post.triggerTags?.join(',')
          }}</span>
        </p>
        <div class="submit-btn mt-2" @click="showSensitiveContent = true">Show post</div>
      </div>
    </div>
    <!-- Post content -->
    <template v-else>
      <div v-if="post.selectedCategories?.length > 0" class="post-tags cursor-pointer " @click="openPost">
        <span>{{ post.selectedCategories.map(el => el.label).join(' / ') }}</span>
      </div>
      <h2 class="post-title cursor-pointer hover-text-underline" @click="openPost">
        {{ post.title }}
      </h2>
      <p class="post-body cursor-pointer hover-text-underline" @click="openPost" v-html="truncatedBody"/>
      <button v-if="showReadMore" class="read-more" @click="readMore">Read more</button>
      <div v-if="post.emotionTags" class="post-chips">
        <span
          v-for="chip in post.emotionTags"
          :key="chip"
          class="post-chip"
        >
          {{ chip.emoji }}
          {{ chip.label }}
        </span>
      </div>
      <div v-if="post?.lessonLearned?.recoveryTime || post?.lessonLearned?.cost" class="post-meta">
        <div v-if="post.lessonLearned.cost" class="meta-item">
          <span class="meta-label">💰    Cost:</span>
          <span>{{ formatNumber(post.lessonLearned.cost) }}</span>
        </div>
        <div v-if="post.lessonLearned.recoveryTime" class="meta-item">
          <span class="meta-label">⏱️   Recovery:</span>
          <span>{{ post.lessonLearned.recoveryTime?.title }}</span>
        </div>
      </div>
    </template>
    <!-- Post footer with actions -->
    <footer class="post-footer">
      <button class="icon-btn mr-4" :class="{ 'liked': isLiked }" :disabled="isLiking" @click.stop.prevent="handleLike">
        <v-icon size="18">{{ isLiked ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
        <span>{{ likeCount }}</span>
      </button>
      <button v-if="post.allowComments" class="icon-btn mr-4">
        <v-icon size="18">mdi-comment-outline</v-icon>
        <span>{{ commentCount }}</span>
      </button>
      <button class="icon-btn">
        <v-icon size="18">mdi-eye-outline</v-icon>
        <span>{{ post.views }}</span>
      </button>
      <v-spacer/>
      <button class="icon-btn mr-4">
        <v-icon size="18">mdi-bookmark-outline</v-icon>
      </button>
      <button class="icon-btn">
        <v-icon size="18">mdi-share-variant</v-icon>
      </button>
    </footer>
  </div>
</template>
<style scoped lang="scss">
.hover-text-underline {
  &:hover {
    text-decoration: underline;
  }
}
</style>
