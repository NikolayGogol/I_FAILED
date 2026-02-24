<route lang="json">
{
  "meta": {
    "layout": "AuthMinLayout"
  }
}
</route>

<template>
  <div class="verify-form">
    <router-link class="back-link" to="/forgot-password">
      <v-icon size="small">mdi-arrow-left</v-icon>
      Back
    </router-link>

    <h1 class="welcome-title font-weight-semibold">Enter verification code</h1>

    <div class="verify-prompt">
      <span>We sent a code to {{ email }}</span>
    </div>

    <v-form class="verify-form-fields" @submit.prevent="handleVerify">
      <div class="otp-inputs d-flex justify-center ga-5 mb-6">
        <v-text-field
          v-for="(digit, index) in 6"
          :key="index"
          :ref="el => { if (el) inputRefs[index] = el }"
          v-model="code[index]"
          autocomplete="one-time-code"
          class="otp-field text-center bg-white"
          density="comfortable"
          hide-details
          maxlength="1"
          type="text"
          variant="outlined"
          @input="handleInput(index, $event)"
          @keydown="handleKeydown(index, $event)"
          @paste="handlePaste"
        />
      </div>

      <div class="resend-code text-center mb-6">
        <span class="text-body-2 text-medium-emphasis">Don't receive the code? </span>
        <button
          class="resend-link text-primary font-weight-bold"
          :disabled="resendLoading"
          type="button"
          @click="handleResendCode"
        >
          {{ resendLoading ? 'Sending...' : 'Send again' }}
        </button>
      </div>

      <div class="d-flex justify-center">
        <v-btn
          class="rounded-lg"
          color="primary"
          :disabled="loading || !isCodeComplete"
          :loading="loading"
          size="large"
          type="submit"
        >
          Confirm
        </v-btn>
      </div>
    </v-form>
  </div>
</template>

<script setup>
  import { computed, nextTick, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import { useAuthStore } from '@/stores/auth'
  import '@/styles/pages/verify.scss'

  const router = useRouter()
  const route = useRoute()
  const toast = useToast()
  const authStore = useAuthStore()

  const code = ref(Array.from({ length: 6 }).fill(''))
  const inputRefs = ref([])
  const loading = ref(false)
  const resendLoading = ref(false)

  const email = computed(() => route.query.email || '')

  const isCodeComplete = computed(() => {
    return code.value.every(digit => digit !== '' && digit !== null && digit !== undefined)
  })

  function handleInput (index, event) {
    const value = event.target.value
    // Ensure only numbers
    if (!/^\d*$/.test(value)) {
      code.value[index] = ''
      return
    }

    code.value[index] = value.slice(-1)

    if (value && index < 5) {
      nextTick(() => {
        inputRefs.value[index + 1]?.focus()
      })
    }
  }

  function handleKeydown (index, event) {
    if (event.key === 'Backspace') {
      if (!code.value[index] && index > 0) {
        code.value[index - 1] = ''
        nextTick(() => {
          inputRefs.value[index - 1]?.focus()
        })
      } else {
        code.value[index] = ''
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      inputRefs.value[index - 1]?.focus()
    } else if (event.key === 'ArrowRight' && index < 5) {
      inputRefs.value[index + 1]?.focus()
    }
  }

  function handlePaste (event) {
    event.preventDefault()
    const pastedData = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)

    for (const [index, char] of pastedData.split('').entries()) {
      code.value[index] = char
    }

    const nextIndex = Math.min(pastedData.length, 5)
    nextTick(() => {
      inputRefs.value[nextIndex]?.focus()
    })
  }

  async function handleVerify () {
    if (!isCodeComplete.value) return

    loading.value = true
    try {
      const verificationCode = code.value.join('')
      await authStore.verifyPasswordResetOTP(email.value, verificationCode)
      toast.success('Code verified successfully!')

      // Navigate to reset password page
      // Note: In a real app, you might get a token back from verifyPasswordResetOTP
      // to pass to the next step for security.
      router.push({
        path: '/set-password',
        query: { email: email.value, code: verificationCode },
      })
    } catch {
      toast.error(authStore.error || 'Invalid code. Please try again.')
      code.value = Array.from({ length: 6 }).fill('')
      inputRefs.value[0]?.focus()
    } finally {
      loading.value = false
    }
  }

  async function handleResendCode () {
    if (!email.value) return

    resendLoading.value = true
    try {
      await authStore.sendPasswordResetOTP(email.value)
      toast.success('Code resent successfully!')
      code.value = Array.from({ length: 6 }).fill('')
      inputRefs.value[0]?.focus()
    } catch {
      toast.error(authStore.error || 'Failed to resend code.')
    } finally {
      resendLoading.value = false
    }
  }

  onMounted(() => {
    if (!email.value) {
      toast.error('Email is missing')
      router.push('/forgot-password')
      return
    }
    nextTick(() => {
      inputRefs.value[0]?.focus()
    })
  })
</script>

<style scoped>
/* Styles are imported from verify.scss */
.otp-field :deep(input) {
  text-align: center;
  font-size: 1.25rem;
  font-weight: 600;
}
</style>
