<script setup>
  import { computed } from 'vue'
  import { useFailureAgeStore } from '@/stores/failure-age.js'

  const failureAgeStore = useFailureAgeStore()
  const tags = failureAgeStore.posts.map(el => el?.tags)
    .filter(Boolean)
  const tagsNumber = 8
  const topTags = computed(() => {
    const allTags = tags.flat()
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1
      return acc
    }, {})

    return Object.entries(tagCounts)
      .toSorted(([, a], [, b]) => b - a)
      .slice(0, tagsNumber)
      .map(([tag]) => tag)
  })

  // Function to determine the size (class) based on priority
  function getTagClass (index) {
    if (index === 0) return 'tag-huge'
    if (index === 1 || index === 2) return 'tag-large'
    if (index === 3 || index === 4) return 'tag-medium'
    return 'tag-small'
  }
</script>

<template>
  <div v-if="topTags.length > 0" class="emotional-card section h-100">
    <section class="section-emotional">
      <h3 class="title-section">Emotional Patterns</h3>
      <p class="text-description">Triggers that often appear in your journey</p>

      <div class="tags-cloud">
        <div
          v-for="(tag, index) in topTags"
          :key="tag"
          class="text-capitalize"
          :class="['tag-item', getTagClass(index)]"
        >
          {{ tag }}
        </div>
      </div>

      <div v-if="topTags.length > 0" class="common-failure-box">
        <p class="label">Most common emotion before failure:</p>
        <p class="value text-capitalize">{{ topTags[0] }}</p>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">

</style>
