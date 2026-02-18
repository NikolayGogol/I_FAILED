<script setup>
  import { ref } from 'vue'
  import { useToast } from 'vue-toastification'
  import FacebookLoginButton from '@/components/FacebookLoginButton.vue'
  import GoogleLoginButton from '@/components/GoogleLoginButton.vue'
  import { useAuthStore } from '@/stores/auth'
  import '@/styles/pages/register.scss'

  const authStore = useAuthStore()
  const toast = useToast()

  const email = ref('')
  const password = ref('')
  const displayName = ref('')
  const whyJoining = ref(null)
  const showPassword = ref(false)
  const loading = ref(false)
  const isSend = ref(false)

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
      await authStore.createAcc({
        email: email.value,
        password: password.value,
        displayName: displayName.value,
        whyJoining: whyJoining.value,
      })
      isSend.value = true
    } catch (error) {
      toast.error(authStore.error || 'Registration failed. Please try again.')
      console.error('Registration error:', error)
    } finally {
      loading.value = false
    }
  }
</script>

<template>
  <div v-if="!isSend" class="register-page">
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

          <v-form autocomplete="off" class="register-form-fields" @submit.prevent="handleRegister">
            <v-text-field
              v-model="email"
              autocomplete="username"
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

            <v-text-field
              v-model="displayName"
              autocomplete="off"
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
  <div v-else class="register-page">
    <div class="register-container">
      <v-container class="d-flex flex-column align-center justify-center">
        <div class="wrapper d-flex flex-column align-center justify-center" style="width: 440px;">
          <div class="d-flex justify-start mb-3 w-100">
            <div class="d-flex align-center cursor-pointer" @click="isSend = false">
              <v-icon class="mr-2" size="small">mdi-arrow-left</v-icon>
              Back
            </div>
          </div>
          <div class="placeholder-image" style="width: 440px; height: 238px;" />
          <h1 class="mt-2">Check your inbox</h1>
          <p>Click on the link we sent to {{ email }} to finish your registration</p>
          <p>Didn’t receive the email? <b class="cursor-pointer" @click="handleRegister">Send again</b></p>
        </div>

      </v-container>
    </div>
  </div>
</template>
