<script setup>
  // =================================================================================================
  // Imports
  // =================================================================================================
  import { ref } from 'vue'
  import { useDisplay } from 'vuetify'
  import Rightbar from '@/components/sidebars/Rightbar.vue'
  import Sidebar from '@/components/sidebars/Sidebar.vue'

  // =================================================================================================
  // State
  // =================================================================================================
  // Controls the visibility of the mobile navigation drawer
  const drawer = ref(false)
  // Vuetify's display utility to handle responsive layout
  const { mdAndUp } = useDisplay()
</script>

<template>
  <v-app>
    <!-- Mobile Header -->
    <v-app-bar v-if="!mdAndUp" app color="surface" density="compact">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <v-toolbar-title>
        <router-link to="/">
          <img alt="Logo" src="@/assets/Logo.png" style="height: 32px; vertical-align: middle;">
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
    >
      <Sidebar />
    </v-navigation-drawer>

    <v-main>
      <v-container>
        <v-row>
          <!-- Desktop Sidebar (visible on medium screens and up) -->
          <v-col
            v-if="mdAndUp"
            lg="3"
            md="2"
          >
            <Sidebar />
          </v-col>

          <!-- Main Content -->
          <v-col
            cols="12"
            lg="6"
            md="8"
          >
            <!-- The main content of the page is injected here -->
            <slot />
          </v-col>

          <!-- Right Sidebar (visible on medium screens and up) -->
          <v-col
            v-if="mdAndUp"
            lg="3"
            md="2"
          >
            <Rightbar />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
