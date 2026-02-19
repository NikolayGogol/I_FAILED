<template>
  <aside class="feed-rightbar">
    <ProfileCard />
    <WhoToFollow />
    <PopularTags />
  </aside>
</template>

<script setup>
  import PopularTags from '@/components/sidebars/PopularTags.vue'
  import ProfileCard from '@/components/sidebars/ProfileCard.vue'
  import WhoToFollow from '@/components/sidebars/WhoToFollow.vue'
  import '@/styles/components/sidebars/rightbar.scss'
</script>
