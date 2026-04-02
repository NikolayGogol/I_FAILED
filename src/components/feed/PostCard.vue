<script setup>
  import dayjs from 'dayjs'
  import relativeTime from 'dayjs/plugin/relativeTime'
  // =================================================================================================
  // Imports
  // =================================================================================================
  import { computed, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import AddCollectionDialog from '@/components/feed/AddCollectionDialog.vue'
  import PostMenu from '@/components/feed/PostMenu.vue'
  import { auth } from '@/firebase'
  import { getIcon } from '@/models/icons.js'
  import { noAvatar } from '@/models/no-data.js'
  import { useAuthStore } from '@/stores/auth.js'
  import { usePostCardStore } from '@/stores/post-card.js'
  import { floatNumber, formatNumber } from '@/utils/format-number.js'
  import { transformUsername } from '@/utils/transform-username.js'
  import '@/styles/components/feed/post-card.scss'

  dayjs.extend(relativeTime)

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
  const toast = useToast()

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
  const isBookmarked = ref(false)
  const bookmarkCount = ref(p.post.bookmarks || 0)
  const isBookmarking = ref(false)
  const isCollectionDialog = ref(false)
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
    if (currentUser) {
      if (p.post.likedBy?.includes(currentUser.uid)) {
        isLiked.value = true
      }
      if (p.post.bookmarkedBy?.includes(currentUser.uid)) {
        isBookmarked.value = true
      }
    }
    commentCount.value = await postCardStore.getCommentCount(p.post.id)
  })

  // =================================================================================================
  // Functions
  // =================================================================================================
  // Expand the post body to show the full content
  function readMore () {
    isExpanded.value = true
  }

  // Handle the like button click
  async function handleLike () {
    if (isOwnPost.value) {
      toast.info('You can not like own post')
      return
    }
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
    if (newIsLiked) await postCardStore.saveLikeAction(p.post)
    if (result.success && newIsLiked) {
      await postCardStore.sendLikeNotification(p.post)
    }

    // Revert UI on failure
    if (!result.success) {
      isLiked.value = originalIsLiked
      likeCount.value = originalLikeCount
      console.error('Failed to update like status:', result.error)
    }

    isLiking.value = false
  }

  // Navigate to the single post page
  function openPost () {
    router.push(`/post/${p.post.id}`)
  }

  // Navigate to the user's profile page
  function openUserProfile () {
    if (p.post.isAnonymous) return
    authStore.user?.uid === p.post.uid ? router.push('/profile') : router.push(`/user-info/${p.post.uid}`)
  }

  function timeAgo (time) {
    if (time?._seconds) {
      return dayjs.unix(time._seconds).fromNow()
    }
    if (time?.seconds) {
      return dayjs.unix(time.seconds).fromNow()
    }
    return ''
  }

  function handleShare () {
    const url = `${window.location.origin}/post/${p.post.id}`
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied to clipboard!')
    }).catch(() => {
      toast.error('Failed to copy link')
    })
  }

  function addTo () {
    if (!authStore.user) {
      router.push('/login')
      return
    }
    isCollectionDialog.value = true
  }

  function onPostSaved () {
    isBookmarked.value = true
    bookmarkCount.value += 1
    isCollectionDialog.value = false
  }
</script>

<template>
  <!-- Post card is only rendered if the post exists, is not muted, and the author is not blocked -->
  <div v-if="post && !isMuted && !isBlocked" class="post-card" :class="{'has-image': post.images[0]}">
    <!-- Post header -->
    <header class="post-header">
      <div class="post-avatar cursor-pointer" @click="openUserProfile">
        <img v-if="post.user && post.user.photoURL" alt="User avatar" :src="post.user.photoURL">
        <img v-else-if="post.isAnonymous" alt="User avatar" :src="noAvatar">
        <span v-else>{{ userInitial }}</span>
      </div>
      <div class="post-author cursor-pointer" @click="openUserProfile">
        <div class="d-flex align-center">
          <div class="post-author-name">{{ post.user.displayName }}</div>
          <p class="ml-2"> • {{ timeAgo(post.createdAt) }}</p>
        </div>
        <div class="post-author-handle">
          {{ transformUsername(post.user.userName, post.user.displayName) }}
        </div>
      </div>
      <v-spacer />
      <slot name="recovered-content" />
      <!-- Post options menu -->
      <PostMenu v-if="!isOwnPost" :post="post" />

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
      <h2 class="post-title cursor-pointer" @click="openPost">
        {{ post.title }}
      </h2>
      <div class="post-body" v-html="truncatedBody" />
      <button v-if="showReadMore" class="read-more" @click="readMore">Read more</button>
      <v-img
        v-if="post.images[0]"
        :alt="post.title"
        :aspect-ratio="16/9"
        :attr="{ crossorigin: 'anonymous' }"
        class="mb-4 rounded-xl mt-4"
        cover
        :lazy-src="post.images[0].thumb"
        :src="post.images[0].thumb"
      >
        <template #placeholder>
          <div class="d-flex align-center justify-center fill-height bg-grey-lighten-4">
            <v-progress-circular
              color="primary"
              indeterminate
            />
          </div>
        </template>
      </v-img>
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
      <button
        class="icon-btn mr-4 hover"
        :class="{ 'liked': isLiked }"
        :disabled="isLiking"
        @click.stop.prevent="handleLike"
      >
        <div class="d-flex" v-html="getIcon('heart')" />
        <span class="text-uppercase">{{ floatNumber(likeCount) }}</span>
      </button>
      <button v-if="post.allowComments" class="icon-btn mr-4">
        <div class="d-flex" v-html="getIcon('message')" />
        <span class="text-uppercase">{{ floatNumber(commentCount) }}</span>
      </button>
      <button class="icon-btn">
        <div class="d-flex" v-html="getIcon('eye')" />
        <span class="text-uppercase">{{ floatNumber(post.views) }}</span>
      </button>
      <v-spacer />
      <button
        class="icon-btn mr-4 hover"
        :class="{ 'bookmarked': isBookmarked }"
        :disabled="isBookmarking"
        @click.stop.prevent="addTo"
      >
        <span class="mr-2 text-uppercase">{{ floatNumber(bookmarkCount) }}</span>
        <div class="d-flex" v-html="getIcon('bookmark')" />
      </button>
      <button class="icon-btn hover" @click.stop="handleShare">
        <div class="d-flex" v-html="getIcon('share')" />
      </button>
    </footer>
    <v-dialog
      v-model="isCollectionDialog"
      class="collection-dialog"
      max-width="520"
    >
      <AddCollectionDialog
        :post="post"
        @cancel="isCollectionDialog = false"
        @post-saved="onPostSaved"
      />
    </v-dialog>
  </div>
</template>
