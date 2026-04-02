<script setup>

  import { computed } from 'vue'
  import { list } from '@/models/age.js'
  import { getIcon } from '@/models/icons.js'
  import { useFailureAgeStore } from '@/stores/failure-age.js'

  const failureAgeStore = useFailureAgeStore()

  //
  function findLevel () {
    for (let i = list.length - 1; i >= 0; i--) {
      if (failureAgeStore.totalAgeData >= list[i].age) {
        return {
          ...list[i],
          level: i + 1,
        }
      }
    }
  }

  const averageRecoveryTime = computed(() => {
    const lessonLearnedPosts = failureAgeStore.posts.map(el => el.lessonLearned)
    const lessonLearned = lessonLearnedPosts
      .filter(item => item?.recoveryTime)
      .map(el => el.recoveryTime?.days)
      .filter(Boolean)
    const daysCount = lessonLearned.reduce((acc, curr) => acc + curr, 0)
    const average = daysCount / lessonLearned.length
    return `${average || 0} days`
  })
</script>

<template>
  <section class="section mt-6 dashboard">
    <h3 class="title-section d-flex align-center">
      <span class="mr-2 d-flex" v-html="getIcon('star')" />
      Your Personal Dashboard
    </h3>
    <v-row class="mt-4">
      <v-col class="px-1" cols="12" sm="3">
        <div class="d-flex flex-column item">
          <img alt="" src="../../assets/age/heart.png">
          <div class="count">{{ failureAgeStore.posts.length }}</div>
          <p class="text-description fs-14 mt-2">Total failures shared</p>
        </div>
      </v-col>
      <v-col class="px-1" cols="12" sm="3">
        <div class="d-flex flex-column item">
          <img alt="" src="../../assets/age/chart.png">
          <div class="count">{{ averageRecoveryTime }}</div>
          <p class="text-description fs-14 mt-2">Average recovery time</p>
        </div>
      </v-col>
      <v-col class="px-1" cols="12" sm="3">
        <div class="d-flex flex-column item">
          <img alt="" src="../../assets/age/calendar.png">
          <div class="count">23 days</div>
          <p class="text-description fs-14 mt-2">Current growth streak</p>
        </div>
      </v-col>
      <v-col class="px-1" cols="12" sm="3">
        <div class="d-flex flex-column item">
          <img alt="" src="../../assets/age/star.png">
          <div class="count">Level {{ findLevel().level }}</div>
          <p class="text-description fs-14 mt-2">Growth Level</p>
          <p class="text-primary fs-14 mt-2 text-no-wrap">{{ findLevel().label }}</p>
        </div>
      </v-col>
    </v-row>
  </section>
</template>

<style scoped lang="scss">

</style>
