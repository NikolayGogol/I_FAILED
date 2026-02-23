<script setup>
  import { QuillEditor } from '@vueup/vue-quill'
  import '@vueup/vue-quill/dist/vue-quill.snow.css'
</script>

<template>
  <div>

    <v-card-title class="text-h5 font-weight-bold pt-0">Lesson learned</v-card-title>
    <v-card-subtitle class="text-body-1 pb-6">Share what you learned from this experience</v-card-subtitle>
    <div class="mb-6">
      <label class="text-subtitle-2 font-weight-bold mb-1 d-block">What I learned *</label>
      <v-text-field
        maxlength="100"
        persistent-counter
        placeholder="A brief, clear description of what happened"
        rounded="lg"
        variant="outlined"
      />
    </div>
    <div class="mb-6">
      <label class="text-subtitle-2 font-weight-bold mb-1 d-block">Key takeaways</label>
      <QuillEditor theme="snow" />
    </div>
    <div class="mb-6">
      <label class="text-subtitle-2 font-weight-bold mb-1 d-block">What I'd do differently</label>
      <v-text-field
        append-inner-icon="mdi-calendar-blank-outline"
        hide-details
        placeholder="Select date"
        rounded="lg"
        variant="outlined"
      />
    </div>
    <div class="mb-6">
      <label class="text-subtitle-2 font-weight-bold mb-1 d-block">Advice for others</label>
      <QuillEditor theme="snow" />
    </div>
  </div>
</template>

<style scoped>

</style>
