<script setup>
  import { useDisplay } from 'vuetify'
  import MoblileNavbar from '@/components/MoblileNavbar.vue'
  import Sidebar from '@/components/sidebars/Sidebar.vue'
  import '@/styles/layouts/main-layout.scss'
  const { mdAndUp, smAndDown } = useDisplay()
</script>

<template>
  <v-app>
    <!-- Mobile Header -->
    <moblile-navbar v-if="smAndDown" />
    <v-main>
      <!-- Use fluid container on mobile to maximize width, contained on larger screens -->
      <v-container class="pa-0 pa-md-4 main-container" :fluid="!mdAndUp">
        <v-row justify="center" no-gutters>
          <!-- Desktop Sidebar (visible on medium screens and up) -->
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
          <v-col
            class="px-md-2"
            cols="12"
            lg="9"
            md="9"
            xl="10"
          >
            <!-- The main content of the page is injected here -->
            <slot />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
