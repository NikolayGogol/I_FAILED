<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
  import { onMounted } from 'vue'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()

  onMounted(() => {
    // Initialize auth state listener
    authStore.initAuthListener()
  })
</script>
