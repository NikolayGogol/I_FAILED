<template>
  <section class="right-card follow-card">
    <header class="right-card-header">
      <h3 class="font-weight-semibold">Who to follow</h3>
    </header>
    <div
      v-for="person in whoToFollow"
      :key="person.id"
      class="follow-row py-2"
    >
      <div
        class="follow-avatar mr-3"
        :style="{ backgroundColor: getRandomColor() }"
      >
        <span>{{ person.initials }}</span>
      </div>
      <div class="follow-info">
        <div class="follow-name">{{ person.name }}</div>
        <div class="follow-handle">{{ person.handle }}</div>
      </div>
      <v-spacer />
      <div
        class="follow-btn"
      >
        Follow
      </div>
    </div>
  </section>
</template>

<script setup>
  import { ref } from 'vue'
  import { feedWhoToFollow } from '@/models/feed'
  import '@/styles/components/sidebars/who-to-follow.scss'

  const whoToFollow = ref(feedWhoToFollow)

  const backgroundColors = [
    '#ffcdd2', '#f8bbd0', '#e1bee7', '#d1c4e9', '#c5cae9',
    '#bbdefb', '#b3e5fc', '#b2ebf2', '#b2dfdb', '#c8e6c9',
    '#dcedc8', '#f0f4c3', '#fff9c4', '#ffecb3', '#ffe0b2',
    '#ffccbc', '#d7ccc8', '#cfd8dc',
  ]

  function getRandomColor () {
    const randomIndex = Math.floor(Math.random() * backgroundColors.length)
    return backgroundColors[randomIndex]
  }
</script>
