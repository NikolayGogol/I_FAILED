<script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify/framework'
  import { getIcon } from '@/models/icons.js'
  import { useNotificationStore } from '@/stores/notification.js'
  const { smAndDown } = useDisplay()

  const props = defineProps({
    data: {
      type: Object,
      required: true,
    },
  })
  const showDeleteDialog = ref(false)
  const mobileDrawer = ref(false)
  const isDeleting = ref(false)
  const notificationStore = useNotificationStore()
  const router = useRouter()

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

  function goToSettings () {
    router.push({
      path: '/settings',
      query: {
        tab: 'notifications',
      },
    })
  }
</script>

<template>
  <div class="notify-menu">
    <v-menu v-if="!smAndDown" open-on-hover>
      <template #activator="{ props: menuProps }">
        <v-btn
          density="compact"
          icon
          size="small"
          v-bind="menuProps"
          variant="text"
        >
          <v-icon>mdi-dots-horizontal</v-icon>
        </v-btn>
      </template>
      <v-list class="rounded-xl elevation-1">
        <v-list-item class="cursor-pointer" @click="handleMarkAsRead">
          <div class="d-flex mr-3" v-html="getIcon('letter')" />
          {{ data.isRead ? 'Mark as unread' : 'Mark as read' }}
        </v-list-item>
        <v-list-item class="cursor-pointer" @click="goToSettings">
          <div class="d-flex mr-3" v-html="getIcon('gear')" />
          Change notification settings
        </v-list-item>
        <v-list-item class="cursor-pointer text-danger" @click="showDeleteDialog = true">
          <div class="d-flex mr-3" v-html="getIcon('trash')" />
          Delete this notification
        </v-list-item>
      </v-list>
    </v-menu>
    <template v-else>
      <v-btn
        density="compact"
        icon
        size="small"
        variant="text"
        @click="mobileDrawer = true"
      >
        <v-icon>mdi-dots-horizontal</v-icon>
      </v-btn>
      <MobileSlide v-model="mobileDrawer">
        <v-list>
          <v-list-item class="cursor-pointer px-0" @click="handleMarkAsRead">
            <div class="d-flex mr-3" v-html="getIcon('letter')" />
            {{ data.isRead ? 'Mark as unread' : 'Mark as read' }}
          </v-list-item>
          <v-list-item class="cursor-pointer px-0" @click="goToSettings">
            <div class="d-flex mr-3" v-html="getIcon('gear')" />
            Change notification settings
          </v-list-item>
          <v-list-item class="cursor-pointer px-0 text-danger" @click="showDeleteDialog = true">
            <div class="d-flex mr-3" v-html="getIcon('trash')" />
            Delete this notification
          </v-list-item>
        </v-list>
      </MobileSlide>
    </template>
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
