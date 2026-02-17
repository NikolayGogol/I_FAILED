<template>
  <div class="register-page">
    <div class="register-header" />

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
            <google-login-button>Sign up with Google</google-login-button>
            <facebook-login-button>Sign up with Facebook</facebook-login-button>
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
              class="form-field"
              clearable
              density="comfortable"
              hide-details="auto"
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
  import FacebookLoginButton from '@/components/FacebookLoginButton.vue'
  import GoogleLoginButton from '@/components/GoogleLoginButton.vue'
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

  async function handleRegister () {
    if (password.value.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    loading.value = true
    try {
      // await authStore.signUpWithEmail(email.value, password.value, displayName.value, whyJoining.value)
      await authStore.createAcc({
        email: email.value,
        password: password.value,
        displayName: displayName.value,
        whyJoining: whyJoining.value,
      })
      // if (authStore.user) {
      //   toast.success('Account created successfully!')
      //   router.push('/')
      // }
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
