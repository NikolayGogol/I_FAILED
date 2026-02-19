<route lang="json">
{
  "meta": {
    "layout": "AuthLayout"
  }
}
</route>

<template>
  <div class="set-password-form">
    <router-link class="back-link" to="/otp">
      <v-icon size="small">mdi-arrow-left</v-icon>
      Back
    </router-link>

    <h1 class="welcome-title">Set password</h1>

    <div class="set-password-prompt">
      <span>Lorem ipsum dolor sit amet consectetur</span>
    </div>

    <v-form class="set-password-form-fields" @submit.prevent="handleSetPassword">
      <v-text-field
        v-model="password"
        class="form-field"
        density="comfortable"
        hide-details="auto"
        label="Password"
        placeholder="Enter new password"
        required
        :type="showPassword ? 'text' : 'password'"
        variant="outlined"
      >
        <template #append-inner>
          <v-btn
            icon
            size="small"
            variant="text"
            @click="showPassword = !showPassword"
          >
            <v-icon>{{ showPassword ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
          </v-btn>
        </template>
      </v-text-field>

      <v-btn
        block
        class="reset-password-btn"
        :disabled="loading || !password"
        :loading="loading"
        size="large"
        type="submit"
      >
        Reset password
      </v-btn>
    </v-form>
  </div>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import { useAuthStore } from '@/stores/auth'
  import '@/styles/pages/set-password.scss'

  const router = useRouter()
  const route = useRoute()
  const toast = useToast()
  const authStore = useAuthStore()

  const password = ref('')
  const showPassword = ref(false)
  const loading = ref(false)

  const email = computed(() => route.query.email || '')
  const code = computed(() => route.query.code || '')

  async function handleSetPassword () {
    if (!password.value) {
      toast.error('Please enter a new password')
      return
    }

    if (password.value.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    loading.value = true
    try {
      // If we have a code from verify step, use Cloud Function to reset password
      if (code.value && code.value.length === 6) {
        await authStore.resetPasswordWithOTP(email.value, code.value, password.value)
        toast.success('Password reset successfully!')
        setTimeout(() => {
          router.push('/login')
        }, 1500)
      } else if (authStore.user) {
        // User is already logged in, update password directly
        await authStore.updateUserPassword(password.value)
        toast.success('Password updated successfully!')
        setTimeout(() => {
          router.push('/login')
        }, 1500)
      } else {
        toast.error('Please verify your code first')
        router.push('/verify')
      }
    } catch (error) {
      toast.error(authStore.error || 'Failed to reset password. Please try again.')
      console.error('Set password error:', error)
    } finally {
      loading.value = false
    }
  }
</script>

<style scoped>
/* Styles are imported from set-password.scss */
</style>
