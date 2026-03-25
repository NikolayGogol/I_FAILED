<script setup>
  import { storeToRefs } from 'pinia'
  import { onMounted, onUnmounted } from 'vue'
  import PostCard from '@/components/feed/PostCard.vue'
  import { useForYouStore } from '@/stores/feed/forYou'

  const store = useForYouStore()
  const { filteredPosts: posts, loading, hasMore } = storeToRefs(store)

  /**
   * Handles the scroll event to trigger infinite loading.
   */
  function handleScroll () {
    if (loading.value || !hasMore.value) return
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement
    if (scrollHeight - scrollTop - clientHeight < 500) {
      store.fetchPosts({ pageSize: 5 })
    }
  }

  onMounted(() => {
    store.fetchPosts({ pageSize: 5, refresh: true })
    window.addEventListener('scroll', handleScroll)
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })
</script>

<template>
  <div>
    <PostCard v-for="post in posts" :key="post.id" class="mt-2 sm-mt-6" :post="post" />
    <div v-if="loading" class="text-center py-4">Loading more posts...</div>
    <div v-if="!hasMore && posts.length > 0" class="text-center py-4 text-gray-500">
      You've reached the end.
    </div>
    <div v-if="!loading && posts.length === 0" class="text-center py-10 text-gray-500">
      No posts for you yet. Follow more people and tags to see their posts here.
    </div>
  </div>
</template>
