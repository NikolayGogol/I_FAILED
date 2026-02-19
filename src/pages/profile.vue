<route lang="json">
{
  "meta": {
    "layout": "MainLayout",
    "auth": true
  }
}
</route>

<script setup>
  import { ref } from 'vue'
  import PostCard from '@/components/feed/PostCard.vue'
  import UserCard from '@/components/profile/UserCard.vue'
  import { feedPosts } from '@/models/feed'
  import '@/styles/pages/profile.scss'

  const posts = ref(feedPosts)
</script>

<template>
  <div class="profile-page">
    <section class="profile-main">
      <UserCard />

      <div class="content-feed">
        <nav class="user-tabs">
          <button class="tab-item active">Posts (2)</button>
          <button class="tab-item">Activity</button>
        </nav>

        <div class="create-post-card">
          <div class="create-post-content">
            <div class="user-avatar-mini">SC</div>
            <div class="post-input-placeholder">What's new?</div>
            <button class="write-post-btn">Write a post</button>
          </div>
        </div>

        <div class="profile-posts">
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
