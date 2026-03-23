<script setup>
  import { computed } from 'vue'
  import ProfileCard from '@/components/sidebars/ProfileCard.vue'
  import WhoToFollow from '@/components/sidebars/WhoToFollow.vue'
  import { useAuthStore } from '@/stores/auth.js'
  import '@/styles/components/sidebars/rightbar.scss'
  const authStore = useAuthStore()
  const currentUserName = computed(() => authStore.user?.displayName)

</script>
<template>
  <aside class="feed-rightbar">
    <ProfileCard />
    <WhoToFollow v-if="currentUserName" />
    <PopularTags v-if="currentUserName" />
  </aside>
</template>
