<script setup>
  import dayjs from 'dayjs'
  import relativeTime from 'dayjs/plugin/relativeTime'
  import { computed, ref } from 'vue'
  import EmojiPicker from 'vue3-emoji-picker'
  import { useToast } from 'vue-toastification'
  import { useDisplay } from 'vuetify/framework'
  import CommentMenu from '@/components/CommentMenu.vue'
  import ConfirmationModal from '@/components/ConfirmationModal.vue'
  import ImgComment from '@/components/ImgComment.vue'
  import MentionTextarea from '@/components/MentionTextarea.vue'
  import { getIcon } from '@/models/icons.js'
  import { useAuthStore } from '@/stores/auth'
  import { useCommentsStore } from '@/stores/comments'
  import { usePostCardStore } from '@/stores/post-card.js'
  import { timeTransformAgo } from '@/utils/time.js'

  dayjs.extend(relativeTime)

  const { smAndUp } = useDisplay()

  const props = defineProps({
    post: {
      type: Object,
      required: true,
    },
    comments: {
      type: Array,
      required: true,
    },
    users: {
      type: Array,
      required: true,
    },
  })

  const emit = defineEmits(['reload-comments'])

  const authStore = useAuthStore()
  const commentsStore = useCommentsStore()
  const postCardStore = usePostCardStore()
  const toast = useToast()

  const newComment = ref('')
  const newCommentImage = ref(null)
  const isSubmitting = ref(false)
  const replyText = ref({})
  const replyImage = ref({})
  const showReplyInput = ref({})
  const showEmojiPicker = ref(false)
  const showReplyEmojiPicker = ref({})
  const editingCommentId = ref(null)
  const editingText = ref('')
  const editingImage = ref(null)
  const originalImageUrl = ref(null)
  const showDeleteModal = ref(false)
  const commentToDeleteId = ref(null)

  const isAuth = computed(() => !!authStore.user)

  function canInteract (commentOwnerId) {
    return commentOwnerId !== authStore.user?.uid
  }

  async function submitComment () {
    if (isSubmitting.value) return
    if (!authStore.user) {
      toast.error('You must be logged in to comment.')
      return
    }
    if (!newComment.value.trim() && !newCommentImage.value) return

    isSubmitting.value = true
    try {
      let imageUrl = null
      if (newCommentImage.value) {
        imageUrl = await commentsStore.uploadCommentImage(newCommentImage.value)
      }
      console.log(props.post);
      await commentsStore.addComment(props.post.id, authStore.user, newComment.value, imageUrl, props.post)
      newComment.value = ''
      newCommentImage.value = null
      emit('reload-comments')
    } catch (error) {
      console.error('Failed to submit comment:', error)
      toast.error('Failed to submit comment.')
    } finally {
      isSubmitting.value = false
    }
  }

  async function submitReply (commentId) {
    if (isSubmitting.value) return
    const text = replyText.value[commentId]
    const image = replyImage.value[commentId]
    if (!text?.trim() && !image) return

    isSubmitting.value = true
    try {
      let imageUrl = null
      if (image) {
        imageUrl = await commentsStore.uploadCommentImage(image)
      }
      await commentsStore.addReply(props.post.id, commentId, authStore.user, text, imageUrl)
      replyText.value[commentId] = ''
      replyImage.value[commentId] = null
      showReplyInput.value[commentId] = false
      emit('reload-comments')
    } catch (error) {
      console.error('Failed to submit reply:', error)
      toast.error('Failed to submit reply.')
    } finally {
      isSubmitting.value = false
    }
  }

  async function toggleLike (comment) {
    if (!canInteract(comment.user.uid)) {
      toast.info('You can\'t interact with your own comment.')
      return
    }
    if (!isAuth.value) {
      toast.error('You must be logged in to like comments.')
      return
    }
    const isLiked = comment.likes?.includes(authStore.user.uid) || false

    try {
      await commentsStore.toggleCommentLike(comment.id, authStore.user.uid, isLiked)

      if (!isLiked) {
        const actionType = comment.parentId ? 'replyLike' : 'commentLike'
        const actionData = {
          commentId: comment.id,
          postId: props.post.id,
          post: props.post,
          comment,
        }
        await postCardStore.saveLikeAction(actionData, actionType)
      }

      emit('reload-comments')
    } catch (error) {
      console.error('Failed to toggle like:', error)
      toast.error('Failed to toggle like.')
    }
  }

  function onSelectEmoji (emoji) {
    newComment.value += emoji.i
    showEmojiPicker.value = false
  }

  function onSelectReplyEmoji (emoji, commentId) {
    replyText.value[commentId] = (replyText.value[commentId] || '') + emoji.i
    showReplyEmojiPicker.value[commentId] = false
  }

  function renderCommentText (text) {
    if (!text) return ''
    return text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '<a href="/user-info/$2" class="font-weight-bold text-primary">@$1</a>')
  }

  function handleEditComment (comment) {
    editingCommentId.value = comment.id
    editingText.value = comment.text
    editingImage.value = comment.imageUrl ? { url: comment.imageUrl } : null
    originalImageUrl.value = comment.imageUrl
  }

  async function handleUpdateComment () {
    if (!editingCommentId.value || (!editingText.value.trim() && !editingImage.value)) return

    try {
      let newImageUrl = originalImageUrl.value
      const newImage = editingImage.value
      const isNewImageFile = newImage instanceof File
      const imageRemoved = !newImage && originalImageUrl.value

      if (isNewImageFile) {
        if (originalImageUrl.value) {
          await commentsStore.deleteCommentImage(originalImageUrl.value)
        }
        newImageUrl = await commentsStore.uploadCommentImage(newImage)
      } else if (imageRemoved) {
        await commentsStore.deleteCommentImage(originalImageUrl.value)
        newImageUrl = null
      }

      await commentsStore.updateComment(editingCommentId.value, editingText.value, authStore.user, newImageUrl)

      editingCommentId.value = null
      editingText.value = ''
      editingImage.value = null
      originalImageUrl.value = null
      emit('reload-comments')
    } catch (error) {
      console.error('Failed to update comment:', error)
      toast.error('Failed to update comment.')
    }
  }

  function handleDeleteComment (commentId) {
    commentToDeleteId.value = commentId
    showDeleteModal.value = true
  }

  async function confirmDelete () {
    if (commentToDeleteId.value) {
      try {
        await commentsStore.deleteCommentAndReplies(commentToDeleteId.value)
        emit('reload-comments')
      } catch (error) {
        console.error('Failed to delete comment:', error)
        toast.error('Failed to delete comment.')
      } finally {
        showDeleteModal.value = false
        commentToDeleteId.value = null
      }
    }
  }

  function handleCopyCommentLink (commentId) {
    const url = `${window.location.origin}/post/${props.post.id}#${commentId}`
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Comment link copied to clipboard!')
    }).catch(() => {
      toast.error('Failed to copy link')
    })
  }
</script>

<template>
  <div class="bg mt-6 single-post-page__comments">
    <h3 class="text-h5 font-weight-bold mb-4">Comments</h3>
    <div class="notice">
      <b class="font-weight-bold mr-1">Remember:</b>
      <span>No unsolicited advice. Use "I" statements. Be supportive, not prescriptive.</span>
    </div>

    <!-- New Comment Input -->
    <div class="mt-6">
      <div class="d-flex">
        <v-avatar class="mr-3" color="grey-lighten-2" size="40">
          <v-img v-if="authStore.user?.photoURL" alt="User avatar" cover :src="authStore.user.photoURL" />
          <span v-else class="text-subtitle-1">{{ authStore.user?.displayName?.charAt(0).toUpperCase() || 'U' }}</span>
        </v-avatar>
        <div class="flex-grow-1">
          <div class="position-relative">
            <div id="new-comment-preview-target" />
            <MentionTextarea
              v-model="newComment"
              height="89"
              hide-details
              placeholder="Write a comment..."
              :users="users"
              @keydown.enter.prevent="submitComment"
            />
            <div class="d-flex emoji-picker-container">
              <ImgComment v-model="newCommentImage" :max-files="1" teleport-to="#new-comment-preview-target" />
              <EmojiPicker
                v-if="showEmojiPicker"
                class="emoji-picker"
                disable-skin-tones
                native
                @select="onSelectEmoji"
              />
              <div class="d-flex cursor-pointer" @click="showEmojiPicker = !showEmojiPicker" v-html="getIcon('smile')" />
            </div>
          </div>
          <div class="d-flex justify-start mt-2">
            <div v-if="isAuth" class="submit-btn position-relative" :class="[{ 'disabled': !newComment.trim() && !newCommentImage || isSubmitting }, { 'py-5 px-10': isSubmitting }]" @click="submitComment">
              <v-progress-circular
                v-if="isSubmitting"
                class="position-absolute"
                color="white"
                indeterminate
                size="20"
                style="left: 50%; top: 50%; transform: translate(-50%, -50%);"
                width="2"
              />
              <span v-else>Post</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Comments List -->
    <template v-if="comments.length > 0">
      <div v-for="comment in comments" :id="comment.id" :key="comment.id" class="comment-item mb-4 mt-7">
        <div class="d-flex">
          <v-avatar class="mr-3" color="grey-lighten-2" size="44">
            <v-img v-if="comment.user?.photoURL" alt="User avatar" cover :src="comment.user.photoURL" />
            <span v-else class="text-subtitle-1">{{ comment.user?.displayName?.charAt(0).toUpperCase() || 'U' }}</span>
          </v-avatar>
          <div class="flex-grow-1">
            <div class="comment-item__header d-flex align-center mb-1">
              <div class="d-block">
                <div class="d-flex align-center">
                  <span class="username font-weight-bold mr-2" :class="{'mobile-username': !smAndUp}">{{ comment.user?.displayName }}</span>
                  <span class="date text-caption text-grey">{{ timeTransformAgo(comment.createdAt) }}</span>
                </div>
                <div class="text-caption text-grey" :class="{'mobile-username': !smAndUp}">@{{ comment.user?.displayName?.replaceAll(' ', '_') }}</div>
              </div>
              <v-spacer />
              <CommentMenu :comment="comment" @copy-link="handleCopyCommentLink(comment.id)" @delete="handleDeleteComment(comment.id)" @edit="handleEditComment(comment)" />
            </div>

            <!-- Edit Comment Form -->
            <div v-if="editingCommentId === comment.id">
              <div :id="`edit-comment-preview-target-${comment.id}`" />
              <MentionTextarea
                v-model="editingText"
                height="89"
                hide-details
                placeholder="Edit your comment..."
                :users="users"
                @keydown.enter.prevent="handleUpdateComment"
              />
              <ImgComment v-model="editingImage" class="mt-2" :max-files="1" :teleport-to="`#edit-comment-preview-target-${comment.id}`" />
              <div class="d-flex justify-start mt-2">
                <div class="submit-btn" @click="handleUpdateComment">Save</div>
                <div class="cancel-btn ml-4" @click="editingCommentId = null">Cancel</div>
              </div>
            </div>

            <!-- Display Comment Content -->
            <div v-else class="comment-item__content mb-2">
              <div v-if="comment.imageUrl" class="my-2">
                <v-img class="rounded-lg" max-height="300" :src="comment.imageUrl" />
              </div>
              <div v-html="renderCommentText(comment.text)" />
            </div>

            <!-- Comment Actions -->
            <div class="comment-item__actions d-flex align-center mb-2">
              <div class="px-0 text-grey-darken-1 cursor-pointer d-flex align-center" @click="toggleLike(comment)">
                <div class="d-flex mr-3 icon-hover w-15" :class="{'liked stroke': comment.likes?.includes(authStore.user?.uid)}" v-html="getIcon('heart')" />
                {{ comment.likes?.length || 0 }}
              </div>
              <div class="px-0 d-flex cursor-pointer ml-3">
                <div class="d-flex mr-3 w-15" v-html="getIcon('message')" />
                {{ comment.replies?.length || 0 }}
              </div>
              <div v-if="isAuth && canInteract(comment.user.uid)" class="px-0 text-primary ml-5 hover-underline" style="font-size: 12px;" @click="showReplyInput[comment.id] = !showReplyInput[comment.id]">
                Reply
              </div>
            </div>

            <!-- Reply Input -->
            <div v-if="showReplyInput[comment.id]" class="mt-2 mb-4 ml-4">
              <div class="d-flex">
                <v-avatar class="mr-3" color="grey-lighten-2" size="40">
                  <v-img v-if="authStore.user?.photoURL" alt="User avatar" cover :src="authStore.user?.photoURL" />
                  <span v-else class="text-subtitle-1">{{ authStore.user?.displayName?.charAt(0).toUpperCase() || 'U' }}</span>
                </v-avatar>
                <div class="d-block w-100">
                  <div class="position-relative">
                    <div :id="`reply-preview-target-${comment.id}`" />
                    <MentionTextarea
                      :model-value="replyText[comment.id] || ''"
                      placeholder="Share your thoughts..."
                      :users="users"
                      @keydown.enter.prevent="submitReply(comment.id, $event)"
                      @update:model-value="val => replyText[comment.id] = val"
                    />
                    <div class="d-flex emoji-picker-container">
                      <ImgComment v-model="replyImage[comment.id]" :max-files="1" :teleport-to="`#reply-preview-target-${comment.id}`" />
                      <EmojiPicker
                        v-if="showReplyEmojiPicker[comment.id]"
                        class="emoji-picker"
                        disable-skin-tones
                        native
                        @select="emoji => onSelectReplyEmoji(emoji, comment.id)"
                      />
                      <div class="d-flex cursor-pointer" @click="showReplyEmojiPicker[comment.id] = !showReplyEmojiPicker[comment.id]" v-html="getIcon('smile')" />
                    </div>
                  </div>
                  <div class="d-flex mt-2">
                    <div v-if="isAuth" class="submit-btn position-relative" :class="{ 'disabled': !replyText[comment.id]?.trim() && !replyImage[comment.id] || isSubmitting }" @click="submitReply(comment.id, null)">
                      <span :class="{ 'opacity-0': isSubmitting }">Reply</span>
                      <v-progress-circular
                        v-if="isSubmitting"
                        class="position-absolute"
                        color="white"
                        indeterminate
                        size="20"
                        style="left: 50%; top: 50%; transform: translate(-50%, -50%);"
                        width="2"
                      />
                    </div>
                    <div class="cancel-btn ml-4" @click="showReplyInput[comment.id] = false">Cancel</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Replies -->
            <div v-if="comment.replies?.length" class="comment-item__replies ml-4 sm:ml-8 mt-2">
              <div v-for="reply in comment.replies" :id="reply.id" :key="reply.id" class="reply-item mb-3">
                <div class="d-flex align-start mb-1 w-100">
                  <v-avatar class="mr-2" color="grey-lighten-2" size="44">
                    <v-img v-if="reply.user?.photoURL" alt="User avatar" cover :src="reply.user.photoURL" />
                    <span v-else class="text-caption">{{ reply.user?.displayName?.charAt(0).toUpperCase() || 'U' }}</span>
                  </v-avatar>
                  <div class="d-flex flex-column w-100">
                    <div class="d-flex justify-space-between">
                      <div class="d-flex align-start">
                        <div class="d-block">
                          <div class="d-flex">
                            <span class="font-weight-bold text-body-2 mr-2" :class="{'mobile-username': !smAndUp}">{{ reply.user?.displayName }}</span>
                            <span class="date text-caption text-grey">{{ timeTransformAgo(reply.createdAt) }}</span>
                          </div>
                          <div class="text-caption text-grey" :class="{'mobile-username': !smAndUp}">@{{ reply.user?.displayName?.replaceAll(' ', '_') }}</div>
                        </div>
                      </div>
                      <CommentMenu :comment="reply" @copy-link="handleCopyCommentLink(reply.id)" @delete="handleDeleteComment(reply.id)" @edit="handleEditComment(reply)" />
                    </div>
                    <div v-if="editingCommentId === reply.id">
                      <div :id="`edit-comment-preview-target-${reply.id}`" />
                      <MentionTextarea
                        v-model="editingText"
                        height="89"
                        hide-details
                        placeholder="Edit your reply..."
                        :users="users"
                        @keydown.enter.prevent="handleUpdateComment"
                      />
                      <ImgComment v-model="editingImage" class="mt-2" :max-files="1" :teleport-to="`#edit-comment-preview-target-${reply.id}`" />
                      <div class="d-flex justify-start mt-2">
                        <div class="submit-btn" @click="handleUpdateComment">Save</div>
                        <div class="cancel-btn ml-4" @click="editingCommentId = null">Cancel</div>
                      </div>
                    </div>
                    <div v-else class="mt-2">
                      <div class="text-body-2 text-wrap" v-html="renderCommentText(reply.text)" />
                      <div v-if="reply.imageUrl" class="my-2">
                        <v-img class="rounded-lg" max-height="300" :src="reply.imageUrl" />
                      </div>
                      <div class="d-flex align-center mt-1">
                        <div class="px-0 d-flex hover-underline align-center cursor-pointer" @click="toggleLike(reply)">
                          <div class="d-flex mr-3 w-15" :class="{ 'liked stroke': reply.likes?.includes(authStore.user?.uid) }" v-html="getIcon('heart')" />
                          <span class="text-caption">{{ reply.likes?.length || 0 }}</span>
                        </div>
                        <div class="px-0 d-flex align-center cursor-pointer" @click="toggleLike(reply)">
                          <div class="d-flex mx-3 w-15" v-html="getIcon('message')" />
                          <span class="text-caption">{{ reply.replies?.length || 0 }}</span>
                        </div>
                        <div v-if="canInteract(reply.user.uid)" class="px-0 text-primary ml-3 hover-underline" style="font-size: 12px;" @click="showReplyInput[reply.id] = !showReplyInput[reply.id]">
                          Reply
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Nested Reply Input -->
                <div v-if="showReplyInput[reply.id]" class="mt-2 mb-4 ml-4">
                  <div class="d-flex">
                    <v-avatar class="mr-3" color="grey-lighten-2" size="40">
                      <v-img v-if="authStore.user?.photoURL" alt="User avatar" cover :src="authStore.user?.photoURL" />
                      <span v-else class="text-subtitle-1">{{ authStore.user?.displayName?.charAt(0).toUpperCase() || 'U' }}</span>
                    </v-avatar>
                    <div class="d-block w-100">
                      <div class="position-relative">
                        <div :id="`reply-preview-target-${reply.id}`" />
                        <MentionTextarea
                          :model-value="replyText[reply.id] || ''"
                          placeholder="Share your thoughts..."
                          :users="users"
                          @keydown.enter.prevent="submitReply(reply.id, $event)"
                          @update:model-value="val => replyText[reply.id] = val"
                        />
                        <div class="d-flex emoji-picker-container">
                          <ImgComment v-model="replyImage[reply.id]" :max-files="1" :teleport-to="`#reply-preview-target-${reply.id}`" />
                          <EmojiPicker
                            v-if="showReplyEmojiPicker[reply.id]"
                            class="emoji-picker"
                            disable-skin-tones
                            native
                            @select="emoji => onSelectReplyEmoji(emoji, reply.id)"
                          />
                          <div class="d-flex cursor-pointer" @click="showReplyEmojiPicker[reply.id] = !showReplyEmojiPicker[reply.id]" v-html="getIcon('smile')" />
                        </div>
                      </div>
                      <div class="d-flex mt-2">
                        <div v-if="isAuth" class="submit-btn position-relative" :class="{ 'disabled': !replyText[reply.id]?.trim() && !replyImage[reply.id] || isSubmitting }" @click="submitReply(reply.id, null)">
                          <span :class="{ 'opacity-0': isSubmitting }">Reply</span>
                          <v-progress-circular
                            v-if="isSubmitting"
                            class="position-absolute"
                            color="white"
                            indeterminate
                            size="20"
                            style="left: 50%; top: 50%; transform: translate(-50%, -50%);"
                            width="2"
                          />
                        </div>
                        <div class="cancel-btn ml-4" @click="showReplyInput[reply.id] = false">Cancel</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="reply.replies?.length" class="comment-item__replies ml-4 sm:ml-8 mt-2">
                  <div v-for="subReply in reply.replies" :id="subReply.id" :key="subReply.id" class="reply-item mb-3">
                    <div class="d-flex align-start mb-1 w-100">
                      <v-avatar class="mr-2" color="grey-lighten-2" size="44">
                        <v-img v-if="subReply.user?.photoURL" alt="User avatar" cover :src="subReply.user.photoURL" />
                        <span v-else class="text-caption">{{ subReply.user?.displayName?.charAt(0).toUpperCase() || 'U' }}</span>
                      </v-avatar>
                      <div class="d-flex flex-column w-100">
                        <div class="d-flex">
                          <div class="d-block">
                            <div class="d-flex">
                              <span class="font-weight-bold text-body-2 mr-2" :class="{'mobile-username': !smAndUp}">{{ subReply.user?.displayName }}</span>
                              <span class="date text-caption text-grey">{{ timeTransformAgo(subReply.createdAt) }}</span>
                            </div>
                            <div class="text-caption text-grey" :class="{'mobile-username': !smAndUp}">@{{ subReply.user?.displayName?.replaceAll(' ', '_') }}</div>
                          </div>
                          <v-spacer />
                          <CommentMenu :comment="subReply" @copy-link="handleCopyCommentLink(subReply.id)" @delete="handleDeleteComment(subReply.id)" @edit="handleEditComment(subReply)" />
                        </div>
                        <div v-if="editingCommentId === subReply.id">
                          <div :id="`edit-comment-preview-target-${subReply.id}`" />
                          <MentionTextarea
                            v-model="editingText"
                            height="89"
                            hide-details
                            placeholder="Edit your reply..."
                            :users="users"
                            @keydown.enter.prevent="handleUpdateComment"
                          />
                          <ImgComment v-model="editingImage" class="mt-2" :max-files="1" :teleport-to="`#edit-comment-preview-target-${subReply.id}`" />
                          <div class="d-flex justify-start mt-2">
                            <div class="submit-btn" @click="handleUpdateComment">Save</div>
                            <div class="cancel-btn ml-4" @click="editingCommentId = null">Cancel</div>
                          </div>
                        </div>
                        <div v-else class="mt-2">
                          <div class="text-body-2 text-wrap" v-html="renderCommentText(subReply.text)" />
                          <div v-if="subReply.imageUrl" class="my-2">
                            <v-img class="rounded-lg" max-height="300" :src="subReply.imageUrl" />
                          </div>
                          <div class="d-flex align-center mt-1">
                            <div class="px-0 d-flex align-center cursor-pointer" @click="toggleLike(subReply)">
                              <div class="d-flex mr-3 w-15" :class="{ 'liked stroke': subReply.likes?.includes(authStore.user?.uid) }" v-html="getIcon('heart')" />
                              <span class="text-caption">{{ subReply.likes?.length || 0 }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <div v-else class="d-flex flex-column align-center mt-12 no-comments pb-6">
      <div class="icon"><v-icon icon="mdi-comment-outline" /></div>
      <div class="title">There are no comments yet</div>
      <div class="sub-title">Write a comment and it appears here</div>
    </div>
    <ConfirmationModal
      confirm-text="Delete"
      message="Are you sure you want to delete this comment? This action cannot be undone."
      :show="showDeleteModal"
      title="Delete Comment"
      @cancel="showDeleteModal = false"
      @confirm="confirmDelete"
      @update:show="showDeleteModal = $event"
    />
  </div>
</template>

<style scoped>
.mobile-username {
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  vertical-align: text-bottom;
}
</style>
