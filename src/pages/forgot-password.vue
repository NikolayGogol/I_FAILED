<route lang="json">
{
  "meta": {
    "layout": "AuthMinLayout"
  }
}
</route>

<template>
  <div class="forgot-password-form">
    <router-link class="back-link" to="/login">
      <v-icon size="small">mdi-arrow-left</v-icon>
      Back
    </router-link>

    <h1 class="welcome-title font-weight-semibold">Forgot password?</h1>

    <div class="reset-prompt">
      <span>Lorem ipsum dolor sit amet, consectetur.</span>
    </div>

    <v-form ref="form" class="forgot-password-form-fields" @submit.prevent="handleSendCode">
      <form-input
        v-model="email"
        class="form-field"
        density="comfortable"
        hide-details="auto"
        label="Email"
        placeholder="example@gmail.com"
        required
        :rules="emailRules"
        type="email"
        variant="outlined"
      />

      <div class="d-flex justify-center mt-10">
        <v-btn
          class="send-code-btn rounded-lg"
          color="primary"
          :disabled="loading"
          :loading="loading"
          size="large"
          type="submit"
        >
          Send code
        </v-btn>
      </div>
    </v-form>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import FormInput from '@/components/FormInput.vue'
  import { useAuthStore } from '@/stores/auth'
  import '@/styles/pages/forgot-password.scss'

  const router = useRouter()
  const toast = useToast()
  const authStore = useAuthStore()

  const form = ref(null)
  const email = ref('')
  const loading = ref(false)

  const emailRules = [
    v => !!v || 'Email is required',
    v => /.+@.+\..+/.test(v) || 'E-mail must be valid',
  ]

  async function handleSendCode () {
    const { valid } = await form.value.validate()
    if (!valid) return

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
