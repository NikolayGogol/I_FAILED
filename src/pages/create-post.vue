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
  import AdditionalInfoPost from '@/components/additional-info-post.vue'
  import DatePickerInput from '@/components/DatePickerInput.vue'
  import FormInput from '@/components/FormInput.vue'
  import { categories, visibilityList } from '@/models/categories.js'
  import { useCreatePostStore } from '@/stores/create-post.js'
  import { stripHtml } from '@/utils/html.js'
  import '@vueup/vue-quill/dist/vue-quill.snow.css'
  import '@/styles/pages/create-post.scss'

  const router = useRouter()
  const store = useCreatePostStore()
  const triggerText = ref('')
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

  function addTag () {
    if (triggerText.value && !store.triggerTags.includes(triggerText.value)) {
      store.triggerTags.push(triggerText.value)
    }
    triggerText.value = ''
  }

  function removeTag (index) {
    store.triggerTags.splice(index, 1)
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
        <p class="page-subtitle">Help others learn from your experience</p>
      </div>
    </div>

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
      <h5 class="mt-6">Privacy & Posting</h5>
      <div class="setting-row mt-6">
        <div>
          <div class="setting-title">Post as Anonymous</div>
          <div class="setting-desc">Hide your identity on this post</div>
        </div>
        <v-switch
          v-model="store.isAnonymous"
          color="primary"
          density="compact"
          hide-details
          inset
        />
      </div>
      <div class="form-group my-4">
        <label class="form-label mt-1">Visibility</label>
        <v-select
          v-model="store.visibility"
          class="form-field form-select"
          color="primary"
          hide-details
          item-title="label"
          :items="visibilityList"
          placeholder="Choose an option"
          return-object
          variant="outlined"
        />
      </div>
      <div class="setting-row">
        <div class="setting-title">Allow comments</div>
        <v-switch
          v-model="store.allowComments"
          color="primary"
          density="compact"
          hide-details
          inset
        />
      </div>
      <div class="setting-row mt-4">
        <div class="setting-title">Enable trigger warning</div>
        <v-switch
          v-model="store.enableTriggerWarning"
          color="primary"
          density="compact"
          hide-details
          inset
        />
      </div>
      <div v-if="store.enableTriggerWarning" class="mt-2">
        <label for="">Trigger Warning</label>
        <div class="d-flex">
          <form-input
            v-model="triggerText"
            hide-details
            placeholder="e.g., Financial loss, Mental health"
            @keydown.enter.prevent="addTag()"
          />
          <div class="cancel-btn ml-6" @click="addTag">Add</div>
        </div>
        <ul class="selected-tags-list mt-2 ga-2">
          <li v-for="(tag, index) in store.triggerTags" :key="tag" class="tag-chip py-1 px-2">
            {{ tag }}
            <span class="remove-tag cursor-pointer" @click="removeTag(index)">×</span>
          </li>
        </ul>
      </div>
      <div class="form-group mt-6">
        <label class="form-label">Schedule post (optional)</label>
        <DatePickerInput
          v-model="store.scheduleDate"
          class="date-picker mt-1"
          enable-time
          :min-date="new Date()"
          :minutes-grid-step="10"
          :minutes-increment="10"
          placeholder="Select date"
        />
      </div>
      <div class="d-flex mt-6">
        <v-btn color="primary" :disabled="!isFormValid" :loading="isLoading" @click="submitPost">Post</v-btn>
      </div>
    </div>
  </div>
</template>
