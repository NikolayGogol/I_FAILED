<template>
  <div class="register-page">
    <div class="register-header">
      <span class="register-title">Registration flow</span>
      <span class="register-version">0.1.0. registration</span>
    </div>

    <div class="register-container">
      <div class="register-left">
        <div class="placeholder-image">
          <!-- Placeholder for image/illustration -->
        </div>
      </div>

      <div class="register-right">
        <div class="register-form">
          <h1 class="welcome-title">Sign up</h1>

          <div class="signin-prompt">
            <span>Already have an account? </span>
            <router-link class="join-link" to="/login">Log in</router-link>
          </div>

          <div class="social-buttons">
            <v-btn
              block
              class="social-btn google-btn"
              :disabled="loading"
              :loading="loading"
              variant="outlined"
              @click="handleGoogleSignIn"
            >
              <template #prepend>
                <svg class="social-icon" height="20" viewBox="0 0 24 24" width="20">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </template>
              Sign up with Google
            </v-btn>

            <v-btn
              block
              class="social-btn facebook-btn"
              :disabled="loading"
              variant="flat"
              @click="handleFacebookSignIn"
            >
              <template #prepend>
                <svg class="social-icon" height="20" viewBox="0 0 24 24" width="20">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#ffffff" />
                </svg>
              </template>
              Sign up with Facebook
            </v-btn>
          </div>

          <div class="separator-wrapper">
            <v-divider class="separator" />
            <span class="separator-text">or</span>
            <v-divider class="separator" />
          </div>

          <v-form class="register-form-fields" @submit.prevent="handleRegister">
            <v-text-field
              v-model="email"
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

            <v-text-field
              v-model="displayName"
              class="form-field"
              density="comfortable"
              hide-details="auto"
              label="Display Name"
              placeholder="User123"
              required
              type="text"
              variant="outlined"
            />

            <v-select
              v-model="whyJoining"
              density="comfortable"
              class="form-field"
              hide-details="auto"
              clearable
              item-title="title"
              item-value="value"
              :items="whyJoiningOptions"
              label="Why joining?"
              placeholder="Choose an option"
              variant="outlined"
            />

            <v-btn
              block
              class="register-btn"
              :disabled="loading"
              :loading="loading"
              size="large"
              type="submit"
            >
              Sign Up
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
  import '@/styles/pages/register.scss'

  const router = useRouter()
  const authStore = useAuthStore()
  const toast = useToast()

  const email = ref('')
  const password = ref('')
  const displayName = ref('')
  const whyJoining = ref(null)
  const showPassword = ref(false)
  const loading = ref(false)

  const whyJoiningOptions = [
    { title: 'Personal use', value: 'personal' },
    { title: 'Work / Business', value: 'work' },
    { title: 'Learning', value: 'learning' },
    { title: 'Other', value: 'other' },
  ]

  async function handleGoogleSignIn () {
    loading.value = true
    try {
      await authStore.signInWithGoogle()
      if (authStore.user) {
        toast.success('Successfully signed in with Google!')
        router.push('/')
      }
    } catch {
      toast.error('Failed to sign in with Google. Please try again.')
    } finally {
      loading.value = false
    }
  }

  async function handleFacebookSignIn () {
    loading.value = true
    try {
      await authStore.signInWithFacebook()
      if (authStore.user) {
        toast.success('Successfully signed in with Facebook!')
        router.push('/')
      }
    } catch {
      toast.error(authStore.error || 'Failed to sign in with Facebook. Please try again.')
    } finally {
      loading.value = false
    }
  }

  async function handleRegister () {
    if (password.value.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    loading.value = true
    try {
      await authStore.signUpWithEmail(email.value, password.value, displayName.value, whyJoining.value)
      if (authStore.user) {
        toast.success('Account created successfully!')
        router.push('/')
      }
    } catch (error) {
      toast.error(authStore.error || 'Registration failed. Please try again.')
      console.error('Registration error:', error)
    } finally {
      loading.value = false
    }
  }
</script>

<style scoped>
/* Styles are imported from register.scss */
</style>
