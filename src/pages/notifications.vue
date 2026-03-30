<route lang="json">
{
  "meta": {
    "layout": "MainLayout",
    "auth": true
  }
}
</route>
<script setup>
  import dayjs from 'dayjs'
  import relativeTime from 'dayjs/plugin/relativeTime'
  import { computed, onMounted } from 'vue'
  import FollowCard from '@/components/notifications/FollowCard.vue'
  import LikeCard from '@/components/notifications/LikeCard.vue'
  import MentionCard from '@/components/notifications/MentionCard.vue'
  import { useNotificationStore } from '@/stores/notification'
  import '@/styles/pages/notifications.scss'

  const notificationStore = useNotificationStore()

  const paginatedNotifications = computed(() => notificationStore.paginatedNotifications)
  const totalPages = computed(() => notificationStore.totalPages)
  dayjs.extend(relativeTime)

  onMounted(() => {
    notificationStore.fetchNotifications()
  })

  function handlePageChange (page) {
    notificationStore.setCurrentPage(page)
  }
</script>
<template>
  <div class="notifications-page">
    <div class="d-flex align-center justify-space-between">
      <h2 class="font-weight-bold text-grey-darken-3 ml-3 ml-sm-0">Notifications</h2>
      <p class="cursor-pointer text-primary">Mark all as read</p>
    </div>
    <section class="notifications-main mt-7">
      <div v-if="notificationStore.loading" class="loading d-flex justify-center">
        <v-progress-circular color="primary" indeterminate />
      </div>
      <div v-else-if="notificationStore.notifications.length === 0" class="no-notifications">
        You have no new notifications.
      </div>
      <div v-else>
        <div
          v-for="notification in paginatedNotifications"
          :key="notification.id"
          class="notification-item"
          :class="{'need2Read': !notification.isRead}"
        >
          <div v-if="notification.type === 'follower'">
            <FollowCard :data="notification" />
          </div>
          <div v-if="notification.type === 'like'">
            <LikeCard :data="notification" />
          </div>
          <div v-if="notification.type === 'mention'">
            <MentionCard :data="notification" />
          </div>
        </div>
        <v-pagination
          v-if="totalPages > 1"
          v-model="notificationStore.currentPage"
          class="mt-6"
          color="primary"
          density="comfortable"
          :length="totalPages"
          rounded
          :total-visible="3"
          @update:model-value="handlePageChange"
        />
      </div>
    </section>
  </div>
</template>
