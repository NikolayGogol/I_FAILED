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
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import AdditionalInfoPost from '@/components/AdditionalInfoPost.vue'
  import FormInput from '@/components/FormInput.vue'
  import PrivacyPosting from '@/components/PrivacyPosting.vue'
  import { categories } from '@/models/categories.js'
  import { useCreatePostStore } from '@/stores/create-post.js'
  import { stripHtml } from '@/utils/html.js'
  import '@vueup/vue-quill/dist/vue-quill.snow.css'
  import '@/styles/pages/create-post.scss'

  const router = useRouter()
  const store = useCreatePostStore()
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

  async function submitPost () {
    if (!isFormValid.value) return
    isLoading.value = true
    const { success } = await store.createPost()

    if (success) {
      isLoading.value = false
      sessionStorage.setItem('post-success-created', 'true')
      await router.push('/post-success-created')
    } else {
      isLoading.value = false
      // Handle error, maybe show a notification
      console.error('Failed to create post')
    }
  }
  async function saveAsDraft () {
    if (!isFormValid.value) return
    const { success } = await store.saveToDraft()
    if (success) {
      toast.info('Post saved successfully')
      await router.push('/')
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
      <additional-info-post class="my-3" />
      <v-divider />
      <PrivacyPosting />
      <div class="d-flex align-center justify-space-between mt-6">
        <v-btn
          color="primary"
          :disabled="!isFormValid"
          :loading="isLoading"
          @click="submitPost"
        >Post</v-btn>
        <p
          class="text-primary fs-14 font-weight-semibold cursor-pointer text-decoration-underline"
          :class="{'opacity-60': !isFormValid, 'cursor-not-allowed': !isFormValid}"
          @click="saveAsDraft()"
        >Save as draft</p>
      </div>
    </div>
  </div>
</template>
