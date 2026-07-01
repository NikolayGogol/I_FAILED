<script setup>
  import { computed } from 'vue'
  import ProfileCard from '@/components/sidebars/ProfileCard.vue'
  import Subscribe from '@/components/sidebars/Subscribe.vue'
  import WhoToFollow from '@/components/sidebars/WhoToFollow.vue'
  import { useAuthStore } from '@/stores/auth.js'
  import { isPremium } from '@/utils/premium.js'
  import '@/styles/components/sidebars/rightbar.scss'
  const authStore = useAuthStore()
  const currentUserName = computed(() => authStore.user?.displayName)

</script>
<template>
  <aside class="feed-rightbar">
    <ProfileCard />
    <Subscribe v-if="!isPremium" class="mt-5" />
    <WhoToFollow v-if="currentUserName" />
    <PopularTags v-if="currentUserName" />
  </aside>
</template>
