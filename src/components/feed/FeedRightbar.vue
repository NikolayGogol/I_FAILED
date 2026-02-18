<template>
  <aside class="feed-rightbar">
    <!-- Profile summary -->
    <section class="right-card profile-card">
      <div class="profile-top">
        <div class="profile-avatar">
          <span>{{ currentUserInitials }}</span>
        </div>
        <div class="profile-info">
          <div class="profile-name">
            {{ currentUserName }}
          </div>
          <div class="profile-handle">
            {{ currentUserHandle }}
          </div>
        </div>
        <v-spacer />
        <v-btn
          v-if="authStore.user"
          class="logout-btn"
          size="small"
          variant="text"
          @click="handleLogout"
        >
          Log out
        </v-btn>
        <v-btn
          v-else
          class="logout-btn"
          size="small"
          to="/login"
          variant="text"
        >
          Log in
        </v-btn>
      </div>

      <v-text-field
        v-model="search"
        class="profile-search"
        density="compact"
        hide-details
        placeholder="Search"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
      />
    </section>

    <!-- Who to follow -->
    <section class="right-card follow-card">
      <header class="right-card-header">
        <h3>Who to follow</h3>
      </header>
      <div
        v-for="person in whoToFollow"
        :key="person.id"
        class="follow-row"
      >
        <div class="follow-avatar">
          <span>{{ person.initials }}</span>
        </div>
        <div class="follow-info">
          <div class="follow-name">{{ person.name }}</div>
          <div class="follow-handle">{{ person.handle }}</div>
        </div>
        <v-spacer />
        <v-btn
          class="follow-btn"
          color="primary"
          height="32"
          variant="flat"
        >
          Follow
        </v-btn>
      </div>
      <button class="show-more-btn">Show more</button>
    </section>

    <!-- Popular now -->
    <section class="right-card popular-card">
      <header class="right-card-header">
        <h3>Popular now</h3>
      </header>
      <div
        v-for="tag in popularTags"
        :key="tag"
        class="popular-row"
      >
        <span class="popular-tag">#{{ tag }}</span>
        <v-spacer />
        <v-btn icon size="small" variant="text">
          <v-icon>mdi-dots-horizontal</v-icon>
        </v-btn>
      </div>
    </section>
  </aside>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { feedPopularTags, feedWhoToFollow } from '@/models/feed'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  const search = ref('')
  const whoToFollow = ref(feedWhoToFollow)
  const popularTags = ref(feedPopularTags)

  const currentUserName = computed(() => authStore.user?.displayName || 'Sarah Chen')
  const currentUserHandle = computed(() => authStore.user?.email || 'sarah.chen@example.com')
  const currentUserInitials = computed(() => {
    const name = currentUserName.value
    const parts = name.split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
  })

  async function handleLogout () {
    await authStore.logout()
  }
</script>
