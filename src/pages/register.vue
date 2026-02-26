<route lang="json">
{
  "meta": {
    "layout": "AuthLayout"
  }
}
</route>

<script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import FacebookLoginButton from '@/components/FacebookLoginButton.vue'
  import FormInput from '@/components/FormInput.vue'
  import GoogleLoginButton from '@/components/GoogleLoginButton.vue'
  import { useAuthStore } from '@/stores/auth'
  import '@/styles/pages/register.scss'

  const authStore = useAuthStore()
  const toast = useToast()
  const router = useRouter()

  const form = ref(null)
  const email = ref('')
  const password = ref('')
  const displayName = ref('')
  const whyJoining = ref(null)
  const loading = ref(false)

  const whyJoiningOptions = [
    'Personal use',
    'Work / Business',
    'Learning',
    'Other',
  ]

  const emailRules = [
    v => !!v || 'Email is required',
    v => /.+@.+\..+/.test(v) || 'E-mail must be valid',
  ]

  const passwordRules = [
    v => !!v || 'Password is required',
    v => v.length >= 6 || 'Password must be at least 6 characters',
  ]

  const nameRules = [
    v => !!v || 'Name is required',
  ]

  async function handleRegister () {
    const { valid } = await form.value.validate()
    if (!valid) return

    loading.value = true
    try {
      // CORRECT: Calls the backend and expects a verificationToken
      const response = await authStore.createAcc({
        email: email.value,
        password: password.value,
        displayName: displayName.value,
        whyJoining: whyJoining.value,
      })
      if (response.data.status === 'success' && response.data.verificationToken) {
        // CORRECT: Redirects to check-inbox with the token
        router.push({
          path: '/check-inbox',
          query: { email: email.value, token: response.data.verificationToken },
        })
      } else {
        toast.error(response.data.message || 'Registration failed. Please try again.')
      }
    } catch (error) {
      // The axios interceptor will show the error toast
      console.error('Registration error:', error)
    } finally {
      loading.value = false
    }
  }
</script>

<template>
  <div class="register-form">
    <h1 class="welcome-title font-weight-semibold text-center">Sign up</h1>

    <div class="auth-prompt text-center">
      <span>Already have an account? </span>
      <router-link class="auth-link" to="/login">Log in</router-link>
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
      class="register-form-fields"
      @submit.prevent="handleRegister"
    >
      <form-input
        v-model="email"
        autocomplete="username"
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
        density="comfortable"
        hide-details="auto"
        label="Password"
        placeholder="Enter password"
        required
        :rules="passwordRules"
        type="password"
        variant="outlined"
      />

      <form-input
        v-model="displayName"
        autocomplete="off"
        density="comfortable"
        hide-details="auto"
        label="Display Name"
        placeholder="User123"
        required
        :rules="nameRules"
        type="text"
        variant="outlined"
      />

      <div>
        <label class="label d-block mb-2 text-body-2 text-high-emphasis">Why joining?</label>
        <v-select
          v-model="whyJoining"
          clearable
          color="primary"
          density="comfortable"
          hide-details="auto"
          :items="whyJoiningOptions"
          placeholder="Choose an option"
          variant="outlined"
        />
      </div>

      <div class="d-flex justify-center mt-10">
        <v-btn
          class="register-btn rounded-lg"
          color="primary"
          :disabled="loading"
          :loading="loading"
          size="large"
          type="submit"
        >
          Sign Up
        </v-btn>
      </div>
    </v-form>
  </div>
</template>
