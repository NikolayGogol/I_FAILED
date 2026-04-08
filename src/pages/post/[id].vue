<route lang="json">
{
"meta": {
"layout": "MainLayout",
"auth": false
}
}
</route>

<script setup>
  import dayjs from 'dayjs'
  import relativeTime from 'dayjs/plugin/relativeTime'
  import { computed, onBeforeMount, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import CommentsSection from '@/components/CommentsSection.vue'
  import PostMenu from '@/components/feed/PostMenu.vue'
  import { auth } from '@/firebase'
  import { getIcon } from '@/models/icons.js'
  import { useAuthStore } from '@/stores/auth'
  import { useCommentsStore } from '@/stores/comments'
  import { usePostCardStore } from '@/stores/post-card.js'
  import { useSinglePostStore } from '@/stores/single-post/single-post.js'
  import { floatNumber, formatNumber } from '@/utils/format-number.js'
  import { stripHtml } from '@/utils/html.js'
  import { timeTransformAgo } from '@/utils/time.js'
  import 'vue3-emoji-picker/css'
  import '@/styles/pages/single-post.scss'
  const props = defineProps({
    id: {
      type: String,
      default: '',
    },
  })
  dayjs.extend(relativeTime)

  // Vue and Vue Router setup
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  // Pinia stores for state management
  const {
    getPostById,
    incrementViewCount,
    incrementCategoryRead,
    getUsersForMentions,
    addToRead,
  } = useSinglePostStore()
  const { getComments } = useCommentsStore()
  const postCardStore = usePostCardStore()
  const authStore = useAuthStore()

  // Component state
  const post = ref(null)
  const comments = ref([])
  const users = ref([])
  const isAuth = computed(() => !!authStore.user)

  // Post-specific state
  const isLiked = ref(false)
  const likeCount = ref(0)
  const isLiking = ref(false)
  const reactions = ref([
    { id: 'been_there', emoji: '👋', label: 'I\'ve been there', count: 0, active: false },
    { id: 'thanks', emoji: '🙏', label: 'Thank \'s for teaching', count: 0, active: false },
    { id: 'growth', emoji: '🌱', label: 'Growth happens', count: 0, active: false },
    { id: 'not_alone', emoji: '🤗', label: 'You\'re not alone', count: 0, active: false },
    { id: 'courage', emoji: '💪', label: 'This takes courage', count: 0, active: false },
  ])
  let timeToRead = 1

  // Computed property to check if the current user owns the post
  const isOwnPost = computed(() => {
    if (!authStore.user || !post.value) return false
    return authStore.user.uid === post.value.uid
  })

  let timeOut = null
  onBeforeMount(() => {
    clearTimeout(timeOut)
  })

  // Initialize component on mount
  onMounted(() => {
    const postId = route.params.id || props.id
    if (postId) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      init(postId)
      getUsersForMentions().then(res => {
        users.value = res.map(user => ({
          value: user.uid,
          label: user.displayName,
          photoURL: user.photoURL,
        }))
      })
      // Mark post as read after a delay
      timeOut = setTimeout(() => {
        if (post.value) addToRead(post.value)
      }, (timeToRead * 60 * 1000) / 2)
    }
  })

  /**
   * Initializes the post and its related data.
   * @param {string} postId - The ID of the post to initialize.
   */
  function init (postId) {
    getPostById(postId).then(res => {
      post.value = res
      incrementViewCount(postId)

      if (auth.currentUser?.uid && res?.selectedCategories?.[0]) {
        incrementCategoryRead({
          userId: auth.currentUser.uid,
          category: res.selectedCategories[0],
        })
      }

      if (auth.currentUser && res.likedBy?.includes(auth.currentUser.uid)) {
        isLiked.value = true
      }
      likeCount.value = res.likes || 0

      if (res.reactions) {
        for (const reaction of reactions.value) {
          reaction.count = res.reactions[reaction.id]?.count || 0
          if (auth.currentUser && res.reactions[reaction.id]?.users?.includes(auth.currentUser.uid)) {
            reaction.active = true
          }
        }
      }
    })
    loadComments(postId)
  }

  // Re-initialize when route params change
  watch(() => route.params, val => {
    init(val.id)
  })

  // Calculates the estimated reading time for the post
  function readingTime (obj) {
    const arr = [
      obj?.title || '',
      obj?.howDidItFeel || '',
      obj?.whatHappened || '',
      obj?.whatWentWrong || '',
      obj?.lessonLearned?.advice || '',
      obj?.lessonLearned?.keyTakeaways || '',
      obj?.lessonLearned?.whatILearned || '',
      obj?.lessonLearned?.whatIdDoDifferently || '',
    ]
    const word = arr.map(item => stripHtml(item)).join('')
    const wordCount = word.trim().length
    timeToRead = Math.ceil(wordCount / 200)
    return `${timeToRead} min read`
  }

  // Handles the post like action
  async function handlePostLike () {
    if (isOwnPost.value) {
      toast.info('You can not like own post')
      return
    }
    if (!isAuth.value) {
      await router.push('/login')
      return
    }
    if (isLiking.value) return
    isLiking.value = true

    const originalIsLiked = isLiked.value
    const originalLikeCount = likeCount.value
    const newIsLiked = !isLiked.value

    isLiked.value = newIsLiked
    likeCount.value += newIsLiked ? 1 : -1

    const result = await postCardStore.toggleLike({
      postId: post.value.id,
      liked: newIsLiked,
    })
    if (newIsLiked) await postCardStore.saveLikeAction(post.value)
    if (result.success && newIsLiked) {
      await postCardStore.sendLikeNotification(post.value)
    }
    if (!result.success) {
      isLiked.value = originalIsLiked
      likeCount.value = originalLikeCount
      console.error('Failed to update like status:', result.error)
    }

    isLiking.value = false
  }

  // Handles post reaction actions
  async function handleReaction (reactionId) {
    if (isOwnPost.value) {
      toast.info('You can not react with own post')
      return
    }
    if (!isAuth.value) {
      await router.push('/login')
      return
    }

    const reaction = reactions.value.find(r => r.id === reactionId)
    if (!reaction) return

    const originalActive = reaction.active
    const originalCount = reaction.count
    const newActive = !reaction.active

    reaction.active = newActive
    reaction.count += newActive ? 1 : -1

    const result = await postCardStore.toggleReaction({
      postId: post.value.id,
      reactionId: reactionId,
      active: newActive,
    })

    if (!result.success) {
      reaction.active = originalActive
      reaction.count = originalCount
      console.error('Failed to update reaction:', result.error)
    }
  }

  // Copies the post URL to the clipboard
  function handleShare () {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied to clipboard!')
    }).catch(() => {
      toast.error('Failed to copy link')
    })
  }

  /**
   * Loads and structures comments and replies for the post.
   * @param {string} postId - The ID of the post.
   */
  async function loadComments (postId) {
    const allComments = await getComments(postId)
    const commentMap = {}
    const rootComments = []

    for (const comment of allComments) {
      comment.replies = []
      commentMap[comment.id] = comment
    }

    for (const comment of allComments) {
      if (comment.parentId) {
        if (commentMap[comment.parentId]) {
          commentMap[comment.parentId].replies.push(comment)
        }
      } else {
        rootComments.push(comment)
      }
    }

    const sortReplies = replies => {
      replies.sort((a, b) => a.createdAt - b.createdAt)
      for (const reply of replies) {
        if (reply.replies?.length) {
          sortReplies(reply.replies)
        }
      }
    }

    for (const comment of rootComments) {
      sortReplies(comment.replies)
    }

    comments.value = rootComments
  }

  // Computes the user's initial for the avatar
  const userInitial = computed(() => {
    try {
      if (post.value?.isAnonymous) return 'A'
      return post.value?.user?.displayName?.charAt(0).toUpperCase() || 'U'
    } catch {
      return 'U'
    }
  })
</script>

<template>
  <div v-if="post" class="single-post-page">
    <!-- Header -->
    <div v-if="!props.id" class="d-flex align-center d-sm-block">
      <v-icon class="cursor-pointer" icon="mdi-arrow-left" @click="$router.go(-1)" />
      <h1 class="font-weight-bold text-grey-darken-3 ml-3 ml-sm-0">Post</h1>
    </div>
    <!-- Post Content -->
    <div class="bg mt-4">
      <!-- Post Header -->
      <div class="single-post-page__header w-100 d-flex align-center justify-space-between">
        <div class="d-flex align-start">
          <v-avatar class="mr-4" color="grey-lighten-2" size="48">
            <v-img
              v-if="post.user?.photoURL"
              alt="User avatar"
              class="w-100 img-cover"
              :src="post.user.photoURL"
            />
            <span v-else class="text-h6">{{ userInitial }}</span>
          </v-avatar>
          <div>
            <div class="d-flex">
              <div class="font-weight-bold">{{ post.isAnonymous ? 'Anonymous' : post.user?.displayName }}</div>
              <div class="create-at">{{ timeTransformAgo(post.createdAt) }}</div>
            </div>
            <div v-if="!post.isAnonymous" class="text-caption text-grey">
              @{{ post.user?.displayName?.replaceAll(' ', '_') }}
            </div>
          </div>
        </div>
        <div v-if="!isOwnPost" class="post-actions">
          <PostMenu :post="post" />
        </div>
      </div>

      <!-- Post Meta -->
      <div class="d-flex justify-space-between mt-2">
        <div
          v-if="post.selectedCategories?.[0]?.label"
          class="chip-custom"
        >{{ post.selectedCategories[0].label }}
        </div>
        <div class="read-widget">
          <v-icon icon="mdi-clock-outline" />
          {{ readingTime(post) }}
        </div>
      </div>

      <!-- Post Body -->
      <h1 class="single-post-page__title text-h3 mt-6 font-weight-bold mb-8 text-blue-grey-darken-4">
        {{ post.title }}
      </h1>
      <section v-if="post.whatHappened" class="single-post-page__section mb-6">
        <h2 class="section-title">What Happened</h2>
        <div class="word-break" v-html="post.whatHappened" />
      </section>

      <section v-if="post?.whatWentWrong" class="single-post-page__section mb-6">
        <h2 class="section-title">What Went Wrong</h2>
        <div class="word-break" v-html="post?.whatWentWrong" />
      </section>

      <div
        v-if="post?.lessonLearned?.whatILearned || post?.lessonLearned?.keyTakeaways"
        class="bg-orange-accent-1 pa-6 rounded-lg mb-6"
      >
        <section v-if="post.lessonLearned?.whatILearned">
          <h2 class="section-title">What I Learned</h2>
          <div class="word-break quill-break" v-html="post.lessonLearned.whatILearned" />
        </section>
        <section v-if="post.lessonLearned?.keyTakeaways">
          <h2 class="section-title">Key Takeaways</h2>
          <div class="word-break quill-break" v-html="post.lessonLearned.keyTakeaways " />
        </section>
      </div>
      <section v-if="post?.lessonLearned?.whatIdDoDifferently" class="bg-orange-accent-1 pa-6 rounded-lg mb-6">
        <h2 class="section-title">What I'd Do Differently</h2>
        <div class="word-break quill-break" v-html="post.lessonLearned.whatIdDoDifferently" />
      </section>
      <section v-if="post?.lessonLearned?.advice" class="bg-orange-accent-1 pa-6 rounded-lg mb-6">
        <h2 class="section-title">Advice for Others</h2>
        <div class="word-break quill-break" v-html="post?.lessonLearned.advice" />
      </section>

      <h3>Additional Details</h3>
      <div v-if="post?.lessonLearned?.cost" class="d-flex mb-2">
        <span class="font-weight-semibold mr-2">Cost:</span>
        <span class="text-grey-darken-4">{{ formatNumber(post.lessonLearned?.cost) }}</span>
      </div>
      <div v-if="post?.lessonLearned?.recoveryTime" class="d-flex mb-2">
        <span class="font-weight-semibold mr-2">Recovery Time:</span>
        <span class="text-grey-darken-4">{{ post.lessonLearned?.recoveryTime?.title }}</span>
      </div>
      <div v-if="post?.emotionTags?.length" class="d-flex flex-column sm-flex-row sm-align-center">
        <span class="font-weight-semibold mr-2">Emotions:</span>
        <div class=" d-flex">
          <v-chip
            v-for="(chip, index) in post?.emotionTags"
            :key="index"
            class="mr-2"
            size="small"
          > {{ chip.emoji }} {{ chip.label }}
          </v-chip>
        </div>
      </div>
      <div v-if="post.tags?.length > 0" class="d-flex mt-2">
        <span class="font-weight-semibold mr-2">Tags:</span>
        <ul class="tag-list">
          <li v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</li>
        </ul>
      </div>
      <v-divider v-if="post.images?.length > 0" class="my-6" />
      <v-img
        v-for="img in post.images"
        :key="img.thumb"
        :alt="post.title"
        :aspect-ratio="16/9"
        class="w-100 rounded-xl mb-3"
        cover
        :lazy-src="img.thumb"
        :src="img.full"
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
      <v-divider class="my-6" />
      <template v-if="!props.id">
        <h3>React to This Story</h3>
        <ul class="reaction-list ga-1 sm-ga-2">
          <li
            v-for="(item, index) in reactions"
            :key="index"
            class="cursor-pointer"
            :class="{ 'active': item.active }"
            @click="handleReaction(item.id)"
          >
            <p class="emoji">{{ item.emoji }}</p>
            <p class="label text-center">{{ item.label }}</p>
            <p class="count text-center font-weight-bold text-uppercase">{{ floatNumber(item.count) }}</p>
          </li>
        </ul>
      </template>
      <div v-if="!props.id" class="footer">
        <div class="d-flex">
          <div class="item cursor-pointer" :class="{'liked': isLiked }" @click="handlePostLike">
            <div class="d-flex" v-html="getIcon('heart')" />
            <span class="ml-2 text-uppercase">{{ floatNumber(likeCount) }}</span>
          </div>
          <div v-if="post.allowComments" class="item ml-4">
            <div class="d-flex" v-html="getIcon('message')" />
            <span class="ml-2">{{ floatNumber(comments.length) }}</span>
          </div>
          <div class="item ml-4">
            <div class="d-flex" v-html="getIcon('eye')" />
            <span class="ml-2 text-uppercase">{{ floatNumber(post.views) }}</span>
          </div>
        </div>
        <div class="d-flex cursor-pointer icon-hover" @click="handleShare" v-html="getIcon('share')" />
      </div>
    </div>
    <template v-if="!props.id">
      <!-- Comments Section -->
      <CommentsSection
        v-if="post.allowComments"
        :comments="comments"
        :post="post"
        :users="users"
        @reload-comments="loadComments(post.id)"
      />
    </template>

  </div>
</template>
