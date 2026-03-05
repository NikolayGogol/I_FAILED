<script setup>
  import { onMounted, ref } from 'vue'
  import PostCard from '@/components/feed/PostCard.vue'
  import { useAuthStore } from '@/stores/auth'
  import { useProfileStore } from '@/stores/profile'

  const props = defineProps({
    userId: {
      type: String,
      default: null,
    },
  })

  const profileStore = useProfileStore()
  const authStore = useAuthStore()

  const posts = ref([])
  const loading = ref(true)

  onMounted(async () => {
    const targetUserId = props.userId || authStore.user?.uid
    if (targetUserId) {
      posts.value = await profileStore.fetchUserInteractedPosts(targetUserId)
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
      No activity found. This user hasn't commented on any posts yet.
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
