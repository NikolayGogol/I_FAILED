<template>
  <div class="feed-page">
    <main class="feed-shell">
      <section class="feed-layout">
        <!-- Left sidebar -->
        <FeedSidebar active-id="failure-age" />

        <!-- Center feed -->
        <section class="feed-main">
          <div class="page-header">
            <h1>Failure Age</h1>
            <p>Calculate your resilience and growth over time.</p>
          </div>

          <div class="age-calculator">
            <div class="calculator-input">
              <label>Enter your birth year:</label>
              <input placeholder="1990" type="number">
            </div>
            <div class="calculator-result">
              <p>Your Failure Age is: <strong>33</strong></p>
              <p class="result-desc">You have experienced 33 years of learning opportunities.</p>
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
  import '@/styles/pages/failure-age.scss'
</script>
