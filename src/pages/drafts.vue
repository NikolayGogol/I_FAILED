<route lang="json">
  {
  "meta": {
    "layout": "MainLayout",
    "auth": true
  }
}
</route>
<script setup>
  import { storeToRefs } from 'pinia'
  import { onMounted } from 'vue'
  import DraftCard from '@/components/profile/DraftCard.vue'
  import { useAuthStore } from '@/stores/auth.js'
  import { useProfileStore } from '@/stores/profile/profile.js'

  const profileStore = useProfileStore()
  const authStore = useAuthStore()
  const { drafts, loading } = storeToRefs(profileStore)
  //
  onMounted(() => {
    if (authStore.user?.uid) {
      profileStore.fetchUserPosts(authStore.user.uid)
    }
  })
</script>

<template>
  <div class="drafts-wrapper">
    <div class="d-flex align-center d-sm-block">
      <v-icon class="cursor-pointer" icon="mdi-arrow-left" @click="$router.go(-1)" />
      <h1 class="font-weight-bold text-grey-darken-3 ml-3 ml-sm-0">Drafts</h1>
    </div>
    <div v-if="loading" class="d-flex justify-center my-6">
      <v-progress-circular color="primary" indeterminate />
    </div>
    <template v-else-if="drafts.length > 0">
      <DraftCard v-for="(card, index) in drafts" :key="index" :card="card" />
    </template>
    <div v-else class="d-flex flex-column align-center justify-center py-16 text-grey">
      <v-icon class="mb-4" color="grey-lighten-1" icon="mdi-text-box-remove-outline" size="64" />
      <h3 class="text-h6 font-weight-medium text-grey-darken-1">No drafts yet</h3>
      <p class="text-body-1 mt-2">When you save a post as a draft, it will appear here.</p>
    </div>

  </div>
</template>
