<script setup>
  import dayjs from 'dayjs'
  import { storeToRefs } from 'pinia'
  import { onMounted, watch } from 'vue'
  import ConfirmPasswordModal from '@/components/modals/ConfirmPasswordModal.vue'
  import { useAuthStore } from '@/stores/auth.js'
  import { useInfoSettingsStore } from '@/stores/settings/info.js'
  import '@/styles/components/settings/notify-tabs/tab.scss'
  import '@/styles/components/settings/account-tabs/info.scss'

  // Initialize the new store
  const infoSettingsStore = useInfoSettingsStore()
  const authStore = useAuthStore()

  // Destructure state and actions from the store
  const {
    loading,
    displayName,
    userName,
    bio,
    email,
    confirmPasswordDialog,
    modalLoading,
  } = storeToRefs(infoSettingsStore)

  const {
    initialize,
    formatUsername,
    saveProfile,
    handlePasswordConfirm,
  } = infoSettingsStore

  const { user } = storeToRefs(authStore)
  const emit = defineEmits(['back'])

  // Initialize the store's state when the component mounts
  onMounted(() => {
    initialize()
  })

  // Watch for changes in the userName ref and call the store action
  watch(userName, newValue => {
    formatUsername(newValue)
  })
</script>

<template>
  <div class="account-tab notify-tab">
    <div class="d-flex tab-header" @click="emit('back')">
      <v-icon class="mr-6" icon="mdi-chevron-left" />
      <span>Account information</span>
    </div>
    <!-- The modal's visibility and actions are now controlled by the store -->
    <ConfirmPasswordModal
      :dialog="confirmPasswordDialog"
      :loading="modalLoading"
      @close="confirmPasswordDialog = false"
      @confirm="handlePasswordConfirm"
    />
    <v-form class="mt-6" @submit.prevent="saveProfile">
      <div class="form-group">
        <!-- Bind inputs directly to the store's state -->
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
          :disabled="user.providerId === 'google.com' || user.providerId === 'facebook.com'"
          hide-details
          label="Email"
          :readonly="user.providerId === 'google.com' || user.providerId === 'facebook.com'"
          type="email"
        />
      </div>
      <p class="mt-6">Account creation</p>
      <p class="text-description" style="font-size: 12px">{{ dayjs.unix(user?.createdAt?.seconds).format('DD MMM YYYY') }}</p>
      <div class="d-flex justify-center mt-6">
        <!-- The click handler now calls the store's saveProfile action -->
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
