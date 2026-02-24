<script setup>
  import { ref } from 'vue'
  import Rightbar from '@/components/sidebars/Rightbar.vue'
  import Sidebar from '@/components/sidebars/Sidebar.vue'
  import { useDisplay } from 'vuetify'

  const drawer = ref(false)
  const { mdAndUp } = useDisplay()
</script>

<template>
  <v-app>
    <!-- Mobile Header -->
    <v-app-bar v-if="!mdAndUp" app color="surface" density="compact">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <v-toolbar-title>
        <router-link to="/">
          <img src="@/assets/Logo.png" alt="Logo" style="height: 32px; vertical-align: middle;">
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
          <!-- Desktop Sidebar -->
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
            <slot />
          </v-col>

          <!-- Right Sidebar (hidden on smaller screens) -->
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
