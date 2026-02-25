<script setup>
  import { categories } from '@/models/categories.js'
  import { useCreatePostStore } from '@/stores/create-post'
  import '@/styles/components/create-post/step-one.scss'

  const store = useCreatePostStore()
  const emit = defineEmits(['isValid'])
  function isSelected (categoryId) {
    return store.stepOne.selectedCategories.some(c => c.id === categoryId)
  }

  function toggleCategory (category) {
    const index = store.stepOne.selectedCategories.findIndex(c => c.id === category.id)
    if (index === -1) {
      store.stepOne.selectedCategories.push(category)
    } else {
      store.stepOne.selectedCategories.splice(index, 1)
    }
    if (store.stepOne.selectedCategories.length > 0) {
      emit('isValid', true)
    } else {
      emit('isValid', false)
    }
  }
</script>

<template>
  <div class="step-one">
    <h2 class="step-title">Category Selection</h2>
    <p class="step-subtitle">What area of life did this failure occur in?</p>

    <v-row class="categories-grid">
      <v-col
        v-for="category in categories"
        :key="category.id"
        cols="12"
        md="6"
        sm="6"
      >
        <div
          class="category-card"
          :class="{ active: isSelected(category.id) }"
          @click="toggleCategory(category)"
        >
          <div class="category-content">
            <span class="category-name">{{ category.label }}</span>
          </div>
        </div>
      </v-col>
    </v-row>
  </div>
</template>
