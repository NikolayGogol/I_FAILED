<script setup>
  import { categories, costRange, emotionTags, recoveryTimeOptions } from '@/models/categories.js'
  import { useFilterStore } from '@/stores/main/filter.js'
  import '@/styles/components/feed/filter.scss'

  const filterStore = useFilterStore()
  const radios = [
    {
      label: 'Anonymous only',
      value: 'anonymous',
    },
    {
      label: 'Non-anonymous only',
      value: 'public',
    },
  ]
  defineProps({
    title: {
      type: String,
      required: false,
      default: '',
    },
  })
</script>

<template>
  <div class="filter-panel">
    <div v-if="title" class="title">{{ title }}</div>
    <h5>Category</h5>
    <v-chip-group v-model="filterStore.selectedFilter.categories" multiple>
      <v-chip
        v-for="item in categories"
        :key="item.id"
        color="primary"
        :text="item.label"
        :value="item"
      />
    </v-chip-group>
    <!--    -->
    <h5 class="mt-3">Emotion Tags</h5>
    <v-chip-group v-model="filterStore.selectedFilter.emojiTags" multiple>
      <v-chip
        v-for="item in emotionTags"
        :key="item.id"
        color="primary"
        :text="`${item.emoji} ${item.label}`"
        :value="item"
      />
    </v-chip-group>
    <!--    -->
    <h5 class="mt-3">Recovery time</h5>
    <v-chip-group v-model="filterStore.selectedFilter.recoveryTime" multiple>
      <v-chip
        v-for="item in recoveryTimeOptions"
        :key="item.value"
        color="primary"
        :text="item.title"
        :value="item"
      />
    </v-chip-group>
    <!--    -->
    <h5 class="mt-3">Cost Range</h5>
    <v-chip-group v-model="filterStore.selectedFilter.costRange" multiple>
      <v-chip
        v-for="item in costRange"
        :key="item.value"
        color="primary"
        :text="item.label"
        :value="item"
      />
    </v-chip-group>
    <!--   -->
    <h5 class="mt-3">Posted by</h5>
    <v-radio-group v-model="filterStore.selectedFilter.postedBy" color="primary">
      <v-radio
        v-for="radio in radios"
        :key="radio.value"
        class="radio"
        :label="radio.label"
        :value="radio"
      />
    </v-radio-group>
    <div class="d-flex align-center mt-2">
      <div class="submit-btn" @click="filterStore.applyFilters">Apply</div>
      <div class="clear" @click="filterStore.clearFilters">Clear all filters</div>
    </div>
  </div>

</template>

<style scoped lang="scss">
:deep(.v-selection-control-group) {
  flex-direction: row;
}

:deep(.v-selection-control) {
  flex: unset;
}
.radio {
  &:deep(label) {
    color: #1C1C1B;
    font-size: 12px;
  }
}

</style>
