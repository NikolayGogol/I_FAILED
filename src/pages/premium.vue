<template>
  <div class="feed-page">
    <main class="feed-shell">
      <section class="feed-layout">
        <!-- Left sidebar -->
        <FeedSidebar active-id="premium" />

        <!-- Center feed -->
        <section class="feed-main">
          <div class="page-header">
            <h1>Premium</h1>
            <p>Unlock exclusive features and insights.</p>
          </div>

          <div class="premium-plans">
            <div class="plan-card basic">
              <h3>Basic</h3>
              <p class="price">$0/mo</p>
              <ul>
                <li>Access to public feed</li>
                <li>Basic analytics</li>
              </ul>
              <v-btn block variant="outlined">Current Plan</v-btn>
            </div>
            <div class="plan-card pro">
              <h3>Pro</h3>
              <p class="price">$19/mo</p>
              <ul>
                <li>Access to premium content</li>
                <li>Advanced analytics</li>
                <li>Priority support</li>
              </ul>
              <v-btn block color="primary">Upgrade to Pro</v-btn>
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
  import '@/styles/pages/premium.scss'
</script>
