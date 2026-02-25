<route lang="json">
{
  "meta": {
    "layout": "MainLayout",
    "auth": true
  }
}
</route>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import FormInput from '@/components/FormInput.vue'
  import { useAuthStore } from '@/stores/auth'
  import { useSinglePostStore } from '@/stores/single-post'
  import { formatNumber } from '@/utils/format-number.js'

  const route = useRoute()
  const { getPostById, incrementViewCount, addComment, addReply, toggleCommentLike, getComments } = useSinglePostStore()
  const authStore = useAuthStore()
  const post = ref(null)
  const comments = ref([])
  const newComment = ref('')
  const isSubmitting = ref(false)
  const replyText = ref({})
  const showReplyInput = ref({})

  const reactions = {
    'I\'ve been there': '👏',
    'Thank you': '🙏',
    'Growth happens': '🌱',
    'Not alone': '🤗',
  }

  onMounted(() => {
    const postId = route.params.id
    if (postId) {
      getPostById(postId).then(res => {
        post.value = res
        incrementViewCount(postId)
      })
      loadComments(postId)
    }
  })

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

    // Sort replies by date
    for (const comment of rootComments) {
      comment.replies.sort((a, b) => a.createdAt - b.createdAt)
    }

    comments.value = rootComments
  }

  const userInitial = computed(() => {
    try {
      return post.value?.user?.displayName?.charAt(0).toUpperCase() || ''
    } catch {
      return 'GG'
    }
  })

  async function submitComment () {
    if (!newComment.value.trim()) return

    isSubmitting.value = true
    try {
      await addComment(post.value.id, authStore.user, newComment.value)
      newComment.value = ''
      await loadComments(post.value.id)
    } catch (error) {
      console.error('Failed to submit comment:', error)
    } finally {
      isSubmitting.value = false
    }
  }

  async function submitReply (commentId) {
    const text = replyText.value[commentId]
    if (!text?.trim()) return

    try {
      await addReply(post.value.id, commentId, authStore.user, text)
      replyText.value[commentId] = ''
      showReplyInput.value[commentId] = false
      await loadComments(post.value.id)
    } catch (error) {
      console.error('Failed to submit reply:', error)
    }
  }

  async function toggleLike (comment) {
    if (!authStore.user) return
    const isLiked = comment.likes?.includes(authStore.user.uid)
    try {
      await toggleCommentLike(comment.id, authStore.user.uid, isLiked)
      await loadComments(post.value.id)
    } catch (error) {
      console.error('Failed to toggle like:', error)
    }
  }

  function formatDate (timestamp) {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }
</script>

<template>
  <div v-if="post" class="single-post-page">
    <div class="single-post-page__header d-flex align-center mb-6">
      <v-avatar class="mr-4" color="grey-lighten-2" size="48">
        <img v-if="post.user?.photoURL" alt="User avatar" :src="post.user.photoURL">
        <span v-else class="text-h6">{{ userInitial }}</span>
      </v-avatar>
      <div>
        <div class="font-weight-bold">{{ post.user?.displayName }}</div>
        <div class="text-caption text-grey">18 days ago</div>
      </div>
      <v-spacer />
      <v-chip
        v-if="post.stepOne?.selectedCategories?.[0]?.label"
        class="mr-2"
        color="blue-grey-darken-4"
        label
        size="small"
      >{{ post.stepOne.selectedCategories[0].label }}</v-chip>
      <div class="text-caption text-grey d-flex align-center">
        <v-icon class="mr-1" size="small">mdi-eye-outline</v-icon>
        {{ post.views || 0 }}
        <span class="mx-2">•</span>
        <v-icon class="mr-1" size="small">mdi-clock-outline</v-icon> 1 min read
      </div>
    </div>

    <h1 class="single-post-page__title text-h3 font-weight-bold mb-8 text-blue-grey-darken-4">
      {{ post.stepTwo?.title }}
    </h1>

    <section v-if="post.stepTwo?.description" class="single-post-page__section mb-6">
      <h2 class="text-h6 font-weight-bold mb-2">What Happened</h2>
      <div class="text-body-1 text-grey-darken-2" v-html="post.stepTwo?.description" />
    </section>

    <section v-if="post.stepTwo?.whatWentWrong" class="single-post-page__section mb-6">
      <h2 class="text-h6 font-weight-bold mb-2">What Went Wrong</h2>
      <div class="text-body-1 text-grey-darken-2 italic" v-html="post.stepTwo?.whatWentWrong" />
    </section>

    <v-card class="single-post-page__learning pa-6 rounded-lg mb-6 border-dashed" color="blue" style="border-style: dashed !important;" variant="outlined">
      <template v-if="post.stepThree?.whatILearned">
        <h2 class="text-h6 font-weight-bold mb-2">What I Learned</h2>
        <div class="mb-4 text-blue-darken-4">{{ post.stepThree.whatILearned }}</div>
      </template>
      <template v-if="post.stepThree?.keyTakeaways">
        <h2 class="text-h6 font-weight-bold mb-2">Key Takeaways</h2>
        <div class="text-blue-darken-4 ml-4" v-html="post.stepThree.keyTakeaways " />
      </template>
    </v-card>

    <div class="single-post-page__stats bg-grey-lighten-5 pa-4 rounded-lg mb-8">
      <div v-if="post.stepFour?.cost" class="d-flex mb-2">
        <v-icon class="mr-2" color="grey">mdi-currency-usd</v-icon>
        <span class="font-weight-bold mr-2">Cost:</span>{{ formatNumber(post.stepFour?.cost) }}
      </div>
      <div v-if="post.stepFour?.recoveryTime" class="d-flex mb-2">
        <v-icon class="mr-2" color="grey">mdi-history</v-icon>
        <span class="font-weight-bold mr-2">Recovery Time:</span> {{ post.stepFour?.recoveryTime?.title }}
      </div>
      <div v-if="post.stepFour?.emotionTags.length" class="mt-4">
        <v-chip
          v-for="(chip, index) in post.stepFour?.emotionTags"
          :key="index"
          class="mr-2"
          color="orange"
          size="small"
          variant="tonal"
        > {{ chip.emoji }} {{ chip.label }}</v-chip>
      </div>
    </div>
    <img
      v-for="img in post.stepTwo.images"
      :key="img"
      :alt="img"
      class="w-100"
      :src="img"
    >
    <v-divider class="mb-6" />
    <div class="text-center mb-4 font-weight-bold">React to This Story</div>
    <v-row class="single-post-page__reactions mb-8" dense justify="center">
      <v-col v-for="(emoji, label) in reactions" :key="label" cols="auto">
        <v-btn class="text-none rounded-lg px-4" height="60" variant="outlined">
          <div class="d-flex flex-column align-center">
            <span class="text-h6">{{ emoji }}</span>
            <span class="text-caption">{{ label }}</span>
          </div>
        </v-btn>
      </v-col>
    </v-row>
    <v-divider v-if="post.stepFive?.allowComments" class="mb-6" />

    <div v-if="post.stepFive?.allowComments" class="single-post-page__comments">
      <h3 class="text-h5 font-weight-bold mb-4">Comments ({{ comments.length }})</h3>

      <div class="mb-6">
        <div class="d-flex">
          <v-avatar class="mr-3" color="grey-lighten-2" size="40">
            <img v-if="authStore.user?.photoURL" alt="User avatar" :src="authStore.user.photoURL">
            <span v-else class="text-subtitle-1">{{ authStore.user?.displayName?.charAt(0).toUpperCase() || 'U' }}</span>
          </v-avatar>
          <div class="flex-grow-1">
            <FormInput
              v-model="newComment"
              label="Share your thoughts..."
              placeholder="Write a comment..."
            />
            <div class="d-flex justify-end mt-2">
              <v-btn
                color="primary"
                :disabled="!newComment.trim()"
                :loading="isSubmitting"
                variant="flat"
                @click="submitComment"
              >
                Post Comment
              </v-btn>
            </div>
          </div>
        </div>
      </div>

      <div v-for="comment in comments" :key="comment.id" class="comment-item mb-4">
        <div class="d-flex">
          <v-avatar class="mr-3" color="grey-lighten-2" size="40">
            <img v-if="comment.user?.photoURL" alt="User avatar" :src="comment.user.photoURL">
            <span v-else class="text-subtitle-1">{{ comment.user?.displayName?.charAt(0).toUpperCase() || 'U' }}</span>
          </v-avatar>
          <div class="flex-grow-1">
            <div class="comment-item__header d-flex align-center mb-1">
              <span class="username font-weight-bold mr-2">{{ comment.user?.displayName }}</span>
              <span class="date text-caption text-grey">{{ formatDate(comment.createdAt) }}</span>
            </div>
            <div class="comment-item__content text-body-2 mb-2">{{ comment.text }}</div>

            <div class="comment-item__actions d-flex align-center mb-2">
              <v-btn
                class="px-0 mr-4"
                color="grey-darken-1"
                density="compact"
                variant="text"
                @click="toggleLike(comment)"
              >
                <v-icon :color="comment.likes?.includes(authStore.user?.uid) ? 'primary' : ''" icon="mdi-thumb-up-outline" start />
                {{ comment.likes?.length || 0 }}
              </v-btn>

              <v-btn
                class="px-0"
                color="grey-darken-1"
                density="compact"
                variant="text"
                @click="showReplyInput[comment.id] = !showReplyInput[comment.id]"
              >
                Reply
              </v-btn>
            </div>

            <!-- Reply Input -->
            <div v-if="showReplyInput[comment.id]" class="mt-2 mb-4 ml-4">
              <FormInput
                label="Write a reply..."
                :model-value="replyText[comment.id] || ''"
                placeholder="Reply to comment..."
                @update:model-value="val => replyText[comment.id] = val"
              />
              <div class="d-flex justify-end mt-2">
                <v-btn
                  color="primary"
                  size="small"
                  variant="text"
                  @click="submitReply(comment.id)"
                >
                  Reply
                </v-btn>
              </div>
            </div>

            <!-- Replies -->
            <div v-if="comment.replies?.length" class="comment-item__replies ml-8 mt-2 pl-4 border-s-sm">
              <div v-for="reply in comment.replies" :key="reply.id" class="reply-item mb-3">
                <div class="d-flex align-center mb-1">
                  <v-avatar class="mr-2" color="grey-lighten-2" size="24">
                    <img v-if="reply.user?.photoURL" alt="User avatar" :src="reply.user.photoURL">
                    <span v-else class="text-caption">{{ reply.user?.displayName?.charAt(0).toUpperCase() || 'U' }}</span>
                  </v-avatar>
                  <span class="font-weight-bold text-body-2 mr-2">{{ reply.user?.displayName }}</span>
                  <span class="text-caption text-grey">{{ formatDate(reply.createdAt) }}</span>
                </div>
                <div class="text-body-2 ml-8">{{ reply.text }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
