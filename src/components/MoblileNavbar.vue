<script setup>

  import { computed, ref } from 'vue'
  import MobileSlide from '@/components/MobileSlide.vue'
  import Sidebar from '@/components/sidebars/Sidebar.vue'
  import { useAuthStore } from '@/stores/auth.js'
  import '@/styles/components/mobile-navbar.scss'

  const drawer = ref(false)
  const authStore = useAuthStore()
  //
  const currentUserName = computed(() => authStore.user?.displayName)
  const currentUserPhoto = computed(() => authStore.user?.photoURL)

  const currentUserInitials = computed(() => {
    const name = currentUserName.value
    if (!name) {
      return ''
    }
    const parts = name.split(' ')
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase()
    }
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
  })
</script>

<template>
  <v-container class="mobile-navbar">
    <div class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon icon="mdi-menu" />
        <img alt="" class="logo ml-4" src="../assets/Logo.png" @click="$router.push('/')">
      </div>
      <div class="d-flex align-center">
        <v-icon icon="mdi-plus" />
        <v-icon class="ml-3" icon="mdi-bell-outline" />
        <div class="profile-avatar ml-3" @click="drawer = true">
          <v-img
            v-if="currentUserPhoto"
            alt="Profile"
            class="h-100 rounded-xl"
            cover
            :src="currentUserPhoto"
          />
          <span v-else>{{ currentUserInitials }}</span>
        </div>
      </div>
    </div>
    <MobileSlide v-model="drawer">
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquid autem cum, dolor dolorem ducimus eligendi excepturi, exercitationem facilis fugit itaque laborum natus nemo perferendis perspiciatis quia sint tenetur velit voluptates!
    </MobileSlide>
    <!--    <v-navigation-drawer-->
    <!--      v-if="!mdAndUp"-->
    <!--      v-model="drawer"-->
    <!--      app-->
    <!--      temporary-->
    <!--      width="280"-->
    <!--    >-->
    <!--      <Sidebar />-->
    <!--    </v-navigation-drawer>-->
  </v-container>
</template>

<style scoped lang="scss">

</style>
