<template>
  <div class="not-found-page">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <h1 class="error-title">Page Not Found</h1>
      <p class="error-message">
        Oops! It seems you've ventured into uncharted territory. The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <v-btn
        class="home-btn"
        color="primary"
        height="48"
        rounded="lg"
        to="/"
        width="200"
      >
        Go to Homepage
      </v-btn>
    </div>
  </div>
</template>

<script setup>
  import '@/styles/pages/404.scss'
</script>
