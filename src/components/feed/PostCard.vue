<script setup>
  // =================================================================================================
  // Imports
  // =================================================================================================
  import { computed, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import { auth } from '@/firebase'
  import { useAuthStore } from '@/stores/auth.js'
  import { useFeedStore } from '@/stores/feed.js'
  import { usePostCardStore } from '@/stores/post-card.js'
  import { useWhoToFollowStore } from '@/stores/who-to-follow.js'
  import { formatNumber } from '@/utils/format-number.js'
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
  const whoToFollowStore = useWhoToFollowStore()
  const feedStore = useFeedStore()
  const router = useRouter()
  const route = useRoute()
  const toast = useToast()

  // =================================================================================================
  // State
  // =================================================================================================
  const isExpanded = ref(false)
  const maxLength = 200
  const isLiked = ref(false)
  const likeCount = ref(p.post.likes || 0)
  const isLiking = ref(false) // To disable the button during the request
  const commentCount = ref(0)
  const showBlockDialog = ref(false)
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

  // Check if the current user is following the post's author
  const isFollowing = computed(() => {
    if (!authStore.user || !authStore.user.following) return false
    return authStore.user.following.includes(p.post.uid)
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
    const description = p.post.stepTwo.description
    if (isExpanded.value || description.length <= maxLength) {
      return description
    }
    return description.slice(0, Math.max(0, maxLength)) + '...'
  })

  // Check if the "Read more" button should be shown
  const showReadMore = computed(() => {
    return !isExpanded.value && p.post.stepTwo.description.length > maxLength
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
  function readMore () {
    isExpanded.value = true
  }

  // Handle the like button click
  async function handleLike () {
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
  function openPost () {
    router.push(`/post/${p.post.id}`)
  }

  // Navigate to the user's profile page
  function openUserProfile () {
    if (p.post.stepFive?.isAnonymous) return
    authStore.user?.uid === p.post.uid ? router.push('/profile') : router.push(`/user-info/${p.post.uid}`)
  }

  // Handle the follow button click
  async function handleFollow () {
    if (!authStore.user) {
      await router.push('/login')
      return
    }
    const userId = p.post.uid
    const userName = p.post.user.displayName

    if (isFollowing.value) {
      const success = await whoToFollowStore.unfollowUser(userId)
      if (success) {
        toast.info(`Unfollowed ${userName}`)
      } else {
        toast.error(`Failed to unfollow ${userName}`)
      }
    } else {
      const success = await whoToFollowStore.followUser(userId)
      if (success) {
        toast.info(`Following ${userName}`)
      } else {
        toast.error(`Failed to follow ${userName}`)
      }
    }
  }

  // Show the block user confirmation dialog
  function handleBlock () {
    showBlockDialog.value = true
  }

  // Confirm blocking the user
  async function confirmBlock () {
    if (!authStore.user) {
      await router.push('/login')
      return
    }
    const userId = p.post.uid
    const userName = p.post.user.displayName

    const success = await whoToFollowStore.blockUser(userId)
    if (success) {
      toast.info('User blocked, and you will no longer see their posts')
    } else {
      toast.error(`Failed to block ${userName}`)
    }
    showBlockDialog.value = false
  }

  // Handle the unblock button click
  async function handleUnblock () {
    if (!authStore.user) {
      await router.push('/login')
      return
    }
    const userId = p.post.uid
    const userName = p.post.user.displayName

    const success = await whoToFollowStore.unblockUser(userId)
    if (success) {
      toast.info(`Unblocked ${userName}`)
    } else {
      toast.error(`Failed to unblock ${userName}`)
    }
  }

  // Mute the post
  async function handleMutePost () {
    if (!authStore.user) {
      await router.push('/login')
      return
    }
    const success = await feedStore.mutePost(p.post.id)
    if (success) {
      toast.info('Post muted')
    } else {
      toast.error('Failed to mute post')
    }
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
      <v-spacer />
      <!-- Post options menu -->
      <v-menu v-if="!isOwnPost" open-on-hover>
        <template #activator="{ props }">
          <v-btn icon size="small" v-bind="props" variant="text">
            <v-icon>mdi-dots-horizontal</v-icon>
          </v-btn>
        </template>
        <v-list class="rounded-lg">
          <v-list-item class="cursor-pointer" @click="handleMutePost">
            <v-icon class="mr-2" icon="mdi-volume-off" />
            Hide this post
          </v-list-item>
          <template v-if="!isBlocked">
            <v-list-item class="cursor-pointer" @click="handleFollow">
              <v-icon class="mr-2" :icon="isFollowing ? 'mdi-account-minus-outline' : 'mdi-account-plus-outline'" />
              {{ isFollowing ? 'Unfollow' : 'Follow' }} @{{ post.user.displayName.replaceAll(' ', '_') }}
            </v-list-item>
            <v-list-item class="cursor-pointer text-danger" @click="handleBlock">
              <v-icon class="mr-2" icon="mdi-block-helper" />
              Block this user
            </v-list-item>
          </template>
          <template v-else>
            <v-list-item class="cursor-pointer text-danger" @click="handleUnblock">
              <v-icon class="mr-2" icon="mdi-account-off-outline" />
              Unblock this user
            </v-list-item>
          </template>
        </v-list>
      </v-menu>

    </header>
    <!-- Sensitive content warning -->
    <div v-if="post.stepFive.enableTriggerWarning && !showSensitiveContent" class="sensitive-content">
      <div class="content">
        <p>
          ⚠️This post contains triggers: <span class="text-capitalize">{{
            post.stepFive?.triggerTags?.join(',')
          }}</span>
        </p>
        <div class="submit-btn mt-2" @click="showSensitiveContent = true">Show post</div>
      </div>
    </div>
    <!-- Post content -->
    <template v-else>
      <div v-if="post.stepOne.selectedCategories.length > 0" class="post-tags" @click="openPost">
        <span>{{ post.stepOne.selectedCategories.map(el => el.label).join(' / ') }}</span>
      </div>
      <h2 class="post-title" @click="openPost">
        {{ post.stepTwo.title }}
      </h2>
      <p class="post-body" @click="openPost" v-html="truncatedBody" />
      <button v-if="showReadMore" class="read-more" @click="readMore">Read more</button>
      <div v-if="post.stepFour.emotionTags" class="post-chips" @click="openPost">
        <span
          v-for="chip in post.stepFour.emotionTags"
          :key="chip"
          class="post-chip"
        >
          {{ chip.emoji }}
          {{ chip.label }}
        </span>
      </div>
      <div v-if="post.stepFour?.recoveryTime || post.stepFour.cost" class="post-meta" @click="openPost">
        <div v-if="post.stepFour.cost" class="meta-item">
          <span class="meta-label">💰    Cost:</span>
          <span>{{ formatNumber(post.stepFour.cost) }}</span>
        </div>
        <div v-if="post.stepFour?.recoveryTime" class="meta-item">
          <span class="meta-label">⏱️   Recovery:</span>
          <span>{{ post.stepFour?.recoveryTime?.title }}</span>
        </div>
      </div>
    </template>
    <!-- Post footer with actions -->
    <footer class="post-footer" @click="openPost">
      <button class="icon-btn" :class="{ 'liked': isLiked }" :disabled="isLiking" @click.stop.prevent="handleLike">
        <v-icon size="18">{{ isLiked ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
        <span>{{ likeCount }}</span>
      </button>
      <button v-if="post.stepFive.allowComments" class="icon-btn">
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
    <!-- Block User Dialog -->
    <v-dialog v-model="showBlockDialog" max-width="480">
      <div class="bg-white rounded-lg py-6 px-6">
        <h6 class="text-h6 text-center">Block @{{ post.user.displayName }}?</h6>
        <p class="text-description mt-3">
          They will be able to see your public posts, but will no longer be able to engage with them.
          @{{ post.user.displayName }} will also not be able to follow or message you, and you will not see
          notifications from them.
        </p>
        <v-row class="mt-3">
          <v-col>
            <div class="cancel-btn" @click="showBlockDialog = false">Cancel</div>
          </v-col>
          <v-col>
            <div class="submit-btn" @click="confirmBlock">Block</div>
          </v-col>
        </v-row>
      </div>
    </v-dialog>
  </div>
</template>
