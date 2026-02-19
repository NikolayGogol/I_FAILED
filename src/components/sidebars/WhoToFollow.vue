<template>
  <section class="right-card follow-card">
    <header class="right-card-header">
      <h3>Who to follow</h3>
    </header>
    <div
      v-for="person in whoToFollow"
      :key="person.id"
      class="follow-row"
    >
      <div class="follow-avatar">
        <span>{{ person.initials }}</span>
      </div>
      <div class="follow-info">
        <div class="follow-name">{{ person.name }}</div>
        <div class="follow-handle">{{ person.handle }}</div>
      </div>
      <v-spacer />
      <v-btn
        class="follow-btn"
        color="primary"
        height="32"
        variant="flat"
      >
        Follow
      </v-btn>
    </div>
    <button class="show-more-btn">Show more</button>
  </section>
</template>

<script setup>
  import { ref } from 'vue'
  import { feedWhoToFollow } from '@/models/feed'
  import '@/styles/components/sidebars/who-to-follow.scss'

  const whoToFollow = ref(feedWhoToFollow)
</script>
