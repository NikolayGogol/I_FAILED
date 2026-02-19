<route lang="json">
{
  "meta": {
    "layout": "MainLayout",
    "auth": true
  }
}
</route>

<template>
  <div class="profile-page">
    <div class="profile-main">
      <UserCard />
    </div>
  </div>
</template>

<script setup>
  import UserCard from '@/components/profile/UserCard.vue'
</script>

<style scoped>
</style>
