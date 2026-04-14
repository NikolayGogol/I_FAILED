<script setup>
  import { ref } from 'vue'
  import { getIcon } from '@/models/icons.js'
  import { useNotificationStore } from '@/stores/notification.js'

  const props = defineProps({
    data: {
      type: Object,
      required: true,
    },
  })
  const showDeleteDialog = ref(false)
  const isDeleting = ref(false)
  const notificationStore = useNotificationStore()

  function handleMarkAsRead () {
    notificationStore.toggleMarkAsRead(props.data)
  }

  function confirmDelete () {
    isDeleting.value = true
    notificationStore.deleteNotification(props.data)
      .then(() => {
        showDeleteDialog.value = false
      })
      .finally(() => {
        isDeleting.value = false
      })
  }

</script>

<template>
  <div class="notify-menu d-flex align-center">
    <v-icon
      class="cursor-pointer"
      :icon="data.isRead ? 'mdi-email-open-outline': 'mdi-email-outline'"
      @click="handleMarkAsRead"
    />
    <div
      class="d-flex ml-3 cursor-pointer"
      @click="showDeleteDialog = true"
      v-html="getIcon('trash')"
    />
    <v-dialog v-model="showDeleteDialog" max-width="480">
      <div class="bg-white rounded-lg py-6 px-6">
        <h6 class="text-h6 text-center">Delete Notification?</h6>
        <p class="text-description text-center mt-3">
          This action cannot be undone. Are you sure you want to delete this post?
        </p>
        <v-row class="mt-3">
          <v-col>
            <div class="cancel-btn" @click="showDeleteDialog = false">Cancel</div>
          </v-col>
          <v-col>
            <div class="submit-btn" :class="{'opacity-60 pointer-events-none': isDeleting}" @click="confirmDelete">
              <v-progress-circular
                v-if="isDeleting"
                class="mr-2"
                indeterminate
                size="20"
                width="2"
              />
              <span v-else>Delete</span>
            </div>
          </v-col>
        </v-row>
      </div>
    </v-dialog>
  </div>
</template>

<style scoped lang="scss">
:deep(.v-list-item__content) {
  display: flex;
}
</style>
