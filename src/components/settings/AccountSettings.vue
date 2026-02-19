<script setup>
  import { storeToRefs } from 'pinia'
  import { computed, ref } from 'vue'
  import { useToast } from 'vue-toastification'
  import { useAuthStore } from '@/stores/auth.js'
  import { useProfileStore } from '@/stores/profile.js'

  const authStore = useAuthStore()
  const profileStore = useProfileStore()
  const toast = useToast()
  const { user } = storeToRefs(authStore)

  const dialog = ref(false)
  const editName = ref('')
  const loading = ref(false)

  const displayName = computed(() => user.value?.displayName || 'User')
  const email = computed(() => user.value?.email || '')

  function openEditDialog () {
    editName.value = user.value?.displayName || ''
    dialog.value = true
  }

  async function saveProfile () {
    if (!editName.value.trim()) {
      toast.error('Name cannot be empty')
      return
    }

    loading.value = true
    try {
      await profileStore.updateUserProfile({
        displayName: editName.value,
      })
      toast.success('Profile updated successfully')
      dialog.value = false
    } catch (error) {
      toast.error('Failed to update profile')
      console.error(error)
    } finally {
      loading.value = false
    }
  }
</script>

<template>
  <div class="settings-section">
    <h2>Account Information</h2>
    <div class="setting-item">
      <label>Email</label>
      <div class="value">{{ email }}</div>
      <!-- Email editing is usually more complex, disabled for now -->
      <!-- <button class="edit-btn">Edit</button> -->
    </div>
    <div class="setting-item">
      <label>Display Name</label>
      <div class="value">{{ displayName }}</div>
      <button class="edit-btn" @click="openEditDialog">Edit</button>
    </div>

    <!-- Edit Profile Dialog -->
    <v-dialog v-model="dialog" max-width="500">
      <v-card class="edit-profile-card">
        <v-card-title>Edit Display Name</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editName"
            label="Display Name"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" variant="text" @click="dialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="loading"
            variant="text"
            @click="saveProfile"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/components/settings/account.scss';
</style>
