<script setup>
import {useFilterStore} from "@/stores/main/filter.js";

const filterStore = useFilterStore()
const filters = filterStore.selectedFilter

</script>

<template>
  {{ filters }}
</template>

<style scoped lang="scss">

</style>
