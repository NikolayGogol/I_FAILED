<script setup>
  import Sidebar from '@/components/sidebars/Sidebar.vue'
</script>

<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row>
          <v-col
            lg="3"
          >
            <Sidebar />
          </v-col>
          <v-col
            cols="12"
            lg="9"
          >
            <slot />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
