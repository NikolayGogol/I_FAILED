<route lang="json">
{
  "meta": {
    "layout": "AuthMinLayout"
  }
}
</route>

<script setup>
  import { onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import axios from '@/axios'
  import '@/styles/pages/verify-new-user.scss'

  const route = useRoute()
  const router = useRouter()
  const loading = ref(true)
  const success = ref(false)
  const errorMessage = ref('')

  onMounted(async () => {
    const token = route.query.token

    if (!token) {
      errorMessage.value = 'No verification token found in the URL.'
      loading.value = false
      return
    }

    try {
      const response = await axios.post('/verifyUser', { token })
      if (response.data.status === 'success') {
        success.value = true
        sessionStorage.setItem('congrats', 'true')
        router.put('/congrats')
      } else {
        errorMessage.value = response.data.message || 'Verification failed.'
      }
    } catch (error) {
      errorMessage.value = error.response?.data?.message || 'An unexpected error occurred during verification.'
    } finally {
      loading.value = false
    }
  })
</script>

<template>
  <div class="verify-new-user-form">
    <h1 class="welcome-title">Email Verification</h1>

    <div v-if="loading" class="verify-prompt">
      <v-progress-circular color="primary" indeterminate />
      <p class="mt-3">Verifying your email...</p>
    </div>

    <div v-else>
      <v-alert
        v-if="success"
        class="mb-4"
        icon="mdi-check-circle"
        prominent
        type="success"
      >
        Congrats! Your account is created.
      </v-alert>
      <v-alert
        v-else
        class="mb-4"
        icon="mdi-alert-circle"
        prominent
        type="error"
      >
        {{ errorMessage || 'Failed to verify your email. The link might be invalid or expired.' }}
      </v-alert>
    </div>
  </div>
</template>
