<script setup>
  import '@/styles/components/form-input.scss'
  import '@/styles/components/create-post/step-four.scss'
</script>

<template>
  <div class="step-four">
    <h2 class="step-title">Additional Information</h2>
    <p class="step-subtitle">Optional details to help others</p>

    <div class="form-group">
      <label class="form-label">Cost (optional)</label>
      <v-text-field
        class="form-input"
        hide-details
        placeholder="Monetary or time, e.g., $5,000 or 6 months of time"
        variant="outlined"
      />
    </div>

    <div class="form-group">
      <label class="form-label">Recovery time</label>
      <v-select
        append-inner-icon="mdi-chevron-down"
        class="form-input"
        hide-details
        :items="['1 week', '1 month', '6 months']"
        placeholder="Choose an option"
        variant="outlined"
      />
    </div>

    <div class="form-group">
      <label class="form-label">Emotion Tags</label>
      <p class="form-hint">You can choose max 3 tags</p>
      <v-chip-group class="emotion-tags" filter multiple>
        <v-chip class="emotion-chip" variant="outlined">
          <span class="me-1">😔</span> Painful
        </v-chip>
        <v-chip class="emotion-chip" variant="outlined">
          <span class="me-1">💡</span> Learning
        </v-chip>
        <v-chip class="emotion-chip" variant="outlined">
          <span class="me-1">😳</span> Embarrassing
        </v-chip>
      </v-chip-group>
    </div>

    <div class="form-group">
      <label class="form-label">Tags</label>
      <p class="form-hint">Suggested from popular tags</p>

      <div class="tags-container">
        <v-chip class="tag-chip" closable>Business</v-chip>
        <v-chip class="tag-chip" closable>Finance</v-chip>
      </div>

      <div class="add-tag-wrapper">
        <v-text-field
          class="add-tag-input form-input"
          density="comfortable"
          hide-details
          placeholder="Add tag"
          variant="outlined"
        />
        <v-btn
          class="add-tag-btn"
          elevation="0"
        >
          Add
        </v-btn>
      </div>
    </div>
  </div>
</template>
