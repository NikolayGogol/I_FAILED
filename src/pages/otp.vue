<route lang="json">
{
  "meta": {
    "layout": "AuthMinLayout"
  }
}
</route>
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

  // Helper to safely focus an input
  function focusInput (index) {
    const el = inputRefs.value[index]
    if (el) {
      // Check if el is a Vue component instance with a focus method, or a raw DOM element
      if (typeof el.focus === 'function') {
        el.focus()
      } else if (el.$el && typeof el.$el.querySelector === 'function') {
        // If it's a Vuetify component, the input is nested
        const input = el.$el.querySelector('input')
        if (input) input.focus()
      }
    }
  }

  function handleInput (index, event) {
    const value = event.target.value
    // If the input is not a digit, clear it
    if (!/^\d*$/.test(value)) {
      code.value[index] = ''
      return
    }

    // Take only the last character if multiple were entered (though maxlength is 1)
    code.value[index] = value.slice(-1)

    // Move to next input if a digit was entered
    if (value && index < 5) {
      nextTick(() => {
        focusInput(index + 1)
      })
    }
  }

  function handleKeydown (index, event) {
    if (event.key === 'Backspace') {
      if (!code.value[index] && index > 0) {
        // If current is empty and backspace pressed, clear previous and focus it
        code.value[index - 1] = ''
        nextTick(() => {
          focusInput(index - 1)
        })
      } else {
        // Otherwise just clear current
        code.value[index] = ''
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1)
    } else if (event.key === 'ArrowRight' && index < 5) {
      focusInput(index + 1)
    }
  }

  function handlePaste (event) {
    event.preventDefault()
    const pastedData = (event.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6)

    if (!pastedData) return

    for (const [i, char] of pastedData.split('').entries()) {
      code.value[i] = char
    }

    const nextIndex = Math.min(pastedData.length, 5)
    nextTick(() => {
      focusInput(nextIndex)
    })
  }

  async function handleVerify () {
    if (!isCodeComplete.value) return

    loading.value = true
    try {
      const verificationCode = code.value.join('')
      await authStore.verifyOTP(email.value, verificationCode)
      toast.success('Code verified successfully!')

      router.push({
        path: '/reset-password', // Assuming this is the next step
        query: { email: email.value, code: verificationCode },
      })
    } catch (error) {
      console.error('OTP verification error:', error)
      // Clear code on error
      code.value = Array.from({ length: 6 }).fill('')
      nextTick(() => {
        focusInput(0)
      })
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
      nextTick(() => {
        focusInput(0)
      })
    } catch (error) {
      console.error('Resend code error:', error)
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
      focusInput(0)
    })
  })
</script>

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
      <div class="otp-inputs d-flex justify-center ga-3 w-100">
        <!-- Using standard v-text-field or a custom input if form-input is not standard -->
        <!-- Assuming form-input is a wrapper around v-text-field or input -->
        <!-- We use :ref function to store refs in array -->
        <div v-for="(digit, index) in 6" :key="index" class="otp-field-wrapper">
          <input
            :ref="el => { if (el) inputRefs[index] = el }"
            v-model="code[index]"
            autocomplete="one-time-code"
            class="otp-input"
            maxlength="1"
            type="text"
            @input="handleInput(index, $event)"
            @keydown="handleKeydown(index, $event)"
            @paste="handlePaste"
          >
        </div>
      </div>

      <div class="resend-code text-center mb-2">
        <span class="text-body-2 text-medium-emphasis">Didn't receive the code? </span>
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
          class="rounded-lg mt-4"
          color="primary"
          :disabled="loading || !isCodeComplete"
          :loading="loading"
          size="large"
          type="submit"
          width="100%"
        >
          Confirm
        </v-btn>
      </div>
    </v-form>
  </div>
</template>

<style scoped lang="scss">
/* We can add scoped styles here or keep using the imported scss */
.otp-inputs {
  margin-bottom: 24px;
}

.otp-field-wrapper {
  width: 48px;
  height: 48px;
}

.otp-input {
  width: 100%;
  height: 100%;
  border: 1px solid #DCDCD8;
  border-radius: 8px;
  text-align: center;
  font-size: 1.25rem;
  font-weight: 600;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #D65A1F; /* Primary color */
    border-width: 2px;
  }
}
</style>
