<route lang="json">
{
  "meta": {
    "layout": "AuthLayout"
  }
}
</route>

<script setup>
  import { onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import api from '@/axios'

  const route = useRoute()
  const router = useRouter()
  const loading = ref(true)
  const success = ref(false)
  const error = ref('')

  onMounted(async () => {
    const token = route.query.token
    if (!token) {
      error.value = 'Invalid verification link.'
      loading.value = false
      return
    }

    try {
      await api.post('verifyEmailChange', { token })
      success.value = true
      setTimeout(() => {
        router.push('/profile')
      }, 3000)
    } catch (err) {
      console.error(err)
      error.value = err.response?.data?.error || 'Failed to verify email change.'
    } finally {
      loading.value = false
    }
  })
</script>

<template>
  <v-container class="fill-height justify-center">
    <v-card class="pa-8 text-center" max-width="400" width="100%">
      <div v-if="loading">
        <v-progress-circular class="mb-4" color="primary" indeterminate size="64" />
        <h2 class="text-h5 font-weight-bold">Verifying...</h2>
        <p class="text-medium-emphasis mt-2">Please wait while we verify your new email address.</p>
      </div>

      <div v-else-if="success">
        <v-icon class="mb-4" color="success" icon="mdi-check-circle" size="64" />
        <h2 class="text-h5 font-weight-bold text-success">Email Verified!</h2>
        <p class="text-medium-emphasis mt-2">Your email address has been successfully updated.</p>
        <p class="text-caption mt-4">Redirecting to profile...</p>
        <v-btn class="mt-4" color="primary" to="/profile" variant="text">
          Go to Profile
        </v-btn>
      </div>

      <div v-else>
        <v-icon class="mb-4" color="error" icon="mdi-alert-circle" size="64" />
        <h2 class="text-h5 font-weight-bold text-error">Verification Failed</h2>
        <p class="text-medium-emphasis mt-2">{{ error }}</p>
        <v-btn class="mt-6" color="primary" to="/profile" variant="tonal">
          Back to Profile
        </v-btn>
      </div>
    </v-card>
  </v-container>
</template>
