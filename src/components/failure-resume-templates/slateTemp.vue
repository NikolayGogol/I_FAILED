<script setup>
  import { inject, ref, watch } from 'vue'
  import { floatNumber, formatNumber } from '@/utils/format-number.js'
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
  <div class="resume-template-wrapper slate-template">
    <div class="header d-flex align-center justify-space-between w-100">
      <div class="pa-4">
        <div class="title text-white text-left">Failure Resume</div>
        <p class="text-description">{{ displayName }} <span>•</span> {{ userName }}</p>
      </div>
      <div class="recovery pa-4">
        <p class="recovery-value">{{ recoveryTime }}%</p>
        <p>Recovery</p>
      </div>
    </div>
    <div class="inner-wrapper">
      <ul class="list">
        <li>
          <div class="wrapper">
            <div class="value">{{ data.length }}</div>
            <div class="label">Failures</div>
          </div>
        </li>
        <li>
          <div class="wrapper">
            <div class="value">{{ counter }}</div>
            <div class="label">Lessons</div>
          </div>
        </li>
        <li>
          <div class="wrapper">
            <div class="value">{{ floatNumber(totalCost) }}</div>
            <div class="label">Cost</div>
          </div>
        </li>
      </ul>
      <template v-if="data.length > 0">
        <div class="section-title mt-6">Major Failures</div>
        <ul class="selected-items">
          <li v-for="(item, index) in data" :key="item.id" class="mb-3">
            <h6 class="font-weight-semibold fs-14">
              <span>{{ index + 1 }}</span>
              {{ item.title }}</h6>
            <p class="text-description fs-12">
              {{ item.selectedCategories?.[0]?.label }}
              <span v-if="item?.lessonLearned?.cost" class="mx-1">•</span>
              <span v-if="item?.lessonLearned?.cost">Cost: {{ formatNumber(item.lessonLearned.cost) }}</span>
              <span v-if="item?.lessonLearned?.recoveryTime?.title" class="mx-1">•</span>
              <span v-if="item?.lessonLearned?.recoveryTime?.title">Cost: {{
                item.lessonLearned.recoveryTime.title
              }}</span>
            </p>
          </li>
        </ul>
      </template>

      <template v-if="grow.length > 0">
        <div class="section-title mt-6">Growth Timeline</div>
        <ul class="grow-items mt-4">
          <li v-for="(item, index) in grow" :key="index" class="mb-2">
            <div class="font-weight-semibold">{{ item.title }}</div>
            <p v-if="lessonCounter(item.lessonLearned)" class="text-description">Major failure occurred, learned
              {{ lessonCounter(item.lessonLearned) }} key lessons</p>
          </li>
        </ul>
      </template>
      <template v-if="keyLessonsTemplate(data)?.length">
        <div class="section-title mt-6">Key Lessons</div>
        <ul class="key-items mt-4">
          <li v-for="(item, index) in keyLessonsTemplate(data)" :key="index" class="mb-2">
            <svg
              fill="none"
              height="20"
              viewBox="0 0 9 7"
              width="25"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M8.5 0.5L3 6.5L0.5 3.77273" stroke="#38BDF8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
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
