<template>
  <div class="verify-page">
    <div class="verify-header">
      <span class="verify-title">Forgot password flow</span>
      <span class="verify-version">0.0.0. forgot password</span>
    </div>

    <div class="verify-container">
      <div class="verify-left">
        <div class="placeholder-image">
          <!-- Placeholder for image/illustration -->
        </div>
      </div>

      <div class="verify-right">
        <div class="verify-form">
          <router-link class="back-link" to="/forgot-password">
            <v-icon size="small">mdi-arrow-left</v-icon>
            Back
          </router-link>

          <h1 class="welcome-title">Enter verification code</h1>

          <div class="verify-prompt">
            <span>Lorem ipsum dolor sit amet, consectetur.</span>
          </div>

          <v-form class="verify-form-fields" @submit.prevent="handleVerify">
            <div class="otp-inputs">
              <v-text-field
                v-for="(digit, index) in code"
                :key="index"
                :ref="el => inputRefs[index] = el"
                v-model="code[index]"
                autocomplete="off"
                class="otp-field"
                density="comfortable"
                hide-details
                maxlength="1"
                type="text"
                variant="outlined"
                @input="handleOtpInput(index, $event)"
                @keydown="handleOtpKeydown(index, $event)"
                @paste="handleOtpPaste"
              />
            </div>

            <div class="resend-code">
              <span>Don't receive the code?</span>
              <button class="resend-link" :disabled="resendLoading" type="button" @click="handleResendCode">
                {{ resendLoading ? 'Sending...' : 'Send again' }}
              </button>
            </div>

            <v-btn
              block
              class="confirm-btn"
              :disabled="loading || !isCodeComplete"
              :loading="loading"
              size="large"
              type="submit"
            >
              Confirm
            </v-btn>
          </v-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed, nextTick, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import { useAuthStore } from '@/stores/auth'
  import '@/styles/pages/verify.scss'

  const router = useRouter()
  const route = useRoute()
  const toast = useToast()
  const authStore = useAuthStore()

  const code = ref(['', '', '', '', '', ''])
  const inputRefs = ref([])
  const loading = ref(false)
  const resendLoading = ref(false)

  const isCodeComplete = computed(() => {
    return code.value.every(digit => digit !== '')
  })

  const email = computed(() => route.query.email || '')

  // Auto-submit when code is complete
  watch(isCodeComplete, (complete) => {
    if (complete && !loading.value) {
      handleVerify()
    }
  })

  function handleOtpInput (index, event) {
    const value = event.target.value.replace(/[^0-9]/g, '')
    code.value[index] = value

    // Auto-focus next input
    if (value && index < 5) {
      nextTick(() => {
        inputRefs.value[index + 1]?.focus()
      })
    }
  }

  function handleOtpKeydown (index, event) {
    // Handle backspace
    if (event.key === 'Backspace' && !code.value[index] && index > 0) {
      nextTick(() => {
        inputRefs.value[index - 1]?.focus()
      })
    }

    // Handle arrow keys
    if (event.key === 'ArrowLeft' && index > 0) {
      inputRefs.value[index - 1]?.focus()
    }
    if (event.key === 'ArrowRight' && index < 5) {
      inputRefs.value[index + 1]?.focus()
    }
  }

  function handleOtpPaste (event) {
    event.preventDefault()
    const pastedData = event.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)

    for (let i = 0; i < pastedData.length && i < 6; i++) {
      code.value[i] = pastedData[i]
    }

    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 5)
    nextTick(() => {
      inputRefs.value[nextIndex]?.focus()
    })
  }

  async function handleVerify () {
    if (!isCodeComplete.value) {
      toast.error('Please enter the complete verification code')
      return
    }

    loading.value = true
    try {
      const verificationCode = code.value.join('')

      // Verify OTP code via Cloud Function
      await authStore.verifyPasswordResetOTP(email.value, verificationCode)

      toast.success('Code verified successfully!')

      // Redirect to set password page with email and code
      setTimeout(() => {
        router.push({
          path: '/set-password',
          query: { email: email.value, code: verificationCode },
        })
      }, 1000)
    } catch (error) {
      toast.error(authStore.error || 'Invalid verification code. Please try again.')
      console.error('Verify error:', error)
      // Clear code on error
      code.value = ['', '', '', '', '', '']
      nextTick(() => {
        inputRefs.value[0]?.focus()
      })
    } finally {
      loading.value = false
    }
  }

  async function handleResendCode () {
    if (!email.value) {
      toast.error('Email address is required')
      router.push('/forgot-password')
      return
    }

    resendLoading.value = true
    try {
      await authStore.sendPasswordResetOTP(email.value)
      toast.success('Verification code resent to your email!')
      // Clear current code
      code.value = ['', '', '', '', '', '']
      nextTick(() => {
        inputRefs.value[0]?.focus()
      })
    } catch (error) {
      toast.error(authStore.error || 'Failed to resend code. Please try again.')
      console.error('Resend error:', error)
    } finally {
      resendLoading.value = false
    }
  }

  onMounted(() => {
    // Focus first input on mount
    nextTick(() => {
      inputRefs.value[0]?.focus()
    })

    // Redirect if no email
    if (!email.value) {
      toast.warning('Please enter your email first')
      router.push('/forgot-password')
    }
  })
</script>

<style scoped>
/* Styles are imported from verify.scss */
</style>
