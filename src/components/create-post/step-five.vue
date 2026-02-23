<script setup>

</script>

<template>
  <div>

    <v-card-title class="text-h5 font-weight-bold pt-0 px-0 mb-6">Privacy & Posting</v-card-title>

    <v-sheet class="pa-4 mb-4 d-flex align-center justify-space-between bg-grey-lighten-5 border-light" rounded="lg">
      <div>
        <div class="text-subtitle-2 font-weight-bold">Post as Anonymous</div>
        <div class="text-caption text-grey">Hide your identity on this post</div>
      </div>
      <v-switch color="primary" density="compact" hide-details inset />
    </v-sheet>

    <div class="mb-6">
      <label class="text-subtitle-2 font-weight-bold mb-1 d-block">Visibility</label>
      <v-select
        append-inner-icon="mdi-chevron-down"
        hide-details
        placeholder="Choose an option"
        rounded="lg"
        variant="outlined"
      />
    </div>

    <v-sheet class="pa-4 mb-4 d-flex align-center justify-space-between bg-grey-lighten-5 border-light" rounded="lg">
      <div class="text-subtitle-2 font-weight-bold">Allow comments</div>
      <v-switch
        color="primary"
        density="compact"
        hide-details
        inset
        model-value="true"
      />
    </v-sheet>

    <v-sheet class="pa-4 mb-6 d-flex align-center justify-space-between bg-grey-lighten-5 border-light" rounded="lg">
      <div class="text-subtitle-2 font-weight-bold">Enable trigger warning</div>
      <v-switch color="primary" density="compact" hide-details inset />
    </v-sheet>

    <div>
      <label class="text-subtitle-2 font-weight-bold mb-1 d-block">Schedule post (optional)</label>
      <v-text-field
        append-inner-icon="mdi-calendar-blank-outline"
        hide-details
        placeholder="Select date"
        rounded="lg"
        variant="outlined"
      />
    </div>

  </div>
</template>

<style scoped>

</style>
