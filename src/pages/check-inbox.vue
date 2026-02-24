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
    <div class="back-link" @click="router.push('/register')">
      <v-icon size="small">mdi-arrow-left</v-icon>
      Back
    </div>
    <div class="placeholder-image" />
    <h1 class="welcome-title">Check your inbox</h1>
    <p class="prompt-text">Click on the link we sent to {{ email }} to finish your registration.</p>
    <p class="prompt-text">
      Didn’t receive the email?
      <b class="resend-link" :class="{ 'disabled': loading }" @click="handleResend">
        {{ loading ? 'Sending...' : 'Send again' }}
      </b>
    </p>
  </div>
</template>
