<script setup>
  import { ref } from 'vue'
  import FormInput from '@/components/FormInput.vue'
  import { emotionTags, recoveryTimeOptions } from '@/models/categories.js'
  import { useCreatePostStore } from '@/stores/create-post'
  import '@/styles/components/form-input.scss'
  import '@/styles/components/create-post/step-four.scss'

  const store = useCreatePostStore()
  const newTag = ref('')

  function addTag () {
    if (newTag.value.trim()) {
      store.stepFour.tags.push(newTag.value.trim())
      newTag.value = ''
    }
  }

  function removeTag (index) {
    store.stepFour.tags.splice(index, 1)
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
        append-inner-icon="mdi-chevron-down"
        class="form-field"
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

    <div class="form-group">
      <label class="form-label">Emotion Tags</label>
      <v-chip-group
        v-model="store.stepFour.emotionTags"
        class="emotion-tags"
        column
        filter
        multiple
        return-object
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

    <div class="form-group">
      <label class="form-label">Tags</label>
      <p class="form-hint">Suggested from popular tags</p>
      <div v-if="store.stepFour.tags.length > 0" class="tags-container">
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

      <div class="add-tag-wrapper">
        <FormInput
          v-model="newTag"
          class="add-tag-input"
          placeholder="Add tag"
          @keydown.enter.prevent="addTag"
        />
        <v-btn
          class="add-tag-btn"
          color="primary"
          elevation="0"
          height="44"
          variant="flat"
          @click="addTag"
        >
          Add
        </v-btn>
      </div>
    </div>
  </div>
</template>
