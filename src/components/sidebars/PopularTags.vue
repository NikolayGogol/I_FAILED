<template>
  <section class="right-card popular-card">
    <header class="right-card-header">
      <h3>Popular now</h3>
    </header>
    <div
      v-for="tag in popularTags"
      :key="tag"
      class="popular-row"
    >
      <span class="popular-tag">#{{ tag }}</span>
      <v-spacer />
      <v-btn icon size="small" variant="text">
        <v-icon>mdi-dots-horizontal</v-icon>
      </v-btn>
    </div>
  </section>
</template>

<script setup>
  import { ref } from 'vue'
  import { feedPopularTags } from '@/models/feed'
  import '@/styles/components/sidebars/popular-tags.scss'

  const popularTags = ref(feedPopularTags)
</script>
