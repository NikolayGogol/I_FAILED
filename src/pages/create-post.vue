<route lang="json">
{
"meta": {
"layout": "MainLayout",
"auth": true
}
}
</route>
<script setup>
  import { computed, ref } from 'vue'
  import StepFive from '@/components/create-post/step-five.vue'
  import StepFour from '@/components/create-post/step-four.vue'
  import StepOne from '@/components/create-post/step-one.vue'
  import StepThree from '@/components/create-post/step-three.vue'
  import StepTwo from '@/components/create-post/step-two.vue'
  import '@/styles/pages/create-post.scss'
  const step = ref(1)

  const progress = computed(() => {
    return (step.value) * 20
  })

</script>
<template>
  <v-card class="rounded-xl elevation-1" max-width="800" width="100%">
    <v-btn
      class="mb-4"
      icon="mdi-arrow-left"
      variant="text"
    />
    <h1 class="text-h4 font-weight-bold mb-2">Share Your Failure</h1>
    <p class="text-grey-darken-1 mb-6">Help others learn from your experience</p>

    <div class="mb-10">
      <div class="d-flex justify-space-between mb-2 text-caption text-grey font-weight-bold">
        <span>Step {{ step }} of 5</span>
        <span>{{ progress }}% complete</span>
      </div>
      <v-progress-linear
        color="blue-grey-darken-3"
        height="6"
        :model-value="progress"
        rounded
      />
    </div>

    <v-window v-model="step">
      <v-window-item :value="1">
        <step-one />
      </v-window-item>
      <v-window-item :value="2">
        <step-two />
      </v-window-item>
      <v-window-item :value="3">
        <step-three />
      </v-window-item>
      <v-window-item :value="4">
        <step-four />
      </v-window-item>
      <v-window-item :value="5">
        <step-five />
      </v-window-item>
    </v-window>

    <v-card-actions class="px-0 mt-8">
      <v-btn
        class="text-none px-6 rounded-lg"
        :disabled="step === 1"
        prepend-icon="mdi-arrow-left"
        variant="tonal"
        @click="step--"
      >
        Back
      </v-btn>
      <v-spacer />
      <v-btn
        append-icon="mdi-arrow-right"
        class="text-none px-8 rounded-lg text-white"
        color="blue-grey-darken-3"
        :disabled="step === 5"
        size="large"
        variant="flat"
        @click="step++"
      >
        Next
      </v-btn>
    </v-card-actions>

  </v-card>
</template>
