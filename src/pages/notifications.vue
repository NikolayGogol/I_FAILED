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
  import { computed, onMounted, ref } from 'vue'
  import FollowCard from '@/components/notifications/FollowCard.vue'
  import LikeCard from '@/components/notifications/LikeCard.vue'
  import MentionCard from '@/components/notifications/MentionCard.vue'
  import { useMainStore } from '@/stores/main/main.js'
  import { useNotificationStore } from '@/stores/notification'
  import '@/styles/pages/notifications.scss'

  const notificationStore = useNotificationStore()
  const mainStore = useMainStore()

  const paginatedNotifications = computed(() => notificationStore.paginatedNotifications)
  const totalPages = computed(() => notificationStore.totalPages)
  dayjs.extend(relativeTime)
  const tabs = [
    {
      label: 'All',
      value: 0,
      path: null,
    },
    {
      label: 'Mentions',
      value: 2,
      path: 'mentions',
    },
    {
      label: 'Likes',
      value: 1,
      path: 'likes',
    },
    {
      label: 'Follows',
      value: 3,
      path: 'followers',
    },
  ]
  const selectedTab = ref(tabs[0])
  //
  onMounted(() => {
    notificationStore.fetchNotifications()
  })

  function handlePageChange (page) {
    notificationStore.setCurrentPage(page)
  }
  function tabSelect (tab) {
    selectedTab.value = tab
    if (tab.path) {
      notificationStore.getDataByTab(tab)
    } else {
      notificationStore.fetchNotifications()
    }
    notificationStore.currentPage = 1
  }

  function handleMarkAllAsRead () {
    notificationStore.markAllAsRead()
  }
  const notifications = computed(() => mainStore.notifications)
</script>
<template>
  <div class="notifications-page">
    <div class="d-flex align-center justify-space-between mt-6 sm:mt-0">
      <h2 class="font-weight-bold text-grey-darken-3 ml-3 ml-sm-0 title">Notifications</h2>
      <p
        v-if="notifications > 1"
        class="cursor-pointer text-primary mr-3 mr-sm-0"
        @click="handleMarkAllAsRead"
      >Mark all as read</p>
    </div>
    <section class="notifications-main px-4 mt-7">
      <ul class="tab-list">
        <li
          v-for="tab in tabs"
          :key="tab.value"
          :class="{ active: selectedTab.value === tab.value }"
          @click="tabSelect(tab)"
        >{{ tab.label }}</li>
      </ul>
      <div v-if="notificationStore.loading" class="loading d-flex justify-center">
        <v-progress-linear color="primary" indeterminate />
      </div>
      <div v-else-if="notificationStore.notifications.length === 0" class="no-notifications">
        You have no new notifications.
      </div>
      <div v-else>
        <div
          v-for="notification in paginatedNotifications"
          :key="notification.id"
          class="notification-item"
          :class="[
            {'need2Read': !notification.isRead},
            {'hover': notification.isRead},
          ]"
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
          class="mt-6 mb-6"
          color="primary"
          density="comfortable"
          :length="totalPages"
          rounded
          :total-visible="5"
          @update:model-value="handlePageChange"
        />
      </div>
    </section>
  </div>
</template>
