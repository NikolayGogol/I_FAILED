<script setup>
  import { QuillEditor } from '@vueup/vue-quill'
  import '@vueup/vue-quill/dist/vue-quill.snow.css'
</script>

<template>
  <div>

    <v-card-title class="text-h5 font-weight-bold pt-0">Failure Details</v-card-title>
    <v-card-subtitle class="text-body-1 pb-6">Tell us what happened</v-card-subtitle>

    <div class="mb-6">
      <label class="text-subtitle-2 font-weight-bold mb-2 d-block">Images</label>
      <div
        class="d-flex flex-column align-center justify-center pa-8 rounded-lg"
        style="border: 2px dashed #e0e0e0; min-height: 200px;"
      >
        <v-icon color="grey-lighten-1" size="48">mdi-camera-outline</v-icon>
        <div class="text-body-1 font-weight-medium mt-2">Upload images</div>
        <div class="text-caption text-grey mb-4">recommended size 1200x1100 px</div>
        <v-btn
          class="text-none px-6"
          color="#34495e"
          prepend-icon="mdi-plus"
          rounded="lg"
          theme="dark"
        >
          Upload image
        </v-btn>
      </div>
    </div>

    <div class="mb-6">
      <label class="text-subtitle-2 font-weight-bold mb-1 d-block">Title *</label>
      <v-text-field
        maxlength="100"
        persistent-counter
        placeholder="A brief, clear description of what happened"
        rounded="lg"
        variant="outlined"
      />
    </div>

    <div class="mb-6">
      <label class="text-subtitle-2 font-weight-bold mb-1 d-block">What happened? *</label>
      <QuillEditor theme="snow" />
    </div>

    <div class="mb-6">
      <label class="text-subtitle-2 font-weight-bold mb-1 d-block">When did it happen? *</label>
      <v-text-field
        append-inner-icon="mdi-calendar-blank-outline"
        hide-details
        placeholder="Select date"
        rounded="lg"
        variant="outlined"
      />
    </div>
    <div class="mb-6">
      <label class="text-subtitle-2 font-weight-bold mb-1 d-block">What went wrong?</label>
      <QuillEditor theme="snow" />
    </div>
    <div class="mb-6">
      <label class="text-subtitle-2 font-weight-bold mb-1 d-block">How did it feel?</label>
      <QuillEditor theme="snow" />
    </div>
  </div>
</template>

<style scoped>

</style>
