<script setup>
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import SearchInput from '@/components/SearchInput.vue'
  import { getIcon } from '@/models/icons.js'
  import { useAuthStore } from '@/stores/auth'
  import '@/styles/components/sidebars/profile-card.scss'

  const authStore = useAuthStore()
  const logoutDialog = ref(false)
  const isLoggingOut = ref(false)
  const items = [
    {
      title: 'Profile',
      path: '/profile',
      icon: getIcon('account-tabs'),
    },
    {
      title: 'Settings',
      path: '/settings',
      icon: getIcon('gear'),
    },
  ]
  const footerLink = [
    {
      label: 'Terms of Service',
      path: '#',
    },
    {
      label: 'Privacy Policy',
      path: '#',
    },
    {
      label: 'Cookie Policy',
      path: '#',
    },
    {
      label: 'Accessibility',
      path: '#',
    },
    {
      label: 'Ads',
      path: '#',
    },
    {
      label: 'More',
      path: '#',
    },
  ]

  const router = useRouter()

  // Computed property for the current user's name
  const currentUserName = computed(() => authStore.user?.displayName)
  // Computed property for the current user's photo URL
  const currentUserPhoto = computed(() => authStore.user?.photoURL)
  // Computed property for the current user's initials
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

  /**
   * Opens the logout confirmation dialog.
   */
  function handleLogout () {
    logoutDialog.value = true
  }

  /**
   * Confirms and performs the logout.
   */
  async function confirmLogout () {
    isLoggingOut.value = true
    await authStore.logout()
    isLoggingOut.value = false
    logoutDialog.value = false
  }

  /**
   * Navigates to a given path.
   * @param {string} path - The path to navigate to.
   */
  function goTo (path) {
    router.push(path)
  }
</script>

<template>
  <section class="right-card profile-card">
    <div v-if="currentUserName" class="profile-top w-100">
      <v-menu class="w-100" content-class="profile-menu" open-on-hover>
        <template #activator="{ props }">
          <div class="d-flex align-center justify-between w-100" v-bind="props">
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
                <div class="d-flex" v-html="item.icon" />
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
        </v-list>
      </v-menu>
    </div>
    <v-card v-else class="rounded-xl elevation-0 pa-3 login-in-panel">
      <v-card-title class="pa-0">Want to join our community? </v-card-title>
      <v-card-subtitle class="pa-0">Sign up today to for more stories!</v-card-subtitle>
      <div class="cancel-btn mt-4" @click="goTo('/register')">Sign up</div>
      <div class="submit-btn mt-2" @click="goTo('/login')">Login</div>
    </v-card>
    <SearchInput v-if="currentUserName" />
    <div v-if="!currentUserName" class="footer-link py-2">
      <div v-for="(nav, index) in footerLink" :key="index" class="px-2 py-1">
        <router-link :to="nav.path">{{ nav.label }}</router-link>
      </div>
    </div>
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
              :disabled="isLoggingOut"
              @click="confirmLogout"
            >
              <v-progress-circular
                v-if="isLoggingOut"
                class="mr-2"
                indeterminate
                size="20"
                width="2"
              />
              <span v-else>Sign out</span>
            </div>
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>
  </section>
</template>
