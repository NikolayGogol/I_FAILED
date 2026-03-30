<script setup>
  import { computed, onMounted, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import ProfileCard from '@/components/sidebars/ProfileCard.vue'
  import { feedNavItems } from '@/models/feed'
  import { getIcon } from '@/models/icons.js'
  import { useAuthStore } from '@/stores/auth.js'
  import { useMainStore } from '@/stores/main/main.js'
  import { floatNumber } from '@/utils/format-number.js'
  import '@/styles/components/sidebars/sidebar.scss'

  const navItems = feedNavItems
  const router = useRouter()
  const mainStore = useMainStore()
  const authStore = useAuthStore()
  const currentUserName = computed(() => authStore.user?.displayName)
  const currentUserUid = computed(() => authStore.user?.uid)
  // Use a computed property to reactively get the total posts count from the store
  const totalPosts = computed(() => mainStore.totalPosts)
  const lessonsShared = computed(() => mainStore.lessonsShared)
  const notifications = computed(() => mainStore.notifications)

  // Fetch the total count when the component is mounted
  onMounted(() => {
    mainStore.fetchTotalPostCount()
    if (currentUserUid.value) {
      mainStore.listenForNotifications(currentUserUid.value)
    }
  })

  watch(currentUserUid, newUid => {
    if (newUid) {
      mainStore.listenForNotifications(newUid)
    }
  })
</script>
<template>
  <aside class="feed-sidebar">
    <ProfileCard class="mobile-profile-card" />

    <div v-if="currentUserName" class="sidebar-logo">
      <span class="logo-mark cursor-pointer" @click="router.push('/')">
        <img alt="" src="../../assets/Logo.png">
      </span>
    </div>

    <nav v-if="currentUserName" class="sidebar-nav">
      <div class="sidebar-section d-flex flex-column">
        <router-link
          v-for="item in navItems"
          :key="item.id"
          class="nav-item py-2"
          :to="item.id === 'sidebars' ? '/' : '/' + item.id"
        >
          <div
            class="mr-3"
            :class="{'fill': item.id === 'notifications'}"
            v-html="getIcon(item.icon)"
          />
          <div v-if="item.id === 'notifications' && notifications > 0" class="badge">{{ floatNumber(notifications, '0a') }}</div>
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
        <span class="stat-value font-weight-bold">0</span>
      </div>
      <div class="stat-row">
        <span>Lessons Shared</span>
        <span class="stat-value font-weight-bold">{{ lessonsShared }}</span>
      </div>
    </section>

    <v-btn
      v-if="currentUserName"
      class="create-post-btn rounded-lg w-100"
      color="primary"
      height="44"
      to="/create-post"
    >
      + Create post
    </v-btn>
  </aside>
</template>
