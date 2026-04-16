<route lang="json">
{
  "meta": {
    "layout": "MainLayout",
    "auth": true
  }
}
</route>
<script setup>
  import { onMounted, onUnmounted, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { VProgressLinear } from 'vuetify/components'
  import { useDiscoverStore } from '@/stores/explore/discover.js'

  const route = useRoute()
  const discoverStore = useDiscoverStore()

  const category = ref({ id: route.query.id, label: route.query.label })
  const posts = ref([])
  const nextCursorDocId = ref(null)
  const hasMore = ref(true)
  const loading = ref(false)
  const pageSize = 5
  const scrollTrigger = ref(null)
  let observer = null

  async function loadPosts (refresh = false) {
    if (loading.value || (!hasMore.value && !refresh)) {
      return
    }

    loading.value = true
    try {
      const { posts: newPosts, nextCursorDocId: newNextCursorDocId, hasMore: newHasMore } = await discoverStore.getPostByCategory(
        category.value,
        pageSize,
        refresh ? null : nextCursorDocId.value,
      )

      if (refresh) {
        posts.value = newPosts
      } else {
        posts.value.push(...newPosts)
      }
      nextCursorDocId.value = newNextCursorDocId
      hasMore.value = newHasMore
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    loadPosts(true)
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          loadPosts()
        }
      },
      {
        rootMargin: '200px',
      },
    )

    if (scrollTrigger.value) {
      observer.observe(scrollTrigger.value)
    }
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })

  watch(
    scrollTrigger,
    (newTrigger, oldTrigger) => {
      if (observer) {
        if (oldTrigger) {
          observer.unobserve(oldTrigger)
        }
        if (newTrigger) {
          observer.observe(newTrigger)
        }
      }
    },
  )

  watch(
    () => route.query,
    newQuery => {
      category.value = { id: newQuery.id, label: newQuery.label }
      posts.value = []
      nextCursorDocId.value = null
      hasMore.value = true
      loadPosts(true)
    },
    { deep: true },
  )
</script>

<template>
  <div class="category-page">
    <div class="d-flex align-center d-sm-block">
      <v-icon class="cursor-pointer" icon="mdi-arrow-left" @click="$router.go(-1)" />
      <h1 class="font-weight-bold text-grey-darken-3 ml-3 ml-sm-0">{{ category.label }}</h1>
    </div>
    <p class="text-description">{{ route.query.counter }} posts</p>
    <div v-if="posts.length > 0" class="mt-6">
      <PostCard v-for="post in posts" :key="post.id" :post="post" />
    </div>
    <div v-else-if="!loading" class="text-center my-10">
      No posts found for this category.
    </div>

    <v-progress-linear
      v-if="loading"
      class="my-4"
      color="primary"
      indeterminate
    />

    <div v-if="hasMore && !loading" ref="scrollTrigger" />
  </div>
</template>

<style scoped lang="scss">
.category-page {
  padding: 20px;
}
</style>
