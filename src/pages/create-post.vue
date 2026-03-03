<route lang="json">
{
  "meta": {
    "layout": "MainLayout",
    "auth": true
  }
}
</route>

<script setup>
  import { computed, reactive, ref, watch } from 'vue'
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
  const { createPost } = useCreatePostStore()
  const isLoading = ref(false)

  const stepsValidity = reactive({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
  })

  const progress = computed(() => (step.value / 5) * 100)
  const isValid = computed(() => stepsValidity[step.value])

  function updateStepValidity (stepNumber, isValid) {
    stepsValidity[stepNumber] = isValid
  }

  function submit () {
    isLoading.value = true
    createPost()
      .then(() => {
        router.push('/post-success-created')
        sessionStorage.setItem('post-success-created', 'true')
      })
      .finally(() => {
        isLoading.value = false
      })
  }

  function nextStep () {
    if (step.value < 5) {
      step.value++
    }
  }

  function prevStep () {
    if (step.value > 1) {
      step.value--
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

    <div class="progress-section">
      <div class="progress-info">
        <span class="step-counter">Step {{ step }} of 5</span>
        <span class="progress-percentage">{{ Math.round(progress) }}% complete</span>
      </div>
      <v-progress-linear
        class="progress-bar mt-1"
        color="primary"
        height="8"
        :model-value="progress"
        rounded
      />
    </div>

    <div class="post-card-content">
      <v-window v-model="step" class="step-content">
        <v-window-item :value="1">
          <step-one @is-valid="updateStepValidity(1, $event)" />
        </v-window-item>
        <v-window-item :value="2">
          <step-two @is-valid="updateStepValidity(2, $event)" />
        </v-window-item>
        <v-window-item :value="3">
          <step-three @is-valid="updateStepValidity(3, $event)" />
        </v-window-item>
        <v-window-item :value="4">
          <step-four @is-valid="updateStepValidity(4, $event)" />
        </v-window-item>
        <v-window-item :value="5">
          <step-five @is-valid="updateStepValidity(5, $event)" />
        </v-window-item>
      </v-window>

      <div class="action-buttons">
        <v-btn
          class="prev-btn rounded-lg"
          color="primary"
          :disabled="step === 1"
          prepend-icon="mdi-arrow-left"
          variant="outlined"
          @click="prevStep"
        >
          Back
        </v-btn>
        <v-btn
          append-icon="mdi-arrow-right"
          class="next-btn rounded-lg"
          color="primary"
          :disabled="!isValid"
          :loading="isLoading"
          variant="flat"
          @click="step < 5 ? nextStep() : submit()"
        >
          {{ step === 5 ? 'Publish' : 'Next' }}
        </v-btn>
      </div>
    </div>
  </div>
</template>
