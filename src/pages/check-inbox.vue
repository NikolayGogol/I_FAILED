<route lang="json">
{
  "meta": {
    "layout": "AuthMinLayout"
  }
}
</route>

<script setup>
  import { computed, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import { useAuthStore } from '@/stores/auth'
  import '@/styles/pages/check-inbox.scss'

  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()
  const toast = useToast()

  const loading = ref(false)
  const email = computed(() => route.query.email || '')
  const token = computed(() => route.query.token || '')

  async function handleResend () {
    if (!token.value) {
      toast.error('Verification token is missing.')
      return
    }

    loading.value = true
    try {
      await authStore.resendVerificationEmail(token.value)
      toast.success('Verification email sent again!')
    } catch (error) {
      toast.error(authStore.error || 'Failed to resend email. Please try again.')
      console.error('Resend email error:', error)
    } finally {
      loading.value = false
    }
  }
</script>

<template>
  <div class="check-inbox-message">
    <div class="d-flex">
      <div class="back-link" @click="router.push('/register')">
        <v-icon size="small">mdi-arrow-left</v-icon>
        Back
      </div>
    </div>
    <h1 class="welcome-title">Check your inbox</h1>
    <p class="prompt-text">Click on the link we sent to <b>{{ email }} </b> <br>to finish your registration.</p>
    <p class="prompt-text">
      Didn’t receive the email?
      <b class="resend-link" :class="{ 'disabled': loading }" @click="handleResend">
        {{ loading ? 'Sending...' : 'Send again' }}
      </b>
    </p>
    <div class="d-flex justify-center mt-10">
      <a
        class="d-flex align-center justify-space-between open-mail-btn"
        href="https://mail.google.com"
        target="_blank"
      >
        <svg class="social-icon" height="20" viewBox="0 0 24 24" width="20">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        <span>Open Gmail</span>
        <span />
      </a>
    </div>
  </div>
</template>
