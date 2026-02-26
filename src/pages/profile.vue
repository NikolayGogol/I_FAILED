<route lang="json">
{
  "meta": {
    "layout": "MainLayout",
    "auth": true
  }
}
</route>

<script setup>
  import { storeToRefs } from 'pinia'
  import { onMounted } from 'vue'
  import PostCard from '@/components/feed/PostCard.vue'
  import UserCard from '@/components/profile/UserCard.vue'
  import { useAuthStore } from '@/stores/auth'
  import { useProfileStore } from '@/stores/profile'
  import '@/styles/pages/profile.scss'

  const authStore = useAuthStore()
  const profileStore = useProfileStore()

  const { posts, loading, error } = storeToRefs(profileStore)

  onMounted(() => {
    if (authStore.user?.uid) {
      profileStore.fetchUserPosts(authStore.user.uid)
    }
  })
</script>

<template>
  <div class="profile-page">
    <section class="profile-main">
      <UserCard />

      <div class="content-feed">
        <nav class="user-tabs">
          <button class="tab-item active">Posts ({{ posts.length }})</button>
          <button class="tab-item">Activity</button>
        </nav>

        <div class="create-post-card">
          <div class="create-post-content">
            <div class="user-avatar-mini">SC</div>
            <div class="post-input-placeholder">What's new?</div>
            <button class="write-post-btn">Write a post</button>
          </div>
        </div>

        <div v-if="loading" class="text-center py-10">
          <v-progress-circular color="primary" indeterminate />
        </div>
        <div v-else-if="error" class="text-center py-10 text-error">
          {{ error }}
        </div>
        <div v-else-if="posts.length === 0" class="text-center py-10 text-medium-emphasis">
          You haven't posted anything yet.
        </div>
        <div v-else class="profile-posts">
          <PostCard
            v-for="post in posts"
            :key="post.id"
            :post="post"
          />
        </div>
      </div>
    </section>
  </div>
</template>
