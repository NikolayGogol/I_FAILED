<route lang="json">
{
  "meta": {
    "layout": "MainLayout"
  }
}
</route>

<script setup>
  import '@/styles/pages/explore.scss'
</script>

<template>
  <div class="explore-page">
    <section class="explore-main">
      <div class="page-header">
        <h1>Explore</h1>
        <p>Discover new failures and learnings from the community.</p>
      </div>

      <div class="explore-grid">
        <div v-for="i in 6" :key="i" class="explore-card">
          <v-img
            aspect-ratio="1.19"
            class="explore-image"
            cover
            src="https://picsum.photos/606/510"
          />
          <div class="explore-content">
            <h3>Trending Topic {{ i }}</h3>
            <p>1.2k posts</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
