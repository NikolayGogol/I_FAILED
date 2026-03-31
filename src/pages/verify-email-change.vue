<route lang="json">
{
  "meta": {
    "layout": "AuthMinLayout"
  }
}
</route>

<script setup>
  import { applyActionCode } from 'firebase/auth'
  import { onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import { auth } from '@/firebase'
  import '@/styles/pages/verify-new-user.scss'

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  const loading = ref(true)
  const success = ref(false)
  const errorMessage = ref('')

  onMounted(async () => {
    const oobCode = route.query.oobCode

    if (!oobCode) {
      errorMessage.value = 'No verification code found in the URL. Please check the link and try again.'
      loading.value = false
      return
    }

    try {
      // Use the Firebase SDK to apply the out-of-band code
      await applyActionCode(auth, oobCode)
      success.value = true
      toast.success('Your email has been successfully updated! Please log in with your new email address.')

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error) {
      console.error('Error verifying email change:', error)
      switch (error.code) {
        case 'auth/expired-action-code': {
          errorMessage.value = 'This verification link has expired. Please try changing your email again.'
          break
        }
        case 'auth/invalid-action-code': {
          errorMessage.value = 'This verification link is invalid or has already been used. Please try changing your email again.'
          break
        }
        case 'auth/user-disabled': {
          errorMessage.value = 'Your account has been disabled.'
          break
        }
        default: {
          errorMessage.value = 'An unexpected error occurred. Please try again later.'
          break
        }
      }
      toast.error(errorMessage.value)
    } finally {
      loading.value = false
    }
  })
</script>

<template>
  <div class="verify-new-user-form">
    <h1 class="welcome-title">Verifying Email Change</h1>

    <div v-if="loading" class="verify-prompt">
      <v-progress-circular color="primary" indeterminate />
      <p class="mt-3">Finalizing your email update...</p>
    </div>

    <div v-else>
      <v-alert
        v-if="success"
        class="mb-4"
        icon="mdi-check-circle"
        prominent
        type="success"
      >
        Your email has been successfully updated! You will be redirected to the login page shortly.
      </v-alert>
      <v-alert
        v-else
        class="mb-4"
        icon="mdi-alert-circle"
        prominent
        type="error"
      >
        {{ errorMessage }}
      </v-alert>
    </div>
  </div>
</template>
