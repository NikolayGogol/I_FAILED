<route lang="json">
{
  "meta": {
    "layout": "AuthLayout"
  }
}
</route>

<template>
  <div class="login-form">
    <h1 class="welcome-title font-weight-semibold text-center">Welcome!</h1>
    <div class="auth-prompt text-center">
      <span>Don't have an account? </span>
      <router-link
        class="auth-link"
        to="/register"
      >Join here</router-link>
    </div>

    <div class="social-buttons mt-4">
      <v-row>
        <v-col>
          <google-login-button />
        </v-col>
        <v-col>
          <facebook-login-button />
        </v-col>
      </v-row>
    </div>

    <div class="separator-wrapper d-flex align-center my-6">
      <v-divider class="separator" />
      <span class="separator-text">or</span>
      <v-divider class="separator" />
    </div>

    <v-form
      ref="form"
      autocomplete="off"
      class="login-form-fields"
      @submit.prevent="handleLogin"
    >
      <form-input
        v-model="email"
        autocomplete="one-time-code"
        class="form-field"
        density="comfortable"
        hide-details="auto"
        label="Email"
        placeholder="Enter email"
        required
        :rules="emailRules"
        type="email"
        variant="outlined"
      />

      <form-input
        v-model="password"
        autocomplete="new-password"
        class="form-field mt-4"
        density="comfortable"
        hide-details="auto"
        label="Password"
        placeholder="Enter password"
        required
        :rules="passwordRules"
        type="password"
        variant="outlined"
      />

      <div class="form-options d-flex align-center justify-space-between my-6">
        <v-checkbox
          v-model="rememberMe"
          class="checkbox-field"
          color="primary"
          density="compact"
          hide-details
          label="Remember me"
        />
        <router-link class="forgot-link text-primary" to="/forgot-password">Forgot Password?</router-link>
      </div>

      <div class="d-flex justify-center">
        <v-btn
          class="login-btn rounded-lg"
          color="primary"
          :disabled="loading"
          :loading="loading"
          size="large"
          type="submit"
        >
          Log in
        </v-btn>
      </div>
    </v-form>
  </div>
</template>

<script setup>
  import { ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import FacebookLoginButton from '@/components/FacebookLoginButton.vue'
  import FormInput from '@/components/FormInput.vue'
  import GoogleLoginButton from '@/components/GoogleLoginButton.vue'
  import { useAuthStore } from '@/stores/auth'
  import '@/styles/pages/login.scss'

  const router = useRouter()
  const authStore = useAuthStore()
  const toast = useToast()

  const form = ref(null)
  const email = ref('')
  const password = ref('')
  const rememberMe = ref(false)
  const loading = ref(false)

  const emailRules = [
    v => !!v || 'Email is required',
    v => /.+@.+\..+/.test(v) || 'E-mail must be valid',
  ]

  const passwordRules = [
    v => !!v || 'Password is required',
    v => v.length >= 6 || 'Password must be at least 6 characters',
  ]

  // Watch for the user state to change
  watch(() => authStore.user, newUser => {
    if (newUser) {
      toast.success('Successfully signed in!')
      router.push('/')
    }
  })

  async function handleLogin () {
    const { valid } = await form.value.validate()
    if (!valid) return

    loading.value = true
    try {
      // Just call the sign-in method. The watcher will handle the redirect.
      await authStore.signInWithEmail(email.value, password.value, rememberMe.value)
    } catch (error) {
      const errorMessage = authStore.getErrorMessage(error.code)
      toast.error(errorMessage || 'Login failed. Please try again.')
      console.error('Login error:', error)
    } finally {
      loading.value = false
    }
  }
</script>

<style scoped>
/* Styles are imported from login.scss */
</style>
