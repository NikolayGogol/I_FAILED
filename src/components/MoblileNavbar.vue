<script setup>

  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import MobileSlide from '@/components/MobileSlide.vue'
  import { getIcon } from '@/models/icons.js'
  import { useAuthStore } from '@/stores/auth.js'
  import { useMainStore } from '@/stores/main/main.js'
  import '@/styles/components/mobile-navbar.scss'
  const { mdAndUp } = useDisplay()

  const logoutDialog = ref(false)
  const mainStore = useMainStore()

  const drawer = ref(false)
  const aside = ref(false)
  const authStore = useAuthStore()
  const router = useRouter()
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

  function goTo (path) {
    router.push(path)
    drawer.value = false
  }

  function handleLogout () {
    logoutDialog.value = true
  }

  async function confirmLogout () {
    await authStore.logout()
    logoutDialog.value = false
    drawer.value = false
    await router.push('/login')
  }
  const notifications = computed(() => mainStore.notifications)

</script>

<template>
  <v-container class="mobile-navbar">
    <div class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon icon="mdi-menu" @click="aside = !aside" />
        <img alt="" class="logo ml-4" src="../assets/Logo.png" @click="$router.push('/')">
      </div>
      <div class="d-flex align-center">
        <v-icon color="grey-darken-1" icon="mdi-plus" @click="$router.push('/create-post')" />
        <div class="position-relative ml-2" @click="$router.push('/notifications')">
          <div v-if="notifications > 0" class="badge">{{ notifications }}</div>
          <div class="d-flex" v-html="getIcon('bell')" />
        </div>
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
      <ul class="mobile-navbar-list">
        <li v-if="authStore.user" @click="goTo('/profile')">
          <div class="profile-avatar mr-3" @click="drawer = true">
            <v-img
              v-if="currentUserPhoto"
              alt="Profile"
              class="h-100 rounded-xl"
              cover
              :src="currentUserPhoto"
            />
            <span v-else>{{ currentUserInitials }}</span>
          </div>
          Profile
        </li>
        <li v-if="authStore.user" @click="goTo('/settings')">
          <v-icon class="mr-4" icon="mdi-cog-outline" />
          Settings
        </li>
        <li
          v-if="authStore.user"
          class="text-danger"
          @click="handleLogout"
        >
          <v-icon class="mr-4" icon="mdi-logout" />
          Sign out
        </li>
        <li v-else class="text-danger" @click="goTo('/login')">
          <v-icon class="mr-4" icon="mdi-logout" />
          Sign in
        </li>
      </ul>
    </MobileSlide>
    <v-dialog v-model="logoutDialog" max-width="400">
      <v-card class="logout-dialog-card py-6">
        <v-card-title class="text-center">Sign out?</v-card-title>
        <v-card-text class="text-center pt-0">
          Are you sure you want to sign out?
        </v-card-text>
        <v-row class="px-6">
          <v-col>
            <div class="cancel-btn" @click="logoutDialog = false">Cancel</div>
          </v-col>
          <v-col>
            <div
              class="submit-btn"
              @click="confirmLogout"
            >Sign out
            </div>
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>
    <v-navigation-drawer
      v-if="!mdAndUp"
      v-model="aside"
      app
      temporary
      width="280"
    >
      <v-icon class="mt-3 ml-3" icon="mdi-close" @click="aside = false" />
      <Sidebar />
    </v-navigation-drawer>
  </v-container>
</template>

<style scoped lang="scss">

</style>
