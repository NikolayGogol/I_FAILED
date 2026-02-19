<script setup>
  import FeedRightbar from '@/components/feed/FeedRightbar.vue'
  import FeedSidebar from '@/components/feed/FeedSidebar.vue'
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
            <FeedSidebar />
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
            <FeedRightbar />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
