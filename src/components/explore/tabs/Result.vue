<script setup>
  import { onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import { useResultsStore } from '@/stores/explore/results.js'
  import { useFilterStore } from '@/stores/main/filter.js'

  const filterStore = useFilterStore()
  const filters = filterStore.selectedFilter
  const route = useRoute()
  const store = useResultsStore()
  // onMounted(() => {
  //   store.searchAction({
  //     ...filters,
  //     searchText: route?.query?.searchValue || '',
  //   })
  // })

</script>

<template>
  {{ filters }}
</template>

<style scoped lang="scss">

</style>
