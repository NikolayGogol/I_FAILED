<script setup>
  import { ref } from 'vue'
  import { useToast } from 'vue-toastification'
  import FormInput from '@/components/FormInput.vue'
  import { emotionTags, recoveryTimeOptions } from '@/models/categories.js'
  import { useCreatePostStore } from '@/stores/create-post'
  import '@/styles/components/form-input.scss'
  import '@/styles/components/create-post/step-four.scss'

  const store = useCreatePostStore()
  const toast = useToast()
  const emit = defineEmits(['isValid'])
  const newTag = ref('')
  emit('isValid', true)

  function addTag () {
    if (!newTag.value.trim()) {
      toast.error('You can not add empty tag')
      return
    }
    if (newTag.value.trim()) {
      store.stepFour.tags.push(newTag.value.trim())
      newTag.value = ''
    }
  }

  function removeTag (index) {
    store.stepFour.tags.splice(index, 1)
  }

  function handleEmotionChange (val) {
    if (val.length > 3) {
      // Remove the last added item if more than 3 are selected
      store.stepFour.emotionTags = val.slice(0, 3)
      toast.warning('You can choose max 3 emotion tags')
    }
  }
</script>

<template>
  <div class="step-four">
    <h2 class="step-title">Additional Information</h2>
    <p class="step-subtitle">Optional details to help others</p>

    <div class="form-group">
      <label class="form-label">Cost (optional)</label>
      <FormInput
        v-model="store.stepFour.cost"
        class="form-input"
        placeholder="Monetary or time, e.g., $5,000 or 6 months of time"
      />
    </div>

    <div class="form-group">
      <label class="form-label">Recovery time</label>
      <v-select
        v-model="store.stepFour.recoveryTime"
        class="form-field select"
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

    <div class="form-group mt-6">
      <label class="form-label">Emotion Tags</label>
      <p class="form-hint">You can choose max 3 tags</p>
      <v-chip-group
        v-model="store.stepFour.emotionTags"
        class="emotion-tags"
        column
        filter
        multiple
        return-object
        @update:model-value="handleEmotionChange"
      >
        <v-chip
          v-for="tag in emotionTags"
          :key="tag.value"
          class="emotion-chip"
          filter-icon="mdi-check"
          :value="tag"
          variant="outlined"
        >
          <span class="me-1">{{ tag.emoji }}</span> {{ tag.label }}
        </v-chip>
      </v-chip-group>
    </div>

    <div class="form-group mt-6">
      <label class="form-label">Tags</label>
      <p class="form-hint">Suggested from popular tags</p>
      <div v-if="store.stepFour.tags.length > 0" class="tags-container my-3">
        <v-chip
          v-for="(tag, index) in store.stepFour.tags"
          :key="index"
          class="tag-chip"
          closable
          @click:close="removeTag(index)"
        >
          {{ tag }}
        </v-chip>
      </div>

      <div class="add-tag-wrapper w-100 d-flex align-center">
        <FormInput
          v-model="newTag"
          class="add-tag-input"
          hide-details
          placeholder="Add tag"
          @keyup.enter="addTag"
        />
        <div
          class="add-tag-btn"
          :class="{disabled: !newTag}"
          @click="addTag"
        >
          Add
        </div>
      </div>
    </div>
  </div>
</template>
