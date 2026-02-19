<script setup>
  import Rightbar from '@/components/sidebars/Rightbar.vue'
  import Sidebar from '@/components/sidebars/Sidebar.vue'
</script>

<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row>
          <v-col
            lg="3"
            md="2"
          >
            <Sidebar />
          </v-col>
          <v-col
            cols="12"
            lg="6"
            md="8"
          >
            <slot />
          </v-col>
          <v-col
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
