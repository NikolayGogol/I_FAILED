<script setup>
  import dayjs from 'dayjs'
  import { storeToRefs } from 'pinia'
  import { onMounted, ref, watch } from 'vue'
  import { useToast } from 'vue-toastification'
  import { useAuthStore } from '@/stores/auth.js'
  import { useSettingsStore } from '@/stores/settings.js'
  //
  import '@/styles/components/settings/account.scss'
  const authStore = useAuthStore()
  const settingsStore = useSettingsStore()
  const toast = useToast()
  const { user } = storeToRefs(authStore)
  //
  const loading = ref(false)
  const displayName = ref('')
  const userName = ref('')
  const bio = ref('')
  const email = ref('')

  onMounted(() => {
    displayName.value = user.value?.displayName || ''
    userName.value = user.value?.userName || ''
    bio.value = user.value?.bio || ''
    email.value = user.value?.email || ''
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

    // Reconstruct the final username
    const finalUsername = prefix + core

    // Update the model only if the formatted value is different
    // This prevents an infinite loop and unnecessary cursor jumps
    if (finalUsername !== newValue) {
      userName.value = finalUsername
    }
  })

  async function saveProfile () {
    if (!displayName.value.trim()) {
      toast.error('Display Name cannot be empty')
      return
    }
    if (!userName.value.trim() || userName.value.trim() === '@') {
      toast.error('Username cannot be empty')
      return
    }

    loading.value = true
    try {
      await settingsStore.updateAccountSettings({
        displayName: displayName.value,
        userName: userName.value,
        bio: bio.value,
        email: email.value,
      })
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error('Failed to update profile')
      console.error(error)
    } finally {
      loading.value = false
    }
  }
</script>

<template>
  <div class="settings-account">
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
      <!--      <div class="form-group mt-3">-->
      <!--        <form-input v-model="email" hide-details label="Email" type="email" />-->
      <!--      </div>-->
      <p class="mt-6">Account creation</p>
      <p class="text-description" style="font-size: 12px">{{ dayjs.unix(user?.createdAt?.seconds).format('DD MMM YYYY') }}</p>
      <div class="d-flex justify-center mt-6">
        <div class="submit-btn" @click="saveProfile">
          <v-progress-circular
            v-if="loading"
            color="white"
            size="20"
            width="2"
          />
          <span v-else>Save</span>
        </div>
      </div>
    </v-form>
  </div>
</template>
