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
    <section class="profile-main">
      <UserCard />
    </section>
  </div>
</template>

<script setup>
  import UserCard from '@/components/profile/UserCard.vue'
  import '@/styles/pages/profile.scss'
</script>
