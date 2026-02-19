<route lang="json">
{
  "meta": {
    "layout": "MainLayout"
  }
}
</route>

<template>
  <div class="notifications-page">
    <section class="notifications-main">
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
  </div>
</template>

<script setup>
  import '@/styles/pages/notifications.scss'
</script>
