<route lang="json">
{
  "meta": {
    "layout": "AuthMinLayout"
  }
}
</route>

<template>
  <div class="set-password-form">
    <router-link class="back-link" to="/otp">
      <v-icon size="small">mdi-arrow-left</v-icon>
      Back
    </router-link>

    <h1 class="welcome-title font-weight-semibold">Set password</h1>

    <div class="reset-prompt">
      <span>Enter your new password below.</span>
    </div>

    <v-form ref="form" class="set-password-form-fields" @submit.prevent="handleSetPassword">
      <form-input
        v-model="password"
        class="form-field"
        density="comfortable"
        hide-details="auto"
        label="New Password"
        placeholder="Enter new password"
        required
        :rules="passwordRules"
        type="password"
        variant="outlined"
      />

      <form-input
        v-model="confirmPassword"
        class="form-field"
        density="comfortable"
        hide-details="auto"
        label="Confirm Password"
        placeholder="Confirm new password"
        required
        :rules="confirmPasswordRules"
        type="password"
        variant="outlined"
      />

      <div class="d-flex justify-center mt-6">
        <v-btn
          class="reset-password-btn rounded-lg"
          color="primary"
          :disabled="loading"
          :loading="loading"
          size="large"
          type="submit"
        >
          Reset password
        </v-btn>
      </div>
    </v-form>
  </div>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import FormInput from '@/components/FormInput.vue'
  import { useAuthStore } from '@/stores/auth'
  import '@/styles/pages/set-password.scss'

  const router = useRouter()
  const route = useRoute()
  const toast = useToast()
  const authStore = useAuthStore()

  const form = ref(null)
  const password = ref('')
  const confirmPassword = ref('')
  const loading = ref(false)

  const email = computed(() => route.query.email || '')
  const code = computed(() => route.query.code || '')

  const passwordRules = [
    v => !!v || 'Password is required',
    v => v.length >= 6 || 'Password must be at least 6 characters',
  ]

  const confirmPasswordRules = [
    v => !!v || 'Confirm Password is required',
    v => v === password.value || 'Passwords do not match',
  ]

  async function handleSetPassword () {
    const { valid } = await form.value.validate()
    if (!valid) return

    if (!email.value || !code.value) {
      toast.error('Invalid session. Please start over.')
      router.push('/forgot-password')
      return
    }

    loading.value = true
    try {
      // CORRECT: Calling the right function from the store
      await authStore.resetPassword(email.value, code.value, password.value)
      toast.success('Password reset successfully!')
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (error) {
      // The axios interceptor will show the error toast
      console.error('Set password error:', error)
    } finally {
      loading.value = false
    }
  }
</script>

<style scoped>
/* Styles are imported from set-password.scss */
</style>
