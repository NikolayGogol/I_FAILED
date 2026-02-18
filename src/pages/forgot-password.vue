<template>
  <div class="forgot-password-page">
    <div class="forgot-password-header">
      <span class="forgot-password-title">Forgot password flow</span>
      <span class="forgot-password-version">0. forgot password</span>
    </div>

    <div class="forgot-password-container">
      <div class="forgot-password-left">
        <div class="placeholder-image">
          <!-- Placeholder for image/illustration -->
        </div>
      </div>

      <div class="forgot-password-right">
        <div class="forgot-password-form">
          <router-link class="back-link" to="/login">
            <v-icon size="small">mdi-arrow-left</v-icon>
            Back
          </router-link>

          <h1 class="welcome-title">Forgot password?</h1>

          <div class="reset-prompt">
            <span>Lorem ipsum dolor sit amet, consectetur.</span>
          </div>

          <v-form class="forgot-password-form-fields" @submit.prevent="handleSendCode">
            <v-text-field
              v-model="email"
              class="form-field"
              density="comfortable"
              hide-details="auto"
              label="Email"
              placeholder="example@gmail.com"
              required
              type="email"
              variant="outlined"
            />

            <v-btn
              block
              class="send-code-btn"
              :disabled="loading"
              :loading="loading"
              size="large"
              type="submit"
            >
              Send code
            </v-btn>
          </v-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import { useAuthStore } from '@/stores/auth'
  import '@/styles/pages/forgot-password.scss'

  const router = useRouter()
  const toast = useToast()
  const authStore = useAuthStore()

  const email = ref('')
  const loading = ref(false)

  async function handleSendCode () {
    loading.value = true
    try {
      await authStore.sendPasswordResetOTP(email.value)
      toast.success('Verification code sent to your email!')
      // Redirect to verify page with email
      setTimeout(() => {
        router.push({ path: '/otp', query: { email: email.value } })
      }, 1000)
    } catch (error) {
      toast.error(authStore.error || 'Failed to send verification code. Please try again.')
      console.error('Send code error:', error)
    } finally {
      loading.value = false
    }
  }
</script>

<style scoped>
/* Styles are imported from forgot-password.scss */
</style>
