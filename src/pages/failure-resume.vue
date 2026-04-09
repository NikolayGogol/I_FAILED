<route lang="json">
{
  "meta": {
    "layout": "MainLayout",
    "auth": true
  }
}
</route>
<script setup>
  import { computed, ref } from 'vue'
  import { recoveryTimeOptions } from '@/models/categories.js'
  import { useAuthStore } from '@/stores/auth.js'
  import { useProfileStore } from '@/stores/profile/profile.js'
  import { floatNumber, formatNumber } from '../utils/format-number.js'
  import '@/styles/pages/failure-resume.scss'

  const profileStore = useProfileStore()
  const auth = useAuthStore()
  const posts = ref([])
  const selectedPosts = ref([])
  //
  profileStore.fetchUserPosts(auth.user.uid)
    .then(res => {
      posts.value = res
    })
  const lessonsLearned = computed(() => {
    return posts.value.filter(el => el.lessonLearned).length
  })
  const totalCost = computed(() => {
    return posts.value.map(el => el.lessonLearned)
      .filter(Boolean)
      .map(el => el.cost)
      .reduce((a, b) => Number(a) + Number(b), 0)
  })
  const allSelected = computed(() => selectedPosts.value.length === posts.value.length && posts.value.length > 0)
  function selectAll () {
    selectedPosts.value = allSelected.value ? [] : posts.value.map(p => p.id)
  }
  const recoveryTime = computed(() => {
    const maxRecoveryDays = Math.max(...recoveryTimeOptions.map(opt => opt.days))
    const arr = posts.value.map(el => el.lessonLearned)
      .filter(Boolean)
    const lessonLearned = arr
      .filter(item => item?.recoveryTime)
      .map(el => el.recoveryTime?.days)
      .filter(Boolean)
    const daysCount = lessonLearned.reduce((acc, curr) => acc + curr, 0)
    const average = daysCount / lessonLearned.length
    if (average > 0) {
      return Math.round((average / maxRecoveryDays) * 100)
    }
    return 0
  })
</script>
<template>
  <div class="failure-resume-page">
    <div class="header">
      <h1>Failure Resume</h1>
      <p class="text-description fs-16">Transform your failures into a shareable resume of growth</p>
    </div>
    <div class="stat-panel mt-4">
      <v-row class="ga-2 pa-6">
        <v-col>
          <div class="d-flex flex-column align-center justify-center item">
            <h2>{{ selectedPosts.length }}</h2>
            <p class="text-description">Failures Selected</p>
          </div>
        </v-col>
        <v-col>
          <div class="d-flex flex-column align-center justify-center item">
            <h2>{{ lessonsLearned }}</h2>
            <p class="text-description">Lessons Learned</p>
          </div>
        </v-col>
        <v-col>
          <div class="d-flex flex-column align-center justify-center item">
            <h2 class="text-uppercase">${{ floatNumber(totalCost) }}</h2>
            <p class="text-description">Total Cost</p>
          </div>
        </v-col>
        <v-col>
          <div class="d-flex flex-column align-center justify-center item">
            <h2>{{ recoveryTime }}%</h2>
            <p class="text-description">Recovery Rate</p>
          </div>
        </v-col>
      </v-row>
    </div>
    <div class="main-content mt-4 pa-4">
      <div class="d-flex justify-space-between mb-3">
        <h4>Select Failures to Include</h4>
        <p class="cursor-pointer text-primary fs-14" @click="selectAll">{{ allSelected ? 'Deselect All' : 'Select All' }}</p>
      </div>
      <ul>
        <li
          v-for="post in posts"
          :key="post.id"
          :class="{selected: selectedPosts.includes(post.id)}"
        >
          <div class="d-block">
            <v-checkbox
              v-model="selectedPosts"
              color="primary"
              hide-details
              :value="post.id"
            />
          </div>
          <div class="d-flex flex-column align-start ml-6">
            <div class="tag">{{ post.selectedCategories[0].label }}</div>
            <div class="title">{{ post.title }}</div>
            <div v-if="post?.lessonLearned?.cost || post?.lessonLearned?.recoveryTime" class="item-panel">
              <div v-if="post?.lessonLearned?.cost">💰Cost: {{ formatNumber(post.lessonLearned.cost) }}</div>
              <div v-if="post?.lessonLearned?.recoveryTime" class="ml-4">⏱️Recovery: {{ post.lessonLearned.recoveryTime.title }}</div>
            </div>
          </div>
        </li>
      </ul>
    </div>
    <div class="submit-btn mt-4" @click="">Export PDF</div>
  </div>
</template>
