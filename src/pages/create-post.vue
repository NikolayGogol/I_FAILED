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
  import { useRouter } from 'vue-router'
  import StepFive from '@/components/create-post/step-five.vue'
  import StepFour from '@/components/create-post/step-four.vue'
  import StepOne from '@/components/create-post/step-one.vue'
  import StepThree from '@/components/create-post/step-three.vue'
  import StepTwo from '@/components/create-post/step-two.vue'
  import { useCreatePostStore } from '@/stores/create-post.js'
  import '@/styles/pages/create-post.scss'
  const router = useRouter()
  const step = ref(1)
  const { createFakePost, createPost } = useCreatePostStore()
  const isLoading = ref(false)
  //
  const progress = computed(() => {
    return (step.value / 5) * 100
  })

  function fakePost () {
    isLoading.value = true
    createFakePost().then(() => {
      router.push('/post-success-created')
      sessionStorage.setItem('post-success-created', 'true')
    }).finally(() => {
      isLoading.value = false
    })
  }
  function submit () {
    isLoading.value = true
    createPost().then(() => {
      router.push('/post-success-created')
      sessionStorage.setItem('post-success-created', 'true')
    }).finally(() => {
      isLoading.value = false
    })
  }
</script>

<template>
  <div class="create-post-page">
    <v-card class="create-post-card" elevation="0">
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

      <div class="progress-section">
        <div class="progress-info">
          <span class="step-counter">Step {{ step }} of 5</span>
          <span class="progress-percentage">{{ Math.round(progress) }}% complete</span>
        </div>
        <v-progress-linear
          class="progress-bar"
          color="primary"
          height="8"
          :model-value="progress"
          rounded
        />
      </div>

      <v-window v-model="step" class="step-content">
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

      <div class="action-buttons">
        <v-btn
          v-if="step > 1"
          class="prev-btn"
          prepend-icon="mdi-arrow-left"
          variant="outlined"
          @click="step--"
        >
          Back
        </v-btn>
        <v-btn
          v-if="step === 5"
          append-icon="mdi-arrow-right"
          class="next-btn"
          color="primary"
          :loading="isLoading"
          variant="flat"
          @click="fakePost"
        >
          create fake post
        </v-btn>
        <v-btn
          append-icon="mdi-arrow-right"
          class="next-btn"
          color="primary"
          :loading="isLoading"
          variant="flat"
          @click="step < 5 ? step++ : submit()"
        >
          {{ step === 5 ? 'Publish' : 'Next' }}
        </v-btn>
      </div>
    </v-card>
  </div>
</template>
