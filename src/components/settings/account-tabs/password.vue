<script setup>
  import { storeToRefs } from 'pinia'
  import { useAuthStore } from '@/stores/auth.js'
  import { usePasswordStore } from '@/stores/passwordStore'
  import '@/styles/components/settings/notify-tabs/tab.scss'
  import '@/styles/components/settings/account-tabs/info.scss'

  const emit = defineEmits(['back'])

  const authStore = useAuthStore()
  const { user } = storeToRefs(authStore)

  const passwordStore = usePasswordStore()
  const {
    currentPassword,
    newPassword,
    confirmPassword,
    isLoading,
    error,
    successMessage,
  } = storeToRefs(passwordStore)

  const { changePassword } = passwordStore

  async function handleSubmit () {
    if (user.value.providerId === 'google.com' || user.value.providerId === 'facebook.com') {
      return
    }
    await changePassword()
  }
</script>

<template>
  <div class="notify-tab password-tab">
    <div class="d-flex tab-header" @click="emit('back')">
      <v-icon class="mr-6" icon="mdi-chevron-left" />
      <span>Change your password</span>
    </div>
    <v-form class="mt-10" @submit.prevent="handleSubmit">
      <div v-if="error" class="alert alert-danger">{{ error }}</div>
      <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

      <div class="form-group">
        <form-input
          v-model="currentPassword"
          :disabled="user.providerId === 'google.com' || user.providerId === 'facebook.com'"
          hide-details
          label="Current password"
          placeholder="Enter password"
          :readonly="user.providerId === 'google.com' || user.providerId === 'facebook.com'"
          type="password"
        />
      </div>
      <div class="form-group mt-2">
        <form-input
          v-model="newPassword"
          :disabled="user.providerId === 'google.com' || user.providerId === 'facebook.com'"
          hide-details
          label="New password"
          placeholder="Enter password"
          :readonly="user.providerId === 'google.com' || user.providerId === 'facebook.com'"
          type="password"
        />
      </div>
      <div class="form-group mt-2">
        <form-input
          v-model="confirmPassword"
          :disabled="user.providerId === 'google.com' || user.providerId === 'facebook.com'"
          hide-details
          label="Confirm password"
          placeholder="Enter password"
          :readonly="user.providerId === 'google.com' || user.providerId === 'facebook.com'"
          type="password"
        />
      </div>
      <div class="d-flex justify-center mt-4">
        <button
          class="submit-btn"
          :disabled="isLoading || user.providerId === 'google.com' || user.providerId === 'facebook.com'"
          type="submit"
        >
          <v-progress-circular
            v-if="isLoading"
            color="white"
            indeterminate
            size="20"
            width="2"
          />
          <span v-else>Save</span>
        </button>
      </div>
    </v-form>
  </div>
</template>

<style scoped>
.alert {
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
}
.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}
.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
