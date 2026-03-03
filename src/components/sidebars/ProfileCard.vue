<script setup>
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import '@/styles/components/sidebars/profile-card.scss'

  const authStore = useAuthStore()
  const search = ref('')
  const logoutDialog = ref(false)
  const items = [
    {
      title: 'Profile',
      path: '/profile',
      icon: 'mdi-account',
    },
    {
      title: 'Settings',
      path: '/settings',
      icon: 'mdi-cog',
    },
  ]
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

  function handleLogout () {
    logoutDialog.value = true
  }

  async function confirmLogout () {
    await authStore.logout()
    logoutDialog.value = false
    router.push('/login')
  }

  function goTo (path) {
    router.push(path)
  }
</script>

<template>
  <section class="right-card profile-card">
    <div class="profile-top w-100">
      <v-menu class="w-100" content-class="profile-menu" open-on-hover>
        <template #activator="{ props }">
          <div class="d-flex align-center justify-between w-100" v-bind="props">
            <template v-if="currentUserName">
              <div class="profile-avatar mr-2">
                <v-img
                  v-if="currentUserPhoto"
                  alt="Profile"
                  class="h-100"
                  cover
                  :src="currentUserPhoto"
                />
                <span v-else>{{ currentUserInitials }}</span>
              </div>
              <div class="profile-info">
                <div class="profile-name">
                  {{ currentUserName }}
                </div>
              </div>
            </template>
            <v-spacer />
            <v-icon
              v-bind="props"
              icon="mdi-chevron-down"
            />
          </div>

        </template>
        <v-list color="primary">
          <template v-if="currentUserName">
            <v-list-item
              v-for="(item, index) in items"
              :key="index"
              :value="index"
              @click="goTo(item.path)"
            >
              <v-list-item-title>
                <v-icon :icon="item.icon" />
                {{ item.title }}
              </v-list-item-title>
            </v-list-item>
          </template>
          <v-list-item
            v-if="authStore.user"
            class="text-error"
            @click="handleLogout"
          >
            <v-list-item-title>
              <v-icon icon="mdi-logout" />
              Sign out
            </v-list-item-title>
          </v-list-item>
          <v-list-item
            v-else
            @click="goTo('/login')"
          >
            <v-list-item-title>
              <v-icon icon="mdi-logout" />
              Sign in
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <form-input
      v-model="search"
      class="profile-search"
      density="compact"
      hide-details
      placeholder="Search"
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
    />

    <!-- Logout Confirmation Dialog -->
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
            >Sign out</div>
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>
  </section>
</template>
