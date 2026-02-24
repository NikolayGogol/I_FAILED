<template>
  <component :is="layout">
    <router-view />
  </component>
</template>

<script setup>
  import { computed, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import AuthLayout from '@/layouts/AuthLayout.vue'
  import AuthMinLayout from '@/layouts/AuthMinLayout.vue'
  import MainLayout from '@/layouts/MainLayout.vue'
  import MainMinLayout from '@/layouts/MainMinLayout.vue'
  import { useAuthStore } from '@/stores/auth'

  const route = useRoute()
  const authStore = useAuthStore()

  const layouts = {
    AuthLayout,
    MainLayout,
    MainMinLayout,
    AuthMinLayout,
  }

  const layout = computed(() => {
    return layouts[route.meta.layout] || 'div'
  })

  onMounted(() => {
    // Initialize auth state listener
    authStore.initAuthListener()
  })
</script>
