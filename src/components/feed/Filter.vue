<script setup>
  import { reactive } from 'vue'
  import { categories } from '@/models/categories.js'
  import { useMainStore } from '@/stores/main.js'
  import '@/styles/components/feed/filter.scss'
  const mainStore = useMainStore()
  //
  const selectedFilter = reactive({
    categories: [],
    emojiTags: [],
    recoveryTime: [],
    costRange: [],
    postedBy: null,
  })
  defineProps({
    title: {
      type: String,
      required: false,
      default: '',
    },
  })
  //
  function applyFilters () {
    console.log(selectedFilter)
  }

  function clearFilters () {
    selectedFilter.categories = []
    selectedFilter.emojiTags = []
    selectedFilter.recoveryTime = []
    selectedFilter.costRange = []
    selectedFilter.postedBy = null
    mainStore.applyPostFilters(selectedFilter)
  }
</script>

<template>
  <div class="filter-panel">
    <div v-if="title" class="title">{{ title }}</div>
    <h5>Category</h5>
    <v-chip-group v-model="selectedFilter.categories" multiple>
      <v-chip
        v-for="item in categories"
        :key="item.id"
        color="primary"
        :text="item.label"
        :value="item"
      />
    </v-chip-group>
    <div class="d-flex align-center mt-6">
      <div class="submit-btn" @click="applyFilters">Apply</div>
      <div class="clear" @click="clearFilters">Clear all filters</div>
    </div>
  </div>

</template>

<style scoped lang="scss">

</style>
