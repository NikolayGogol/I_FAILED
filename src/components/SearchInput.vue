<script setup>
import { useSearchStore } from '@/stores/search'
import { storeToRefs } from 'pinia'
import FormInput from '@/components/FormInput.vue'
import '@/styles/components/SearchInput.scss'

const searchStore = useSearchStore()
const { search } = storeToRefs(searchStore)
</script>

<template>
  <FormInput
    v-model="search"
    class="profile-search"
    density="compact"
    hide-details
    placeholder="Search"
    prepend-inner-icon="mdi-magnify"
    variant="outlined"
  />
</template>
