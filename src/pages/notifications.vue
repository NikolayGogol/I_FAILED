<route lang="json">
{
  "meta": {
    "layout": "MainLayout",
    "auth": true
  }
}
</route>
<script setup>
  import { computed, onMounted } from 'vue'
  import LikeCard from '@/components/notifications/LikeCard.vue'
  import { useNotificationStore } from '@/stores/notification'
  import '@/styles/pages/notifications.scss'

  const notificationStore = useNotificationStore()

  const paginatedNotifications = computed(() => notificationStore.paginatedNotifications)
  const totalPages = computed(() => notificationStore.totalPages)

  onMounted(() => {
    notificationStore.fetchNotifications()
  })

  function handlePageChange (page) {
    notificationStore.setCurrentPage(page)
  }
</script>
<template>
  <div class="notifications-page">
    <section class="notifications-main">
      <div v-if="notificationStore.loading" class="loading">
        Loading notifications...
      </div>
      <div v-else-if="notificationStore.notifications.length === 0" class="no-notifications">
        You have no new notifications.
      </div>
      <div v-else>
        <div v-for="notification in paginatedNotifications" :key="notification.id" class="notification-item">
          <div v-if="notification.type === 'follower'">
            <p><strong>{{ notification.followerName }}</strong> started following you.</p>
          </div>
          <div v-if="notification.type === 'like'">
            <LikeCard :data="notification" />
          </div>
          <div v-if="notification.type === 'mention'">
            <p><strong>{{ notification.userName }}</strong> mentioned you in a comment.</p>
          </div>
        </div>
        <v-pagination
          v-if="totalPages > 1"
          v-model="notificationStore.currentPage"
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
