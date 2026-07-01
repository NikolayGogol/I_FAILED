<route lang="json">
{
  "meta": {
    "layout": "MainLayout",
    "auth": true
  }
}
</route>

<script setup>
  import { ref } from 'vue'
  import Achievement from '@/components/failure-age/achievement.vue'
  import Age from '@/components/failure-age/age.vue'
  import Calendar from '@/components/failure-age/calendar.vue'
  import Dashboard from '@/components/failure-age/dashboard.vue'
  import Emotial from '@/components/failure-age/emotial.vue'
  import GrowChart from '@/components/failure-age/grow-chart.vue'
  import Growth from '@/components/failure-age/growth.vue'
  import ThemeChart from '@/components/failure-age/theme-chart.vue'
  import Timeline from '@/components/failure-age/timeline.vue'
  import { isPremium } from '@/utils/premium.js'
  import '@/styles/pages/failure-age.scss'
  //
  const tabs = [
    {
      label: 'Your Journey',
      value: 0,
    },
    {
      label: 'Growth Insights',
      value: 1,
    },
  ]
  const selectedTab = ref(tabs[0])
</script>
<template>
  <div class="failure-age-page">
    <h1 class="font-weight-bold text-grey-darken-3 ml-3 ml-sm-0 title">Your Failure Age</h1>
    <p class="text-description fs-16">A measure of wisdom gained through shared failures and growth</p>
    <age class="mt-4" />
    <ul class="tabs">
      <li
        v-for="tab in tabs"
        :key="tab.value"
        class="nav-item"
        :class="{ 'active': selectedTab.value === tab.value }"
        @click="selectedTab = tab"
      >
        {{ tab.label }}
      </li>
    </ul>
    <div v-if="selectedTab.value === 0" class="tab-content">
      <growth />
      <achievement class="mt-4" />
      <timeline class="mt-4" />
    </div>
    <template v-if="isPremium">
      <div v-if="selectedTab.value === 1" class="tab-content">
        <dashboard />
        <grow-chart class="mt-4" />
        <v-row class="mt-4">
          <v-col cols="12" sm="6">
            <theme-chart />
          </v-col>
          <v-col cols="12" sm="6">
            <emotial />
          </v-col>
        </v-row>
        <calendar class="mt-4" />
      </div>
    </template>
    <div v-else-if="selectedTab.value === 1 && !isPremium" class="premium-upsell mt-8">
      <h3 class="upsell-title">Unlock Growth Insights with Premium</h3>
      <p class="upsell-desc">
        Join thousands of members who are turning failures into growth
      </p>
      <button class="upsell-btn" @click="$router.push('/premium')">
        Start Your Premium Journey
      </button>
    </div>
  </div>
</template>
<style scoped lang="scss">
@include media-down($breakpoint-sm) {
  h1 {
    font-size: 20px;
    margin-left: 0 !important;
  }
  p {
    font-size: 12px !important;
  }
}
</style>
