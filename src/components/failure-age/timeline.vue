<script setup>
  import dayjs from 'dayjs'
  import { computed } from 'vue'
  import { useFailureAgeStore } from '@/stores/failure-age.js'

  const failureAgeStore = useFailureAgeStore()
  const listData = computed(() => failureAgeStore.posts)
</script>

<template>
  <section v-if="listData.length > 0" class="section recovery-timeline">
    <div class="title-section">Recovery Timeline</div>
    <div class="position-relative">
      <div class="line" />
      <ul>
        <li v-for="card in listData" :key="card.id" class="item">
          <div class="time-card">
            <p>{{ dayjs.unix(card.createdAt.seconds).format('MMMM') }}</p>
            <p>{{ dayjs.unix(card.createdAt.seconds).format('YYYY') }}</p>
          </div>
          <div class="content-card">
            <div class="d-flex align-center justify-space-between">
              <div v-if="card?.selectedCategories[0]?.label" class="tag">{{ card.selectedCategories[0].label }}</div>
              <div v-if="card?.lessonLearned" class="tag-green">RECOVERED</div>
              <div v-else class="tag-yellow">RECOVERING</div>
            </div>
            <h5>{{ card.title }}</h5>
            <div class="d-flex mt-2">
              <div v-if="card?.lessonLearned?.recoveryTime" class="text-description fs-12">
                ⏱️ {{ card.lessonLearned.recoveryTime.title }} recovery
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped lang="scss">

</style>
