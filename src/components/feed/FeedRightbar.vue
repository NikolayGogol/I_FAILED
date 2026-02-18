<template>
  <aside class="feed-rightbar">
    <ProfileCard />
    <WhoToFollow />
    <PopularTags />
  </aside>
</template>

<script setup>
  import PopularTags from '@/components/feed/PopularTags.vue'
  import ProfileCard from '@/components/feed/ProfileCard.vue'
  import WhoToFollow from '@/components/feed/WhoToFollow.vue'
  import '@/styles/components/feed-rightbar.scss'
</script>
