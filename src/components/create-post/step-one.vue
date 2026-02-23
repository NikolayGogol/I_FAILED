<script setup>
  import { ref } from 'vue'

  const categories = [
    'Business/Career',
    'Relationships',
    'Finance',
    'Health/Wellness',
    'Education/Learning',
    'Parenting/Family',
    'Personal Goals',
    'Everyday Life',
    'Other',
  ]
  const selectedCategory = ref('Business/Career')

</script>

<template>
  <div>
    <h2 class="text-h6 font-weight-bold mb-4">Category Selection</h2>
    <p class="text-body-2 text-grey-darken-1 mb-6">What area of life did this failure occur in?</p>

    <v-row>
      <v-col
        v-for="category in categories"
        :key="category"
        cols="12"
        sm="6"
      >
        <v-card
          :class="[
            'pa-4 rounded-lg cursor-pointer border transition-swing',
            selectedCategory === category ? 'bg-blue-grey-lighten-4 border-blue-grey-darken-1' : 'bg-white'
          ]"
          variant="outlined"
          @click="selectedCategory = category"
        >
          <div class="d-flex align-center justify-space-between">
            <span :class="selectedCategory === category ? 'font-weight-bold text-blue-grey-darken-3' : ''">
              {{ category }}
            </span>
            <v-icon v-if="selectedCategory === category" color="blue-grey-darken-3" size="small">mdi-check-circle</v-icon>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>

</style>
