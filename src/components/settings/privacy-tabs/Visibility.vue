<script setup>
  import { storeToRefs } from 'pinia'
  import { onMounted } from 'vue'
  import { useVisibilityStore } from '@/stores/settings/visibility'

  const emit = defineEmits(['back'])

  const settingsStore = useVisibilityStore()
  const { isPrivate, loading: isLoading, showConfirmationModal } = storeToRefs(settingsStore)
  const { handlePrivateToggle, onConfirmPrivacyChange, onCancelPrivacyChange, initializePrivacy } = settingsStore

  onMounted(() => {
    initializePrivacy()
  })
</script>

<template>
  <div class="notify-tab">
    <div class="d-flex tab-header" @click="emit('back')">
      <v-icon class="mr-6" icon="mdi-chevron-left" />
      <span>Profile visibility</span>
    </div>
    <ul class="mt-3">
      <li class="cursor-default all-item px-5">
        <span>Private account</span>
        <v-switch
          color="primary"
          density="comfortable"
          hide-details
          :loading="isLoading"
          :model-value="isPrivate"
          @update:model-value="handlePrivateToggle"
        />
      </li>
    </ul>
    <p class="text-description mt-4">
      If you have a public account, your profile and posts can be seen by anyone on and off Ifailed, even people who don't have an Ifailed account.
    </p>
    <p class="text-description mt-4">
      If you have a private account, only followers you approve can see the content you share and lists of your followers and followers. Some information on your profile, like your main photo and username, is visible to everyone on and off Ifailed.
      <a class="text-primary font-weight-semibold" href="#" target="_blank">Learn more</a>
    </p>
  </div>

  <v-dialog v-model="showConfirmationModal" max-width="500">
    <v-card class="logout-dialog-card py-4">
      <v-card-title class="text-center">Make profile private?</v-card-title>
      <div class="px-6">
        <p class="text-description">
          Only followers will see your posts.
        </p>
        <p class="text-description mt-2">
          Your settings for who can message you, tag you, or @mention you will not change, but you will not be able to tag people who are not following you.
        </p>
      </div>
      <v-row class="px-6 mt-6">
        <v-col>
          <div class="cancel-btn" @click="onCancelPrivacyChange">Cancel</div>
        </v-col>
        <v-col>
          <div
            class="submit-btn"
            @click="onConfirmPrivacyChange"
          >
            <v-progress-circular
              v-if="isLoading"
              class="mr-2"
              indeterminate
              size="20"
              width="2"
            />
            <span v-else>Change to private</span>
          </div>
        </v-col>
      </v-row>
    </v-card>
  </v-dialog>
</template>
