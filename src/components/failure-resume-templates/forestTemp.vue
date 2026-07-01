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
  <div class="resume-template-wrapper forest-template">
    <div class="header">
      <div class="title">Failure Resume</div>
      <p class="text-description">{{ displayName }} <span>•</span> {{ userName }}</p>
    </div>
    <div class="inner-wrapper">
      <ul class="list">
        <li>
          <div class="wrapper">
            <div class="label">Total Failures</div>
            <div class="value">{{ data.length }}</div>
          </div>
        </li>
        <li>
          <div class="wrapper">
            <div class="label">Lessons Learned</div>
            <div class="value">{{ counter }}</div>
          </div>
        </li>
        <li>
          <div class="wrapper">
            <div class="label">Financial Cost</div>
            <div class="value">{{ formatNumber(totalCost) }}</div>
          </div>
        </li>
        <li>
          <div class="wrapper">
            <div class="label">Recovery Rate</div>
            <div class="value">{{ recoveryTime }}%</div>
          </div>
        </li>
      </ul>
      <template v-if="data.length > 0">
        <div class="section-title my-5">Major Failures</div>
        <ul class="selected-items">
          <li v-for="(item, index) in data" :key="item.id" class="mb-4">
            <h6 class="font-weight-semibold fs-14">{{ index +1 }}.{{ item.title }}</h6>
            <p class="text-description fs-12">
              {{ item.selectedCategories?.[0]?.label }}
              <span v-if="item?.lessonLearned?.cost" class="mx-1">•</span>
              <span v-if="item?.lessonLearned?.cost">Cost: {{ formatNumber(item.lessonLearned.cost) }}</span>
              <span v-if="item?.lessonLearned?.recoveryTime?.title" class="mx-1">•</span>
              <span v-if="item?.lessonLearned?.recoveryTime?.title">Cost: {{ item.lessonLearned.recoveryTime.title }}</span>
            </p>
          </li>
        </ul>
      </template>
      <template v-if="grow.length > 0">
        <div class="section-title my-5">Growth Timeline</div>
        <ul class="grow-items mt-4">
          <li v-for="(item, index) in grow" :key="index" class="mb-2">
            <div class="fs-12 font-weight-semibold">{{ item.title }}</div>
            <p v-if="lessonCounter(item.lessonLearned)" class="text-description">Major failure occurred, learned {{ lessonCounter(item.lessonLearned) }} key lessons</p>
          </li>
        </ul>
      </template>
      <template v-if="keyLessonsTemplate(data).length > 0">
        <div class="section-title my-5">Key Lessons Learned</div>
        <ul class="key-items mt-4">
          <li v-for="(item, index) in keyLessonsTemplate(data)" :key="index" class="mb-2">
            <div
              class="fs-14 font-weight-semibold"
              v-html="item"
            />
          </li>
        </ul>
      </template>

    </div>
  </div>
</template>
