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
  import { VEmojiPickerVEmojiPicker } from 'vue-emoji-picker'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import FormInput from '@/components/FormInput.vue'
  import { auth } from '@/firebase'
  import { useAuthStore } from '@/stores/auth'
  import { usePostCardStore } from '@/stores/post-card.js'
  import { useSinglePostStore } from '@/stores/single-post'
  import { formatNumber } from '@/utils/format-number.js'
  import '@/styles/pages/single-post.scss'

  dayjs.extend(relativeTime)

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const { getPostById, incrementViewCount, addComment, addReply, toggleCommentLike, getComments } = useSinglePostStore()
  const postCardStore = usePostCardStore()
  const authStore = useAuthStore()
  const post = ref(null)
  const comments = ref([])
  const newComment = ref('')
  const isSubmitting = ref(false)
  const replyText = ref({})
  const showReplyInput = ref({})
  const showEmojiPicker = ref(false)

  // Like logic state
  const isLiked = ref(false)
  const likeCount = ref(0)
  const isLiking = ref(false)

  const reactions = ref([
    {
      id: 'been_there',
      emoji: '👋',
      label: 'I\'ve been there',
      count: 0,
      active: false,
    },
    {
      id: 'thanks',
      emoji: '🙏',
      label: 'Thank \'s for teaching',
      count: 0,
      active: false,
    },
    {
      id: 'growth',
      emoji: '🌱',
      label: 'Growth happens',
      count: 0,
      active: false,
    },
    {
      id: 'not_alone',
      emoji: '🤗',
      label: 'You\'re not alone',
      count: 0,
      active: false,
    },
    {
      id: 'courage',
      emoji: '💪',
      label: 'This takes courage',
      count: 0,
      active: false,
    },
  ])

  onMounted(() => {
    const postId = route.params.id
    if (postId) {
      getPostById(postId).then(res => {
        post.value = res
        incrementViewCount(postId)

        // Initialize like state
        if (auth.currentUser && res.likedBy?.includes(auth.currentUser.uid)) {
          isLiked.value = true
        }
        likeCount.value = res.likes || 0

        // Initialize reactions state
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
  })

  const timeAgo = computed(() => {
    if (!post.value?.createdAt) return ''
    return dayjs.unix(post.value.createdAt.seconds).fromNow()
  })

  async function handlePostLike () {
    if (!authStore.user) {
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

    if (!result.success) {
      isLiked.value = originalIsLiked
      likeCount.value = originalLikeCount
      console.error('Failed to update like status:', result.error)
    }

    isLiking.value = false
  }

  async function handleReaction (reactionId) {
    if (!authStore.user) {
      await router.push('/login')
      return
    }

    const reaction = reactions.value.find(r => r.id === reactionId)
    if (!reaction) return

    const originalActive = reaction.active
    const originalCount = reaction.count
    const newActive = !reaction.active

    // Optimistic update
    reaction.active = newActive
    reaction.count += newActive ? 1 : -1

    const result = await postCardStore.toggleReaction({
      postId: post.value.id,
      reactionId: reactionId,
      active: newActive,
    })

    if (!result.success) {
      // Revert UI on failure
      reaction.active = originalActive
      reaction.count = originalCount
      console.error('Failed to update reaction:', result.error)
    }
  }

  function handleShare () {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied to clipboard!')
    }).catch(() => {
      toast.error('Failed to copy link')
    })
  }

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

  function formatCommentDate (timestamp) {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return dayjs(date).fromNow()
  }

  function onSelectEmoji (emoji) {
    newComment.value += emoji.data
    showEmojiPicker.value = false
  }
</script>

<template>

  <div v-if="post" class="single-post-page">
    <div class="d-block">
      <v-icon class="cursor-pointer" icon="mdi-arrow-left" @click="$router.go(-1)" />
      <h1 class="font-weight-bold text-grey-darken-3">Post</h1>
    </div>
    <div class="bg mt-4">
      <div class="single-post-page__header d-flex align-center">
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
            <div class="font-weight-bold">{{ post.user?.displayName }}</div>
            <div class="create-at">{{ timeAgo }}</div>
          </div>
          <div class="text-caption text-grey">@{{ post.user?.displayName.replaceAll(' ', '_') }}</div>
        </div>
      </div>
      <div class="d-flex justify-start mt-2">
        <div
          v-if="post.stepOne?.selectedCategories?.[0]?.label"
          class="chip-custom"
        >{{ post.stepOne.selectedCategories[0].label }}
        </div>
      </div>

      <h1 class="single-post-page__title text-h3 mt-6 font-weight-bold mb-8 text-blue-grey-darken-4">
        {{ post.stepTwo?.title }}
      </h1>

      <section v-if="post.stepTwo?.description" class="single-post-page__section mb-6">
        <h2 class="section-title">What Happened</h2>
        <div v-html="post.stepTwo?.description" />
      </section>

      <section v-if="post.stepTwo?.whatWentWrong" class="single-post-page__section mb-6">
        <h2 class="section-title">What Went Wrong</h2>
        <div v-html="post.stepTwo?.whatWentWrong" />
      </section>

      <div
        v-if="post.stepThree?.whatILearned || post.stepThree?.keyTakeaways"
        class="bg-orange-accent-1 pa-6 rounded-lg mb-6"
      >
        <section v-if="post.stepThree?.whatILearned">
          <h2 class="section-title">What I Learned</h2>
          <div v-html="post.stepThree.whatILearned" />
        </section>
        <section v-if="post.stepThree?.keyTakeaways">
          <h2 class="section-title">Key Takeaways</h2>
          <div v-html="post.stepThree.keyTakeaways " />
        </section>
      </div>

      <section v-if="post.stepThree?.whatIdDoDifferently" class="bg-orange-accent-1 pa-6 rounded-lg mb-6">
        <h2 class="section-title">What I'd Do Differently</h2>
        <div v-html="post.stepThree.whatIdDoDifferently" />
      </section>

      <section v-if="post.stepThree?.advice" class="bg-orange-accent-1 pa-6 rounded-lg mb-6">
        <h2 class="section-title">Advice for Others</h2>
        <div v-html="post.stepThree.advice" />
      </section>

      <h3>Additional Details</h3>

      <div v-if="post.stepFour?.cost" class="d-flex mb-2">
        <span class="font-weight-semibold mr-2">Cost:</span>
        <span class="text-grey-darken-4">{{ formatNumber(post.stepFour?.cost) }}</span>
      </div>
      <div v-if="post.stepFour?.recoveryTime" class="d-flex mb-2">
        <span class="font-weight-semibold mr-2">Recovery Time:</span>
        <span class="text-grey-darken-4">{{ post.stepFour?.recoveryTime?.title }}</span>
      </div>
      <div v-if="post.stepFour?.emotionTags.length" class="d-flex">
        <span class="font-weight-semibold mr-2">Emotions:</span>
        <v-chip
          v-for="(chip, index) in post.stepFour?.emotionTags"
          :key="index"
          class="mr-2"
          size="small"
        > {{ chip.emoji }} {{ chip.label }}
        </v-chip>
      </div>
      <div v-if="post.stepFour.tags.length > 0" class="d-flex mt-2">
        <span class="font-weight-semibold mr-2">Tags:</span>
        <ul class="tag-list">
          <li v-for="tag in post.stepFour.tags" :key="tag" class="tag">{{ tag }}</li>
        </ul>
      </div>

      <v-divider class="my-6" />
      <img
        v-for="img in post.stepTwo.images"
        :key="img"
        :alt="img"
        class="w-100"
        :src="img"
      >
      <v-divider class="my-6" />
      <h3>React to This Story</h3>
      <ul class="reaction-list ga-2">
        <li
          v-for="(item, index) in reactions"
          :key="index"
          class="cursor-pointer"
          :class="{ 'active': item.active }"
          @click="handleReaction(item.id)"
        >
          <p class="emoji">{{ item.emoji }}</p>
          <p class="label text-center">{{ item.label }}</p>
          <p class="count text-center font-weight-bold">{{ item.count }}</p>
        </li>
      </ul>
      <div class="footer">
        <div class="d-flex">
          <div
            class="item cursor-pointer"
            :class="{ 'text-primary': isLiked }"
            @click="handlePostLike"
          >
            <v-icon :icon="isLiked ? 'mdi-heart' : 'mdi-heart-outline'" />
            <span class="ml-2">{{ likeCount }}</span>
          </div>
          <div class="item ml-4">
            <v-icon icon="mdi-comment-outline" />
            <span class="ml-2">{{ comments.length }}</span>
          </div>
          <div class="item ml-4">
            <v-icon icon="mdi-eye-outline" />
            <span class="ml-2">{{ post.views || 0 }}</span>
          </div>
        </div>
        <v-icon class="cursor-pointer" icon="mdi-share-variant-outline" @click="handleShare" />
      </div>
    </div>

    <div v-if="post.stepFive?.allowComments" class="bg mt-6 single-post-page__comments">
      <h3 class="text-h5 font-weight-bold mb-4">Comments</h3>
      <div class="notice">
        <b class="font-weight-bold mr-1">Remember:</b>
        <span>No unsolicited advice. Use "I" statements. Be supportive, not prescriptive.</span>
      </div>
      <div class="mt-6">
        <div class="d-flex">
          <v-avatar class="mr-3" color="grey-lighten-2" size="40">
            <v-img
              v-if="authStore.user?.photoURL"
              alt="User avatar"
              cover
              :src="authStore.user.photoURL"
            />
            <span v-else class="text-subtitle-1">{{
              authStore.user?.displayName?.charAt(0).toUpperCase() || 'U'
            }}</span>
          </v-avatar>
          <div class="flex-grow-1">
            <div class="position-relative">
              <FormTextarea
                v-model="newComment"
                height="89"
                hide-details
                placeholder="Write a comment..."
              />
              <div class="emoji-picker-container">
                <VEmojiPicker
                  v-if="showEmojiPicker"
                  class="emoji-picker"
                  @select="onSelectEmoji"
                />
                <v-icon
                  class="emoji-icon cursor-pointer"
                  icon="mdi-emoticon-outline"
                  @click="showEmojiPicker = !showEmojiPicker"
                />
              </div>
            </div>
            <div class="d-flex justify-start mt-2">
              <div
                class="submit-btn"
                :class="{ 'disabled': !newComment.trim() }"
                @click="submitComment"
              >
                Post Comment
              </div>
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
              <span class="date text-caption text-grey">{{ formatCommentDate(comment.createdAt) }}</span>
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
                <v-icon
                  :color="comment.likes?.includes(authStore.user?.uid) ? 'primary' : ''"
                  icon="mdi-thumb-up-outline"
                  start
                />
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
                    <span v-else class="text-caption">{{
                      reply.user?.displayName?.charAt(0).toUpperCase() || 'U'
                    }}</span>
                  </v-avatar>
                  <span class="font-weight-bold text-body-2 mr-2">{{ reply.user?.displayName }}</span>
                  <span class="text-caption text-grey">{{ formatCommentDate(reply.createdAt) }}</span>
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

<style scoped lang="scss">
.emoji-picker-container {
  position: absolute;
  bottom: 10px;
  right: 10px;
  z-index: 10;

  .emoji-picker {
    position: absolute;
    bottom: 40px;
    right: 0;
    z-index: 100;
  }
}
</style>
