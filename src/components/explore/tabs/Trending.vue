<script setup>
  import { storeToRefs } from 'pinia'
  import { onMounted, onUnmounted, ref } from 'vue'
  import { getIcon } from '@/models/icons.js'
  import { backgroundColors } from '@/models/no-data.js'
  import { useTrendingStore } from '@/stores/explore/trending.js'
  import { timeTransformAgo } from '@/utils/time.js'
  import { transformUsername } from '@/utils/transform-username.js'

  const trendingStore = useTrendingStore()
  const { posts, loading, hasMore } = storeToRefs(trendingStore)
  const colors = [
    '#F4B740',
    '#A9A9A3',
    '#CD7F32',
  ]
  const sentinel = ref(null)
  let observer = null
  function loadMore () {
    if (hasMore.value && !loading.value) {
      trendingStore.fetchTrendingPosts()
    }
  }

  onMounted(() => {
    // Reset and fetch initial data
    trendingStore.reset()
    trendingStore.fetchTrendingPosts()

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          loadMore()
        }
      },
      {
        root: null, // viewport
        threshold: 1,
      },
    )

    if (sentinel.value) {
      observer.observe(sentinel.value)
    }
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })
  function getRandomColor () {
    const randomIndex = Math.floor(Math.random() * backgroundColors.length)
    return backgroundColors[randomIndex]
  }
  function getInitials (name) {
    if (!name) return ''
    const parts = name.split(' ')
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase()
    }
    return (parts[0].charAt(0) + (parts[1]?.charAt(0) || '')).toUpperCase()
  }

</script>

<template>
  <div class="tab">
    <h2>Trending Failures (Last 24h)</h2>
    <div class="posts-container">
      <div v-for="(post, index) in posts" :key="post.id" class="post">
        <div class="d-flex align-center">
          <div class="position" :style="{ color: colors[index] }">#{{ index+1 }}</div>
          <div class="d-block ml-6 w-100">
            <div class="d-flex">
              <v-img
                v-if="post.user?.photoURL"
                :alt="post.user?.displayName"
                class="user-avatar"
                cover
                :src="post.user?.photoURL"
              />
              <div v-else class="avatar" :style="{ backgroundColor: getRandomColor() }">
                {{ getInitials(post.user.displayName) }}
              </div>
              <div class="user-info ml-4 w-100">
                <div class="d-flex align-center justify-space-between w-100">
                  <div class="d-flex align-center">
                    <p>{{ post.user.displayName }}</p>
                    <div class="time ml-2">• {{ timeTransformAgo(post.createdAt) }}</div>
                  </div>
                  <div class="tag">{{ post.selectedCategories[0].label }}</div>
                </div>
                <p class="text-description">{{ transformUsername(post.user.userName, post.user.displayName) }}</p>
              </div>
            </div>
            <div class="title">{{ post.title }}</div>
            <div class="d-flex footer-panel">
              <div class="d-flex mr-4">
                <div class="d-flex mr-2" v-html="getIcon('eye', 20, 20)" />
                <span>{{ post.views }}</span>
              </div>
              <div class="d-flex">
                <div class="d-flex mr-2" v-html="getIcon('mark', 20, 20)" />
                <span>{{ post.bookmarks || 0 }}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <div ref="sentinel" class="sentinel" />

    <v-progress-linear v-if="loading" class="mt-9" color="primary" indeterminate />

    <div v-if="!hasMore && !loading" class="no-more-posts">
      <p>No more posts to show.</p>
    </div>
  </div>
</template>
