<script setup>
  import { storeToRefs } from 'pinia'
  import { onMounted } from 'vue'
  import { getIcon } from '@/models/icons.js'
  import { backgroundColors } from '@/models/no-data.js'
  import { useDiscoverStore } from '@/stores/discover.js'
  import { useForYouStore } from '@/stores/feed/forYou.js'
  const store = useForYouStore()
  const { filteredPosts: posts, loading } = storeToRefs(store)
  const discoverStore = useDiscoverStore()
  onMounted(() => {
    store.fetchPosts({ pageSize: 3, refresh: true })
    discoverStore.fetchSimilarPost()
      .then(res => {
        console.log(res)
      })
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
    <div class="d-flex align-center justify-space-between">
      <h2>Similar to What You've Read</h2>
      <p class="text-description cursor-pointer">See all</p>
    </div>
    <div class="posts-container">
      <div v-for="post in posts" :key="post.id" class="post">
        <div class="d-flex align-center">
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
                  </div>
                  <div class="tag">{{ post.selectedCategories[0].label }}</div>
                </div>
              </div>
            </div>
            <div class="title">{{ post.title }}</div>
            <div class="d-flex footer-panel">
              <div class="d-flex">
                <div class="d-flex mr-2" v-html="getIcon('mark', 20, 20)" />
                <span>{{ post.bookmarks || 0 }} saves</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
    <v-progress-linear v-if="loading" class="mt-9" color="primary" indeterminate />
    <div v-if="!loading && posts.length === 0" class="text-center py-10 text-gray-500">
      No posts for you yet. Follow more people and tags to see their posts here.
    </div>
    <h2 class="my-6">People who read "Business" failures also viewed</h2>
  </div>
</template>
