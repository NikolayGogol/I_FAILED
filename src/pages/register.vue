<route lang="json">
{
  "meta": {
    "layout": "AuthLayout"
  }
}
</route>

<script setup>
  import { ref } from 'vue'
  import { useToast } from 'vue-toastification'
  import FacebookLoginButton from '@/components/FacebookLoginButton.vue'
  import FormInput from '@/components/FormInput.vue'
  import GoogleLoginButton from '@/components/GoogleLoginButton.vue'
  import { useAuthStore } from '@/stores/auth'
  import '@/styles/pages/register.scss'

  const authStore = useAuthStore()
  const toast = useToast()

  const form = ref(null)
  const email = ref('')
  const password = ref('')
  const displayName = ref('')
  const whyJoining = ref(null)
  const loading = ref(false)
  const isSend = ref(false)

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
  <div v-if="!isSend" class="register-form">
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
  <div v-else class="d-flex flex-column align-center justify-center text-center">
    <div class="d-flex justify-start mb-3 w-100">
      <div class="d-flex align-center cursor-pointer" @click="isSend = false">
        <v-icon class="mr-2" size="small">mdi-arrow-left</v-icon>
        Back
      </div>
    </div>
    <div class="placeholder-image" style="width: 100%; max-width: 300px; height: auto; aspect-ratio: 440 / 238;" />
    <h1 class="mt-2">Check your inbox</h1>
    <p>Click on the link we sent to {{ email }} to finish your registration</p>
    <p>Didn’t receive the email? <b class="cursor-pointer" @click="handleRegister">Send again</b></p>
  </div>
</template>
