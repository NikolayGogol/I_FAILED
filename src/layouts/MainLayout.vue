<script setup>
  import { useDisplay } from 'vuetify'
  import MoblileNavbar from '@/components/MoblileNavbar.vue'
  import Rightbar from '@/components/sidebars/Rightbar.vue'
  import Sidebar from '@/components/sidebars/Sidebar.vue'
  import '@/styles/layouts/main-layout.scss'
  const { mdAndUp, lgAndUp, smAndDown } = useDisplay()
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
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>
