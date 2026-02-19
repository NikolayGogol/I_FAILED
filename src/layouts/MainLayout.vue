<script setup>
  import { ref } from 'vue'

  import FeedRightbar from '@/components/feed/FeedRightbar.vue'
  import FeedSidebar from '@/components/feed/FeedSidebar.vue'
  const activeNav = ref('feed')

</script>
<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row>
          <v-col cols="3">
            <FeedSidebar :active-id="activeNav" />
          </v-col>
          <v-col cols="6">
            <slot />
          </v-col>
          <v-col cols="3">
            <FeedRightbar />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
