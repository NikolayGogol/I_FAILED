<template>
  <section class="right-card popular-card">
    <header class="right-card-header">
      <h3 class="font-weight-semibold">Popular now</h3>
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
  <div class="footer-link py-2">
    <div v-for="(nav, index) in footerLink" :key="index" class="px-2 py-1">
      <router-link :to="nav.path">{{ nav.label }}</router-link>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { feedPopularTags } from '@/models/feed'
  import '@/styles/components/sidebars/popular-tags.scss'

  const popularTags = ref(feedPopularTags)

  const footerLink = [
    {
      label: 'Terms of Service',
      path: '#',
    },
    {
      label: 'Privacy Policy',
      path: '#',
    },
    {
      label: 'Accessibility',
      path: '#',
    },
    {
      label: 'Cookie Policy',
      path: '#',
    },
    {
      label: 'Ads',
      path: '#',
    },
    {
      label: 'More',
      path: '#',
    },
  ]
</script>
