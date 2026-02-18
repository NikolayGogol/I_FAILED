<template>
  <div class="feed-page">
    <main class="feed-shell">
      <section class="feed-layout">
        <!-- Left sidebar -->
        <FeedSidebar active-id="library" />

        <!-- Center feed -->
        <section class="feed-main">
          <div class="page-header">
            <h1>Library</h1>
            <p>Your saved posts and resources.</p>
          </div>

          <div class="library-grid">
            <div v-for="i in 4" :key="i" class="library-card">
              <div class="library-icon">
                <v-icon color="primary">mdi-bookmark-outline</v-icon>
              </div>
              <div class="library-content">
                <h3>Saved Article {{ i }}</h3>
                <p>A detailed breakdown of why my SaaS failed.</p>
                <span class="library-date">Saved on Oct 12</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Right sidebar -->
        <FeedRightbar />
      </section>
    </main>
  </div>
</template>

<script setup>
  import FeedRightbar from '@/components/feed/FeedRightbar.vue'
  import FeedSidebar from '@/components/feed/FeedSidebar.vue'
  import '@/styles/pages/index.scss'
  import '@/styles/pages/library.scss'
</script>
