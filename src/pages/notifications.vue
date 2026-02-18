<template>
  <div class="feed-page">
    <main class="feed-shell">
      <section class="feed-layout">
        <!-- Left sidebar -->
        <FeedSidebar active-id="notifications" />

        <!-- Center feed -->
        <section class="feed-main">
          <div class="page-header">
            <h1>Notifications</h1>
            <p>Stay updated with your community interactions.</p>
          </div>

          <div class="notifications-list">
            <div v-for="i in 5" :key="i" class="notification-item">
              <div class="notification-icon">
                <v-icon color="primary">mdi-bell-ring-outline</v-icon>
              </div>
              <div class="notification-content">
                <p><strong>User {{ i }}</strong> liked your post about "Failed Startup".</p>
                <span class="notification-time">2 hours ago</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Right sidebar -->
        <FeedRightbar />
      </section>
    </main>
  </div>
</template>

<script setup>
  import FeedRightbar from '@/components/feed/FeedRightbar.vue'
  import FeedSidebar from '@/components/feed/FeedSidebar.vue'
  import '@/styles/pages/index.scss'
  import '@/styles/pages/notifications.scss'
</script>
