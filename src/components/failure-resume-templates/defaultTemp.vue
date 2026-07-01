<script setup>
  import { inject, ref, watch } from 'vue'
  import { formatNumber } from '@/utils/format-number.js'
  import { lessonCounter } from '@/utils/lesson-counter.js'
  import {
    keyLessonsTemplate,
    lessonCounterTemplate,
    recoveryTimeTemplate,
    timelineDataTemplate,
    totalCostTemplate,
  } from '@/utils/templates.js'
  defineProps({
    displayName: {
      type: String,
      default: '',
    },
    userName: {
      type: String,
      default: '',
    },
  })
  const data = inject('selectedPosts')
  const counter = ref(0)
  const totalCost = ref(0)
  const recoveryTime = ref(0)
  const grow = ref([])
  watch(data, newVal => {
    counter.value = lessonCounterTemplate(newVal)
    totalCost.value = totalCostTemplate(newVal)
    recoveryTime.value = recoveryTimeTemplate(newVal)
    grow.value = timelineDataTemplate(newVal)
  }, { deep: true, immediate: true })
</script>

<template>
  <div class="resume-template-wrapper default-template">
    <div class="title">Failure Resume</div>
    <p class="text-description text-center">{{ displayName }} <span>•</span> {{ userName }}</p>
    <div class="header">
      <h6 class="fs-16 font-weight-semibold text-grey-darken-3">Failure Experience Summary</h6>
      <ul>
        <li>
          <div class="label">Total Failures</div>
          <div class="value">{{ data.length }}</div>
        </li>
        <li>
          <div class="label">Lessons Learned</div>
          <div class="value">{{ counter }}</div>
        </li>
        <li>
          <div class="label">Financial Cost</div>
          <div class="value">{{ formatNumber(totalCost) }}</div>
        </li>
        <li>
          <div class="label">Recovery Rate</div>
          <div class="value text-success">{{ recoveryTime }}%</div>
        </li>
      </ul>
    </div>
    <template v-if="data.length > 0">
      <div class="fs-16 font-weight-semibold text-grey-darken-3 mt-6">Major Failures</div>
      <ul class="selected-items">
        <li v-for="(item, index) in data" :key="item.id">
          <h6 class="font-weight-semibold fs-14 text-grey-darken-3">{{ index +1 }}.{{ item.title }}</h6>
          <p class="text-description fs-12">
            {{ item.selectedCategories?.[0]?.label }}
            <span v-if="item?.lessonLearned?.cost" class="mx-1">•</span>
            <span v-if="item?.lessonLearned?.cost">Cost: {{ formatNumber(item.lessonLearned.cost) }}</span>
            <span v-if="item?.lessonLearned?.recoveryTime?.title" class="mx-1">•</span>
            <span v-if="item?.lessonLearned?.recoveryTime?.title">Cost: {{ item.lessonLearned.recoveryTime.title }}</span>
          </p>
        </li>
      </ul>
      <div class="fs-16 font-weight-semibold text-grey-darken-3 mt-6">Growth Timeline</div>
      <ul class="grow-items">
        <li v-for="(item, index) in grow" :key="index" class="mb-6">
          <div class="fs-16 font-weight-semibold text-grey-darken-3">{{ item.title }}</div>
          <p v-if="lessonCounter(item.lessonLearned)" class="text-description">Major failure occurred, learned {{ lessonCounter(item.lessonLearned) }} key lessons</p>
        </li>
      </ul>
      <div class="fs-16 font-weight-semibold text-grey-darken-3">Key Lessons Learned</div>
      <ul class="key-items">
        <li v-for="(item, index) in keyLessonsTemplate(data)" :key="index" class="mb-6">
          <div
            class="fs-16 font-weight-semibold text-grey-darken-3 mb-4"
            v-html="item"
          />
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped lang="scss">

</style>
