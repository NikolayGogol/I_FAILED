<route lang="json">
{
"meta": {
"layout": "MainLayout"
}
}
</route>
<template>
  <div class="feed-page">
    <section class="feed-main">
      <!-- Tabs -->
      <div class="feed-tabs">
        <button
          class="feed-tab"
          :class="{ active: activeTab === 'latest' }"
          @click="activeTab = 'latest'"
        >
          Latest
        </button>
        <button
          class="feed-tab"
          :class="{ active: activeTab === 'popular' }"
          @click="activeTab = 'popular'"
        >
          Popular
        </button>
        <button
          class="feed-tab"
          :class="{ active: activeTab === 'forYou' }"
          @click="activeTab = 'forYou'"
        >
          For You
        </button>
      </div>

      <!-- Composer -->
      <div class="composer-card ">
        <v-btn
          class="write-post-btn"
          color="primary"
          rounded="lg"
          variant="outlined"
        >
          Write a post
        </v-btn>
      </div>

      <!-- Posts -->
      <PostCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
      />
    </section>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import PostCard from '@/components/feed/PostCard.vue'
  import { feedPosts } from '@/models/feed'
  import '@/styles/pages/index.scss'

  const activeTab = ref('latest')

  const posts = ref(feedPosts)
</script>
