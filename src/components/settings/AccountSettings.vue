<script setup>
  import dayjs from 'dayjs'
  import { storeToRefs } from 'pinia'
  import { onMounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import ConfirmPasswordModal from '@/components/modals/ConfirmPasswordModal.vue' // Import the new modal component
  import { useAuthStore } from '@/stores/auth.js'
  import { useSettingsStore } from '@/stores/settings.js'

  //
  import '@/styles/components/settings/account.scss'
  const authStore = useAuthStore()
  const settingsStore = useSettingsStore()
  const toast = useToast()
  const { user } = storeToRefs(authStore)
  const router = useRouter()
  //
  const loading = ref(false) // For the main save button
  const displayName = ref('')
  const userName = ref('')
  const bio = ref('')
  const email = ref('')
  const initialEmail = ref('') // To track the original email
  const confirmPasswordDialog = ref(false) // Controls the visibility of the password confirmation modal
  const modalLoading = ref(false) // For the loading state inside the modal

  onMounted(() => {
    displayName.value = user.value?.displayName || ''
    userName.value = user.value?.userName || ''
    bio.value = user.value?.bio || ''
    email.value = user.value?.email || ''
    initialEmail.value = user.value?.email || '' // Set initial email on mount
  })

  watch(userName, (newValue, oldValue) => {
    // Do nothing if the value hasn't changed
    if (newValue === oldValue) return

    let formatted = newValue || ''

    // Rule 1: Ensure the username always starts with '@'
    if (!formatted.startsWith('@')) {
      formatted = '@' + formatted
    }

    // Rule 2: Sanitize the part of the string *after* the '@'
    const prefix = '@'
    let core = formatted.slice(1)

    core = core.replaceAll(' ', '_')
    core = core.replaceAll('-', '_')
    core = core.replace(/[^a-zA-Z0-9_]/g, '') // Remove any characters that are not letters, numbers, or underscores

    // Reconstruct the final username
    const finalUsername = prefix + core

    // Update the model only if the formatted value is different
    // This prevents an infinite loop and unnecessary cursor jumps
    if (finalUsername !== newValue) {
      userName.value = finalUsername
    }
  })

  // Main save function, now checks for email change
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
      // If email changed, open the password confirmation modal
      confirmPasswordDialog.value = true
    } else {
      // If email did not change, proceed with direct profile update
      await updateProfile()
    }
  }

  // Function to handle password confirmation from the modal
  async function handlePasswordConfirm (password) {
    modalLoading.value = true
    try {
      const reauthenticated = await settingsStore.reauthenticateUser(password)
      if (reauthenticated) {
        confirmPasswordDialog.value = false // Close modal
        await updateProfile(true) // Proceed with profile update, indicating email changed
      } else {
        toast.error(settingsStore.error || 'Incorrect password. Please try again.')
      }
    } catch (error) {
      console.error('Error during re-authentication:', error)
      toast.error('An error occurred during re-authentication.')
    } finally {
      modalLoading.value = false
    }
  }

  // Actual profile update logic, now called from saveProfile or handlePasswordConfirm
  async function updateProfile (emailJustChanged = false) {
    loading.value = true
    try {
      await settingsStore.updateAccountSettings({
        displayName: displayName.value,
        userName: userName.value,
        bio: bio.value,
        email: email.value,
      })

      if (emailJustChanged) {
        toast.success('A verification link has been sent to your new email address. Please verify to complete the update.')
        // We don't update initialEmail here, so the user can't trigger this flow again until they refresh the page
      } else {
        toast.success('Profile updated successfully')
        initialEmail.value = email.value
      }
    } catch (error) {
      toast.error('Failed to update profile: ' + error.message)
      console.error(error)
    } finally {
      loading.value = false
    }
  }
</script>

<template>
  <div class="settings-account">
    <!-- Password Confirmation Modal -->
    <ConfirmPasswordModal
      :dialog="confirmPasswordDialog"
      :loading="modalLoading"
      @close="confirmPasswordDialog = false"
      @confirm="handlePasswordConfirm"
    />

    <div class="d-flex tab-header">
      <v-icon icon="mdi-chevron-left" />
      <span>Account Settings</span>
    </div>
    <v-form class="mt-6" @submit.prevent="saveProfile">
      <div class="form-group">
        <form-input v-model="displayName" hide-details label="Display Name" />
      </div>
      <div class="form-group d-flex align-center mt-3 position-relative">
        <form-input
          v-model="userName"
          hide-details
          label="Username"
        />
      </div>
      <div class="form-group mt-3">
        <form-textarea v-model="bio" hide-details label="Bio" />
      </div>
      <div class="form-group mt-3">
        <form-input
          v-model="email"
          :disabled="user?.providerId === 'google.com' || user?.providerId === 'facebook.com'"
          hide-details
          label="Email"
          :readonly="user?.providerId === 'google.com' || user?.providerId === 'facebook.com'"
          type="email"
        />
      </div>
      <p class="mt-6">Account creation</p>
      <p class="text-description" style="font-size: 12px">{{ dayjs.unix(user?.createdAt?.seconds).format('DD MMM YYYY') }}</p>
      <div class="d-flex justify-center mt-6">
        <div class="submit-btn" @click="saveProfile">
          <v-progress-circular
            v-if="loading"
            color="white"
            indeterminate
            size="20"
            width="2"
          />
          <span v-else>Save</span>
        </div>
      </div>
    </v-form>
  </div>
</template>
