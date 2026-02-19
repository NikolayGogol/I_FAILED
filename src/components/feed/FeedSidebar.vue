<template>
  <aside class="feed-sidebar">
    <div class="sidebar-logo">
      <span class="logo-mark">ifailed</span>
    </div>

    <nav class="sidebar-nav">
      <div class="sidebar-section">
        <router-link
          v-for="item in navItems"
          :key="item.id"
          class="nav-item"
          :class="{ active: item.id === activeId }"
          :to="item.id === 'feed' ? '/' : '/' + item.id"
        >
          <v-icon class="nav-icon" size="18">
            {{ item.icon }}
          </v-icon>
          <span>{{ item.label }}</span>
        </router-link>
      </div>
    </nav>

    <section class="sidebar-card quick-stats">
      <h3 class="sidebar-card-title">Quick Stats</h3>
      <div class="stat-row">
        <span>Total Posts</span>
        <span class="stat-value">{{ quickStats.totalPosts.toLocaleString() }}</span>
      </div>
      <div class="stat-row">
        <span>Active Users</span>
        <span class="stat-value">{{ quickStats.activeUsers.toLocaleString() }}</span>
      </div>
      <div class="stat-row">
        <span>Lessons Shared</span>
        <span class="stat-value">{{ quickStats.lessonsShared.toLocaleString() }}</span>
      </div>
    </section>

    <v-btn
      block
      class="create-post-btn"
      color="primary"
      height="44"
    >
      Create post
    </v-btn>
  </aside>
</template>

<script setup>
  import { feedNavItems, feedQuickStats } from '@/models/feed'

  defineProps({
    activeId: {
      type: String,
      default: 'feed',
    },
  })

  const navItems = feedNavItems
  const quickStats = feedQuickStats
</script>
