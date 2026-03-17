<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { usePopularTagsStore } from '@/stores/popular-tags'
  import '@/styles/components/sidebars/popular-tags.scss'

  const popularTagsStore = usePopularTagsStore()

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

  const displayLimit = ref(5)

  const visibleTags = computed(() => {
    return popularTagsStore.allTags.slice(0, displayLimit.value)
  })

  const hasMoreTags = computed(() => {
    return popularTagsStore.allTags.length > displayLimit.value
  })

  function showMoreTags () {
    displayLimit.value += 5
  }

  onMounted(() => {
    popularTagsStore.getPopularTags()
  })
</script>

<template>
  <section class="right-card popular-card">
    <header class="right-card-header">
      <h3 class="font-weight-semibold">Popular now</h3>
    </header>
    <div
      v-for="tag in visibleTags"
      :key="tag"
      class="popular-row"
    >
      <span class="popular-tag">#{{ tag }}</span>
      <v-spacer />
      <v-btn icon size="small" variant="text">
        <v-icon>mdi-dots-horizontal</v-icon>
      </v-btn>
    </div>

    <!-- Show More Button -->
    <div v-if="hasMoreTags" class="text-center mt-2">
      <v-btn
        color="primary"
        size="small"
        variant="text"
        @click="showMoreTags"
      >
        Show more
      </v-btn>
    </div>
  </section>
  <div class="footer-link py-2">
    <div v-for="(nav, index) in footerLink" :key="index" class="px-2 py-1">
      <router-link :to="nav.path">{{ nav.label }}</router-link>
    </div>
  </div>
</template>
