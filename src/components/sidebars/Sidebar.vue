<script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import ProfileCard from '@/components/sidebars/ProfileCard.vue'
  import { feedNavItems, feedQuickStats } from '@/models/feed'
  import { useMainStore } from '@/stores/main.js'
  import '@/styles/components/sidebars/sidebar.scss'

  const navItems = feedNavItems
  const quickStats = feedQuickStats
  const totalPosts = ref(0)
  const router = useRouter()
  //
  const { getFeeds } = useMainStore()
  //
  getFeeds().then(res => {
    totalPosts.value = res.length
  })
</script>
<template>
  <aside class="feed-sidebar">
    <ProfileCard class="mobile-profile-card" />

    <div class="sidebar-logo">
      <span class="logo-mark cursor-pointer" @click="router.push('/')">
        <img alt="" src="../../assets/Logo.png">
      </span>
    </div>

    <nav class="sidebar-nav">
      <div class="sidebar-section d-flex flex-column">
        <router-link
          v-for="item in navItems"
          :key="item.id"
          class="nav-item py-2"
          :to="item.id === 'sidebars' ? '/' : '/' + item.id"
        >
          <v-icon class="nav-icon mr-2" size="25">
            {{ item.icon }}
          </v-icon>
          <span>{{ item.label }}</span>
        </router-link>
      </div>
    </nav>

    <section class="sidebar-card quick-stats">
      <h3 class="sidebar-card-title font-weight-semibold">Quick Stats</h3>
      <div class="stat-row">
        <span>Total Posts</span>
        <span class="stat-value font-weight-bold">{{ totalPosts }}</span>
      </div>
      <div class="stat-row">
        <span>Active Users</span>
        <span class="stat-value font-weight-bold">{{ quickStats.activeUsers.toLocaleString() }}</span>
      </div>
      <div class="stat-row">
        <span>Lessons Shared</span>
        <span class="stat-value font-weight-bold">{{ quickStats.lessonsShared.toLocaleString() }}</span>
      </div>
    </section>

    <v-btn
      class="create-post-btn rounded-lg w-100"
      color="primary"
      height="44"
      to="/create-post"
    >
      + Create post
    </v-btn>
  </aside>
</template>
