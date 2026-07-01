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
  import { computed, onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import { useEditDraftStore } from '@/stores/edit-draft.js'
  import { useUserStore } from '@/stores/user.js'
  import { formatNumber } from '@/utils/format-number.js'
  import { timeTransformAgo } from '@/utils/time.js'
  import { transformUsername } from '@/utils/transform-username.js'
  import 'vue3-emoji-picker/css'
  import '@/styles/pages/single-post.scss'
  const props = defineProps({
    id: {
      type: String,
      default: '',
    },
  })
  dayjs.extend(relativeTime)
  const userStore = useUserStore()

  // Vue and Vue Router setup
  const route = useRoute()
  const { getDraftById } = useEditDraftStore()

  const authStore = useAuthStore()
  // Component state
  const post = ref(null)
  // Initialize component on mount
  onMounted(() => {
    const postId = route.params.id || props.id
    if (postId) {
      setTimeout(() => {
        if (route.hash) {
          // eslint-disable-next-line unicorn/prefer-query-selector
          const el = document.getElementById(route.hash.replace('#', ''))
          if (el) {
            window.scrollTo({ top: el.offsetTop - 50, behavior: 'smooth' })
          }
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }, 1000)
      init(postId)
    }
  })

  /**
   * Initializes the post and its related data.
   * @param {string} postId - The ID of the post to initialize.
   */
  function init (postId) {
    getDraftById(postId).then(res => {
      if (res?.uid !== authStore?.user?.uid) {
        router.push('/drafts')
        return
      }
      post.value = res
      userStore.getUserById(res.uid)
        .then(res => {
          post.value.user = res
        })
    })
  }
  // Calculates the estimated reading time for the post
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
      <h1 class="font-weight-bold text-grey-darken-3 ml-3 ml-sm-0">Preview</h1>
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
              {{ transformUsername(post.user.userName, post.user.displayName) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Post Meta -->
      <div class="d-flex justify-space-between mt-2">
        <div
          v-if="post.selectedCategories?.[0]?.label"
          class="chip-custom"
        >{{ post.selectedCategories[0].label }}
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
    </div>
  </div>
</template>
