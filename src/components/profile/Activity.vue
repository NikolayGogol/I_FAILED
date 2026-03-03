<script setup>
  import { onMounted, ref } from 'vue'
  import PostCard from '@/components/feed/PostCard.vue'
  import { useAuthStore } from '@/stores/auth'
  import { useProfileStore } from '@/stores/profile'

  const profileStore = useProfileStore()
  const authStore = useAuthStore()

  const posts = ref([])
  const loading = ref(true)

  onMounted(async () => {
    if (authStore.user?.uid) {
      posts.value = await profileStore.fetchUserInteractedPosts(authStore.user.uid)
      loading.value = false
    }
  })
</script>

<template>
  <div class="activity-container">
    <div v-if="loading" class="d-flex justify-center pa-4">
      <v-progress-circular color="primary" indeterminate />
    </div>

    <div v-else-if="posts.length === 0" class="text-center pa-4 text-grey">
      No activity found. You haven't commented on any posts yet.
    </div>

    <div v-else class="posts-list">
      <PostCard
        v-for="post in posts"
        :key="post.id"
        class="mb-4"
        :post="post"
      />
    </div>
  </div>
</template>

<style scoped>
.activity-container {
  max-width: 800px;
  margin: 0 auto;
}
</style>
