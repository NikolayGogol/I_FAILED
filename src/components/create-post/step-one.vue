<script setup>
  import { useCreatePostStore } from '@/stores/create-post'
  import '@/styles/components/create-post/step-one.scss'

  const store = useCreatePostStore()

  const categories = [
    { id: 'business', label: 'Business/Career' },
    { id: 'relationships', label: 'Relationships' },
    { id: 'finance', label: 'Finance' },
    { id: 'health', label: 'Health/Wellness' },
    { id: 'education', label: 'Education/Learning' },
    { id: 'parenting', label: 'Parenting/Family' },
    { id: 'personal', label: 'Personal Goals' },
    { id: 'life', label: 'Everyday Life' },
    { id: 'other', label: 'Other' },
  ]

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
  }
</script>

<template>
  <div class="step-one">
    <h2 class="step-title">Category Selection</h2>
    <p class="step-subtitle">What area of life did this failure occur in? (Select all that apply)</p>

    <v-row class="categories-grid">
      <v-col
        v-for="category in categories"
        :key="category.id"
        cols="12"
        md="4"
        sm="6"
      >
        <div
          class="category-card"
          :class="{ active: isSelected(category.id) }"
          @click="toggleCategory(category)"
        >
          <div class="category-content">
            <span class="category-name">{{ category.label }}</span>
            <v-icon v-if="isSelected(category.id)" class="check-icon" size="small">mdi-check-circle</v-icon>
          </div>
        </div>
      </v-col>
    </v-row>
  </div>
</template>
