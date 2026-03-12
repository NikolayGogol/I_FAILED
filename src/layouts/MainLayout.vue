<script setup>
  // =================================================================================================
  // Imports
  // =================================================================================================
  import { ref } from 'vue'
  import { useDisplay } from 'vuetify'
  import Rightbar from '@/components/sidebars/Rightbar.vue'
  import Sidebar from '@/components/sidebars/Sidebar.vue'
  import '@/styles/layouts/main-layout.scss'

  // =================================================================================================
  // State
  // =================================================================================================
  // Controls the visibility of the mobile navigation drawer
  const drawer = ref(false)
  // Vuetify's display utility to handle responsive layout
  const { mdAndUp, lgAndUp } = useDisplay()
</script>

<template>
  <v-app>
    <!-- Mobile Header -->
    <v-app-bar
      v-if="!mdAndUp"
      app
      border
      color="surface"
      density="compact"
      flat
    >
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <v-toolbar-title>
        <router-link to="/">
          <img alt="Logo" src="@/assets/Logo.png" style="height: 28px; vertical-align: middle;">
        </router-link>
      </v-toolbar-title>
      <v-spacer />
      <!-- You can add other icons here, like search or notifications -->
    </v-app-bar>

    <!-- Navigation Drawer for Mobile -->
    <v-navigation-drawer
      v-if="!mdAndUp"
      v-model="drawer"
      app
      temporary
      width="280"
    >
      <Sidebar />
    </v-navigation-drawer>

    <v-main>
      <!-- Use fluid container on mobile to maximize width, contained on larger screens -->
      <v-container class="pa-0 pa-md-4 main-container" :fluid="!mdAndUp">
        <v-row justify="center" no-gutters>
          <!-- Desktop Sidebar (visible on medium screens and up) -->
          <!-- Takes 3 cols on tablet, 3 on desktop -->
          <v-col
            v-if="mdAndUp"
            class="pr-md-4"
            cols="12"
            lg="3"
            md="3"
            xl="2"
          >
            <div class="sticky-sidebar">
              <Sidebar />
            </div>
          </v-col>

          <!-- Main Content -->
          <!-- Takes full width on mobile, 9 cols on tablet, 6 cols on desktop -->
          <v-col
            class="px-md-2"
            cols="12"
            lg="6"
            md="9"
            xl="6"
          >
            <!-- The main content of the page is injected here -->
            <slot />
          </v-col>

          <!-- Right Sidebar (visible on large screens and up) -->
          <!-- Hidden on tablet to give more space to content -->
          <v-col
            v-if="lgAndUp"
            class="pl-lg-4"
            cols="12"
            lg="3"
            xl="3"
          >
            <div class="sticky-sidebar">
              <Rightbar />
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style lang="scss" scoped>
.main-container {
  max-width: 1440px;
  margin: 0 auto;
}

.sticky-sidebar {
  position: sticky;
  top: 15px;
  height: calc(100vh - 80px);
  overflow-y: auto;

  /* Hide scrollbar for Chrome, Safari and Opera */
  &::-webkit-scrollbar {
    display: none;
  }

  /* Hide scrollbar for IE, Edge and Firefox */
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>
