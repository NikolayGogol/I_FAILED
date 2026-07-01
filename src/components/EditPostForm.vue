<script setup>
  import { QuillEditor } from '@vueup/vue-quill'
  import { computed, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import AdditionalInfoPost from '@/components/AdditionalInfoPost.vue'
  import FormInput from '@/components/FormInput.vue'
  import PrivacyPosting from '@/components/PrivacyPosting.vue'
  import { categories, recoveryTimeOptions } from '@/models/categories.js'
  import { useCreatePostStore } from '@/stores/create-post.js'
  import { useEditDraftStore } from '@/stores/edit-draft.js'
  import { useUpdatePostStore } from '@/stores/update-post.js'
  import { stripHtml } from '@/utils/html.js'
  import '@vueup/vue-quill/dist/vue-quill.snow.css'
  import '@/styles/pages/create-post.scss'

  const router = useRouter()
  const route = useRoute()
  const store = useCreatePostStore()
  const updatePostStore = useUpdatePostStore()
  const editDraftStore = useEditDraftStore()

  const props = defineProps({
    isDraft: {
      type: Boolean,
      default: false,
    },
  })
  const toast = useToast()
  const inputLength = 100
  const quillLength = 5000
  const isLoading = ref(false)

  const isFormValid = computed(() => {
    return (
      store.selectedCategories
      && store.title.trim() !== ''
      && stripHtml(store.whatHappened).trim() !== ''
    )
  })

  function handleTextChange (value, key) {
    if (stripHtml(value).length >= quillLength) {
      store[key] = value.slice(0, quillLength)
    }
  }

  function handleLessonTextChange (value, key) {
    if (stripHtml(value).length >= quillLength) {
      store.lessonLearned[key] = value.slice(0, quillLength)
    }
  }

  async function submitPost () {
    if (!isFormValid.value) return
    isLoading.value = true
    const { success } = await store.createPost()

    if (success) {
      if (props.isDraft && route.params.id) {
        await editDraftStore.deleteDraft(route.params.id)
      }
      isLoading.value = false
      sessionStorage.setItem('post-success-created', 'true')
      await router.push('/post-success-created')
    } else {
      isLoading.value = false
      toast.error('Failed to create post')
    }
  }

  async function updatePost () {
    if (!isFormValid.value) return
    isLoading.value = true
    const { success } = await updatePostStore.updatePost(route.params.id, store.$state)
    isLoading.value = false
    if (success) {
      toast.info('Post successfully updated')
      store.resetState()
      await router.push('/')
    } else {
      toast.error('Something went wrong')
    }
  }

  async function updateDraft () {
    if (!isFormValid.value) return
    isLoading.value = true
    const { success } = await editDraftStore.updateDraft(route.params.id, store.$state)
    isLoading.value = false
    if (success) {
      toast.info('Draft successfully updated')
      store.resetState()
      await router.push('/drafts')
    } else {
      toast.error('Something went wrong')
    }
  }

  async function revertToDraft () {
    if (!isFormValid.value) return
    isLoading.value = true
    const { success } = await store.saveToDraft()
    if (success) {
      await updatePostStore.deletePostDocumentOnly(route.params.id)
      isLoading.value = false
      toast.info('Post moved to drafts')
      store.resetState()
      await router.push('/drafts')
    } else {
      isLoading.value = false
      toast.error('Failed to move to drafts')
    }
  }
</script>

<template>
  <div class="create-post-page">
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
      <h5>Failure Details</h5>
      <div class="form-group">
        <label class="form-label">Title <span class="text-error">*</span></label>
        <FormInput
          v-model="store.title"
          class="form-input"
          :counter="inputLength"
          hide-details="auto"
          :maxlength="inputLength"
          persistent-counter
          placeholder="A brief, clear description of what happened"
        />
      </div>
      <div class="form-group">
        <label class="form-label">What happened? <span class="text-error">*</span></label>
        <div class="editor-wrapper">
          <QuillEditor
            v-model:content="store.whatHappened"
            content-type="html"
            placeholder="Describe the situation in detail..."
            theme="snow"
            @text-change="handleTextChange(store.whatHappened, 'whatHappened')"
          />
          <div class="char-counter">{{ store.whatHappened ? stripHtml(store.whatHappened).length : 0 }}/{{
            quillLength
          }}
          </div>
        </div>
      </div>
      <div class="form-group mt-6">
        <label for="">Category <span class="text-error">*</span></label>
        <v-select
          v-model="store.selectedCategories"
          class="form-field form-select"
          color="primary"
          hide-details
          item-title="label"
          :items="categories"
          placeholder="Choose a category"
          return-object
          variant="outlined"
        />
      </div>

      <v-divider class="mt-6" />

      <!-- RECOVERY FIELDS -->
      <h5 class="mt-6">Lesson learned</h5>
      <div class="form-group">
        <label class="form-label">What I learned</label>
        <div class="editor-wrapper">
          <QuillEditor
            v-model:content="store.lessonLearned.whatILearned"
            content-type="html"
            placeholder="A brief, clear description of what happened"
            theme="snow"
            @text-change="handleLessonTextChange(store.lessonLearned.whatILearned, 'whatILearned')"
          />
          <div class="char-counter">{{ store.lessonLearned.whatILearned ? stripHtml(store.lessonLearned.whatILearned).length : 0 }}/{{ quillLength }}</div>
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
            @text-change="handleLessonTextChange(store.lessonLearned.keyTakeaways, 'keyTakeaways')"
          />
          <div class="char-counter">{{ store.lessonLearned.keyTakeaways ? stripHtml(store.lessonLearned.keyTakeaways).length : 0 }}/{{ quillLength }}</div>
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
            @text-change="handleLessonTextChange(store.lessonLearned.whatIdDoDifferently, 'whatIdDoDifferently')"
          />
          <div class="char-counter">{{ store.lessonLearned.whatIdDoDifferently ? stripHtml(store.lessonLearned.whatIdDoDifferently).length : 0 }}/{{ quillLength }}</div>
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
            @text-change="handleLessonTextChange(store.lessonLearned.advice, 'advice')"
          />
          <div class="char-counter">{{ store.lessonLearned.advice ? stripHtml(store.lessonLearned.advice).length : 0 }}/{{ quillLength }}</div>
        </div>
      </div>

      <additional-info-post class="my-6">
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
          <div class="form-group mb-4">
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

      <v-divider />
      <PrivacyPosting />

      <div class="d-flex align-center justify-space-between mt-6">
        <v-btn
          v-if="props.isDraft"
          color="primary"
          :disabled="!isFormValid"
          :loading="isLoading"
          @click="submitPost"
        >Post</v-btn>
        <v-btn
          v-else
          color="primary"
          :disabled="!isFormValid"
          :loading="isLoading"
          @click="updatePost"
        >
          Update Post
        </v-btn>
        <p
          v-if="props.isDraft"
          class="text-primary fs-14 font-weight-semibold cursor-pointer text-decoration-underline"
          :class="{'opacity-60': !isFormValid, 'cursor-not-allowed': !isFormValid}"
          @click="updateDraft()"
        >Update Draft</p>
        <p
          v-else
          class="text-primary fs-14 font-weight-semibold cursor-pointer text-decoration-underline"
          :class="{'opacity-60': !isFormValid, 'cursor-not-allowed': !isFormValid}"
          @click="revertToDraft()"
        >Revert to Draft</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

</style>
