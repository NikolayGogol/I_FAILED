<script setup>

</script>

<template>
  <div>
    <v-card-title class="text-h5 font-weight-bold pt-0">Additional Information</v-card-title>
    <v-card-subtitle class="text-body-1 pb-6">Optional details to help others</v-card-subtitle>

    <div class="mb-6">
      <label class="text-subtitle-2 font-weight-bold mb-1 d-block text-grey-darken-3">Cost (optional)</label>
      <v-text-field
        hide-details
        placeholder="Monetary or time, e.g., $5,000 or 6 months of time"
        rounded="lg"
        variant="outlined"
      />
    </div>

    <div class="mb-6">
      <label class="text-subtitle-2 font-weight-bold mb-1 d-block text-grey-darken-3">Recovery time</label>
      <v-select
        append-inner-icon="mdi-chevron-down"
        hide-details
        :items="['1 week', '1 month', '6 months']"
        placeholder="Choose an option"
        rounded="lg"
        variant="outlined"
      />
    </div>

    <div class="mb-6">
      <label class="text-subtitle-2 font-weight-bold mb-0 d-block text-grey-darken-3">Emotion Tags</label>
      <p class="text-caption text-grey mb-2">You can choose max 3 tags</p>
      <v-chip-group filter multiple>
        <v-chip class="px-4 py-4" rounded="lg" style="border-color: #e0e0e0;" variant="outlined">
          <span class="me-1">😔</span> Painful
        </v-chip>
        <v-chip class="px-4 py-4" rounded="lg" style="border-color: #e0e0e0;" variant="outlined">
          <span class="me-1">💡</span> Learning
        </v-chip>
        <v-chip class="px-4 py-4" rounded="lg" style="border-color: #e0e0e0;" variant="outlined">
          <span class="me-1">😳</span> Embarrassing
        </v-chip>
      </v-chip-group>
    </div>

    <div class="mb-2">
      <label class="text-subtitle-2 font-weight-bold mb-0 d-block text-grey-darken-3">Tags</label>
      <p class="text-caption text-grey mb-2">Suggested from popular tags</p>

      <div class="d-flex flex-wrap gap-2 mb-3">
        <v-chip class="ma-1" closable color="#2c3e50" theme="dark">Business</v-chip>
        <v-chip class="ma-1" closable color="#2c3e50" theme="dark">Finance</v-chip>
      </div>

      <div class="d-flex align-center">
        <v-text-field
          density="comfortable"
          hide-details
          placeholder="Add tag"
          rounded="s-lg"
          variant="outlined"
        />
        <v-btn
          class="rounded-e-lg px-6 text-none"
          color="#34495e"
          elevation="0"
          height="48"
          theme="dark"
        >
          Add
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
