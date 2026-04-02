<route lang="json">
{
  "meta": {
    "layout": "MainLayout",
    "auth": true
  }
}
</route>

<script setup>
  import Age from '@/components/failure-age/age.vue'
  import '@/styles/pages/failure-age.scss'
</script>
<template>
  <div class="failure-age-page">
    <h1 class="font-weight-bold text-grey-darken-3 ml-3 ml-sm-0 title">Your Failure Age</h1>
    <p class="text-description fs-16">A measure of wisdom gained through shared failures and growth</p>
    <age class="mt-4" />
  </div>
</template>
