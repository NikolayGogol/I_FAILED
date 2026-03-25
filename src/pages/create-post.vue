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
  import { useRoute, useRouter } from 'vue-router'
  import AdditionalInfoPost from '@/components/AdditionalInfoPost.vue'
  import FormInput from '@/components/FormInput.vue'
  import PrivacyPosting from '@/components/PrivacyPosting.vue'
  import { categories } from '@/models/categories.js'
  import { useCreatePostStore } from '@/stores/create-post.js'
  import { useUpdatePostStore } from '@/stores/update-post.js'
  import { stripHtml } from '@/utils/html.js'
  import { useToast } from 'vue-toastification'
  import '@vueup/vue-quill/dist/vue-quill.snow.css'
  import '@/styles/pages/create-post.scss'

  const router = useRouter()
  const route = useRoute()
  const store = useCreatePostStore()
  const updatePostStore = useUpdatePostStore()
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
    isLoading.value = false
    if (success) {
      router.push('/post-success-created')
      sessionStorage.setItem('post-success-created', 'true')
    } else {
      // Handle error, maybe show a notification
      console.error('Failed to create post')
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
      router.push('/')
    } else {
      toast.error('Something went wrong')
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
      <div class="d-flex mt-6">
        <v-btn
          v-if="!route?.params?.id"
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
        >Update Post</v-btn>
      </div>
    </div>
  </div>
</template>
