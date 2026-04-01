import { defineStore, storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import api from '@/axios.js' // Import axios for backend calls
import { useAuthStore } from '@/stores/auth.js'
import { useSettingsStore } from '@/stores/settings.js'

export const useInfoSettingsStore = defineStore('infoSettings', () => {
  // External stores and hooks
  const authStore = useAuthStore()
  const rootSettingsStore = useSettingsStore()
  const toast = useToast()
  const router = useRouter()
  const { user } = storeToRefs(authStore)

  // State
  const loading = ref(false)
  const displayName = ref('')
  const userName = ref('')
  const bio = ref('')
  const email = ref('')
  const initialEmail = ref('')
  const confirmPasswordDialog = ref(false)
  const modalLoading = ref(false)

  // Actions
  function initialize () {
    displayName.value = user.value?.displayName || ''
    userName.value = user.value?.userName || ''
    bio.value = user.value?.bio || ''
    email.value = user.value?.email || ''
    initialEmail.value = user.value?.email || ''
  }

  function formatUsername (newValue) {
    if (userName.value === newValue) {
      return
    }
    let formatted = newValue || ''
    if (!formatted.startsWith('@')) {
      formatted = '@' + formatted
    }
    const prefix = '@'
    let core = formatted.slice(1)
    core = core.replace(/[\s-]/g, '_')
    core = core.replace(/[^a-zA-Z0-9_]/g, '')
    const finalUsername = prefix + core
    if (finalUsername !== newValue) {
      userName.value = finalUsername
    }
  }

  async function updateProfile () {
    loading.value = true
    try {
      const emailChanged = email.value !== initialEmail.value

      // If email changed, send a request to the backend to send a verification email
      if (emailChanged) {
        await api.post('/send-verification-email', {
          newEmail: email.value,
          uid: user.value.uid,
        })
      }

      // Now, call the root store to update the data in Firestore/Auth
      await rootSettingsStore.updateAccountSettings({
        displayName: displayName.value,
        userName: userName.value,
        bio: bio.value,
        email: email.value,
      })

      if (emailChanged) {
        toast.success('A verification link has been sent to your new email address. Please verify to complete the update.')
      } else {
        toast.success('Profile updated successfully')
      }
      // Always update the initialEmail value after a successful save
      initialEmail.value = email.value
    } catch (error) {
      toast.error('Failed to update profile: ' + error.message)
      console.error(error)
    } finally {
      loading.value = false
    }
  }

  async function handlePasswordConfirm (password) {
    modalLoading.value = true
    try {
      const reauthenticated = await rootSettingsStore.reauthenticateUser(password)
      if (reauthenticated) {
        confirmPasswordDialog.value = false
        await updateProfile()
      } else {
        toast.error(rootSettingsStore.error || 'Incorrect password. Please try again.')
      }
    } catch (error) {
      console.error('Error during re-authentication:', error)
      toast.error('An error occurred during re-authentication.')
    } finally {
      modalLoading.value = false
    }
  }

  async function saveProfile () {
    if (!displayName.value.trim()) {
      toast.error('Display Name cannot be empty')
      return
    }
    if (!userName.value.trim() || userName.value.trim() === '@') {
      toast.error('Username cannot be empty')
      return
    }

    const emailChanged = email.value !== initialEmail.value
    if (emailChanged) {
      confirmPasswordDialog.value = true
    } else {
      await updateProfile()
    }
  }

  return {
    loading,
    displayName,
    userName,
    bio,
    email,
    initialEmail,
    confirmPasswordDialog,
    modalLoading,
    initialize,
    formatUsername,
    saveProfile,
    handlePasswordConfirm,
  }
})
