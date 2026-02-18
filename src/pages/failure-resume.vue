<template>
  <div class="feed-page">
    <main class="feed-shell">
      <section class="feed-layout">
        <!-- Left sidebar -->
        <FeedSidebar active-id="failureResume" />

        <!-- Center feed -->
        <section class="feed-main">
          <div class="page-header">
            <h1>Failure Resume</h1>
            <p>Document your journey and learn from setbacks.</p>
          </div>

          <div class="resume-content">
            <div class="resume-section">
              <h2>2023</h2>
              <ul>
                <li>Failed to launch Product X on time.</li>
                <li>Lost a key client due to miscommunication.</li>
              </ul>
            </div>
            <div class="resume-section">
              <h2>2022</h2>
              <ul>
                <li>Rejected from Y Combinator.</li>
                <li>Shut down side project after 6 months.</li>
              </ul>
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
  import '@/styles/pages/failure-resume.scss'
</script>
