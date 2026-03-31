<route lang="json">
{
  "meta": {
    "layout": "AuthMinLayout"
  }
}
</route>

<script setup>
  import { onMounted, ref } from 'vue'
  import {  useRouter } from 'vue-router'
  import '@/styles/pages/verify-new-user.scss'

  const router = useRouter()

  const loading = ref(true)
  const success = ref(false)
  const errorMessage = ref('')

  onMounted(async () => {
    try {
      success.value = true
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error) {
      console.error('Error verifying email change:', error)
    } finally {
      loading.value = false
    }
  })
</script>

<template>
  <div class="verify-new-user-form">
    <h1 class="welcome-title">Verifying Email Change</h1>

    <div v-if="loading" class="verify-prompt">
      <v-progress-circular color="primary" indeterminate />
      <p class="mt-3">Finalizing your email update...</p>
    </div>

    <div v-else>
      <v-alert
        v-if="success"
        class="mb-4"
        icon="mdi-check-circle"
        prominent
        type="success"
      >
        Your email has been successfully updated! You will be redirected to the login page shortly.
      </v-alert>
      <v-alert
        v-else
        class="mb-4"
        icon="mdi-alert-circle"
        prominent
        type="error"
      >
        {{ errorMessage }}
      </v-alert>
    </div>
  </div>
</template>
