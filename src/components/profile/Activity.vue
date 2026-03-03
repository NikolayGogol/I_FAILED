<script setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import PostCard from '@/components/feed/PostCard.vue'

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
      <v-progress-circular indeterminate color="primary" />
    </div>

    <div v-else-if="posts.length === 0" class="text-center pa-4 text-grey">
      No activity found. You haven't commented on any posts yet.
    </div>

    <div v-else class="posts-list">
      <PostCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
        class="mb-4"
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
