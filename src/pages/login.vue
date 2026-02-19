<route lang="json">
{
  "meta": {
    "layout": "AuthLayout"
  }
}
</route>

<template>
  <div class="login-form">
    <h1 class="welcome-title">Welcome!</h1>

    <div class="signup-prompt">
      <span>Don't have an account? </span>
      <router-link class="join-link" to="/register">Join here</router-link>
    </div>

    <div class="social-buttons">
      <google-login-button />
      <facebook-login-button />
    </div>

    <div class="separator-wrapper">
      <v-divider class="separator" />
      <span class="separator-text">or</span>
      <v-divider class="separator" />
    </div>

    <v-form
      autocomplete="off"
      class="login-form-fields"
      @submit.prevent="handleLogin"
    >
      <v-text-field
        v-model="email"
        autocomplete="one-time-code"
        class="form-field"
        density="comfortable"
        hide-details="auto"
        label="Email"
        placeholder="Enter email"
        required
        type="email"
        variant="outlined"
      />

      <v-text-field
        v-model="password"
        autocomplete="new-password"
        class="form-field"
        density="comfortable"
        hide-details="auto"
        label="Password"
        placeholder="Enter password"
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

      <div class="form-options">
        <v-checkbox
          v-model="rememberMe"
          class="checkbox-field"
          density="compact"
          hide-details
          label="Remember me"
        />
        <router-link class="forgot-link" to="/forgot-password">Forgot Password?</router-link>
      </div>

      <v-btn
        block
        class="login-btn"
        :disabled="loading"
        :loading="loading"
        size="large"
        type="submit"
      >
        Log in
      </v-btn>
    </v-form>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import FacebookLoginButton from '@/components/FacebookLoginButton.vue'
  import GoogleLoginButton from '@/components/GoogleLoginButton.vue'
  import { useAuthStore } from '@/stores/auth'
  import '@/styles/pages/login.scss'

  const router = useRouter()
  const authStore = useAuthStore()
  const toast = useToast()

  const email = ref('')
  const password = ref('')
  const showPassword = ref(false)
  const rememberMe = ref(false)
  const loading = ref(false)

  async function handleLogin () {
    loading.value = true
    try {
      await authStore.signInWithEmail(email.value, password.value, rememberMe.value)
      if (authStore.user) {
        toast.success('Successfully signed in!')
        router.push('/')
      }
    } catch (error) {
      toast.error(authStore.error || 'Login failed. Please try again.')
      console.error('Login error:', error)
    } finally {
      loading.value = false
    }
  }
</script>

<style scoped>
/* Styles are imported from login.scss */
</style>
