<route lang="json">
{
"meta": {
"layout": "MainLayout",
"auth": true
}
}
</route>
<script setup>
  import { QuillEditor } from '@vueup/vue-quill'
  import { serverTimestamp } from 'firebase/firestore'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import { recoveryTimeOptions } from '@/models/categories.js'
  import { noAvatar } from '@/models/no-data.js'
  import { useAuthStore } from '@/stores/auth.js'
  import { useCreatePostStore } from '@/stores/create-post.js'
  import { useRecoveryPostStore } from '@/stores/recovery-post.js'
  import { useSinglePostStore } from '@/stores/single-post/single-post.js'
  import { stripHtml } from '@/utils/html.js'
  import '@/styles/pages/create-post.scss'
  import '@/styles/pages/recovery-post.scss'
  import '@vueup/vue-quill/dist/vue-quill.snow.css'
  //
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const store = useCreatePostStore()
  const recoveryPostStore = useRecoveryPostStore()
  const quillLength = 5000
  const singlePostStore = useSinglePostStore()
  const authStore = useAuthStore()
  //
  singlePostStore.getPostById(route.params.id)
    .then(res => {
      store.emotionTags = res.emotionTags
      store.tags = res.tags
      store.isAnonymous = res.isAnonymous
      store.visibility = res.visibility
      store.allowComments = res.allowComments
      store.enableTriggerWarning = res.enableTriggerWarning
      store.triggerTags = store.enableTriggerWarning ? res.triggerTags : []
      store.scheduleDate = store.scheduledAt ? res.scheduledAt : null
      if (res.lessonLearned) router.push('/profile')
    })

  function handleTextChange (value, key) {
    if (stripHtml(value).length >= quillLength) {
      store[key] = value.slice(0, quillLength)
    }
  }

  function getFieldsWithValues (obj) {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, value]) => {
        if (typeof value === 'boolean') return true
        if (Array.isArray(value)) return value.length > 0
        return value !== null && value !== undefined && value !== ''
      }),
    )
  }

  async function recoveryPost () {
    const scheduleDate = store.scheduleDate
    const isScheduled = !!scheduleDate

    const obj = {
      id: route.params.id,
      ...getFieldsWithValues(store.$state),
      status: isScheduled ? 'scheduled' : 'published',
      scheduledAt: isScheduled ? new Date(scheduleDate) : null,
      publishedAt: isScheduled ? null : serverTimestamp(),
      user: store.isAnonymous
        ? {
          displayName: 'Anonymous',
          photoURL: noAvatar,
        }
        : {
          displayName: authStore.user.displayName,
          photoURL: authStore.user.photoURL,
        } }
    obj.lessonLearned.createdAt = serverTimestamp()
    const response = await recoveryPostStore.recoveryPost(obj)
    if (response.success) {
      toast.success('Post recovered successfully!')
      store.resetState()
      await router.push('/profile')
    } else {
      toast.error(response.error || 'Failed to recover post')
    }
  }
</script>

<template>
  <div class="create-post-page recovery-post-page">
    <div class="header-section">
      <v-btn
        class="back-btn"
        icon="mdi-arrow-left"
        variant="text"
        @click="$router.back()"
      />
      <div class="title-wrapper">
        <h1 class="page-title">Share Your Failure</h1>
        <p class="page-subtitle d-none d-sm-block">Help others learn from your experience</p>
      </div>
    </div>
    <p class="page-subtitle d-sm-none">Help others learn from your experience</p>
    <div class="post-card-content mt-6">
      <h5>Lesson learned</h5>
      <div class="form-group">
        <label class="form-label">What I learned <span class="text-error">*</span></label>
        <div class="editor-wrapper">
          <QuillEditor
            v-model:content="store.lessonLearned.whatILearned"
            content-type="html"
            placeholder="A brief, clear description of what happened"
            theme="snow"
            @text-change="handleTextChange(store.lessonLearned.whatILearned, 'whatILearned')"
          />
          <div class="char-counter">{{ stripHtml(store.lessonLearned.whatILearned).length }}/{{ quillLength }}</div>
        </div>
      </div>
      <div class="form-group mt-6">
        <label class="form-label">Key takeaways</label>
        <div class="editor-wrapper">
          <QuillEditor
            v-model:content="store.lessonLearned.keyTakeaways"
            content-type="html"
            placeholder="Describe the situation in detail..."
            theme="snow"
            @text-change="handleTextChange(store.lessonLearned.keyTakeaways, 'keyTakeaways')"
          />
          <div class="char-counter">{{ stripHtml(store.lessonLearned.keyTakeaways).length }}/{{ quillLength }}</div>
        </div>
      </div>
      <div class="form-group mt-6">
        <label class="form-label">What I'd do differently</label>
        <div class="editor-wrapper">
          <QuillEditor
            v-model:content="store.lessonLearned.whatIdDoDifferently"
            content-type="html"
            placeholder="Describe the situation in detail..."
            theme="snow"
            @text-change="handleTextChange(store.lessonLearned.whatIdDoDifferently, 'whatIdDoDifferently')"
          />
          <div class="char-counter">{{ stripHtml(store.lessonLearned.whatIdDoDifferently).length }}/{{
            quillLength
          }}
          </div>
        </div>
      </div>
      <div class="form-group mt-6">
        <label class="form-label">Advice for others</label>
        <div class="editor-wrapper">
          <QuillEditor
            v-model:content="store.lessonLearned.advice"
            content-type="html"
            placeholder="Describe the situation in detail..."
            theme="snow"
            @text-change="handleTextChange(store.lessonLearned.advice, 'advice')"
          />
          <div class="char-counter">{{ stripHtml(store.lessonLearned.advice).length }}/{{ quillLength }}</div>
        </div>
      </div>
      <v-divider class="mt-6" />
      <additional-info-post :always-open="true" class="mt-4">
        <template #external-fields>
          <div class="form-group">
            <label class="form-label">Cost (optional)</label>
            <FormInput
              v-model.number="store.lessonLearned.cost"
              class="form-input"
              persistent-counter
              placeholder="Monetary or time, e.g., $5,000 or 6 months of time"
              type="number"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Recovery time</label>
            <v-select
              v-model="store.lessonLearned.recoveryTime"
              class="form-field select"
              color="primary"
              density="comfortable"
              hide-details="auto"
              item-title="title"
              item-value="value"
              :items="recoveryTimeOptions"
              placeholder="Choose an option"
              return-object
              variant="outlined"
            />
          </div>
        </template>
      </additional-info-post>
      <v-divider class="mt-3" />
      <PrivacyPosting />
      <div class="d-flex justify-end mt-6">
        <div class="submit-btn" @click="recoveryPost">Post</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

</style>
