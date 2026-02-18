<script setup>
  import { onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import axios from '@/axios' // Assuming your axios instance is configured here

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
  <div class="verify-page">
    <v-container fill-height>
      <v-row align="center" justify="center">
        <v-col cols="12" md="6" sm="8">
          <v-card-title class="headline justify-center">
            Email Verification
          </v-card-title>
          <div v-if="loading">
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
              Congrats! Your account is created
              <router-link to="/login">go to login</router-link>
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
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
  .verify-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f5f5f5; /* Light background for the page */
  }
</style>
