<script setup>
  import ApexCharts from 'apexcharts'
  import { computed } from 'vue'
  import apexchart from 'vue3-apexcharts'
  import { useFailureAgeStore } from '@/stores/failure-age.js'

  const failureAgeStore = useFailureAgeStore()
  const chartId = 'recurring-themes-donut'

  // Data Logic
  const categoryCounts = computed(() => {
    const counts = {}
    const categories = failureAgeStore.posts.map(el => el.selectedCategories[0])
    for (const category of categories) {
      if (category) {
        counts[category.label] = (counts[category.label] || 0) + 1
      }
    }

    // Sort by count, take top 3, and convert back to an object
    const sortedCategories = Object.entries(counts)
      .toSorted(([, a], [, b]) => b - a)
      .slice(0, 3)

    return Object.fromEntries(sortedCategories)
  })

  const series = computed(() => Object.values(categoryCounts.value))
  const chartLabels = computed(() => Object.keys(categoryCounts.value))
  const total = computed(() => series.value.reduce((a, b) => a + b, 0))

  const legendData = computed(() => {
    return chartLabels.value.map((label, index) => {
      const value = series.value[index]
      const percentage = total.value > 0 ? ((value / total.value) * 100).toFixed(1) : 0
      return {
        label,
        percentage,
        color: chartOptions.value.colors[index],
      }
    })
  })

  const chartOptions = computed(() => ({
    chart: {
      id: chartId,
      type: 'donut',
      animations: { enabled: true, speed: 200 },
    },
    // Main colors
    colors: [
      '#E77136', '#FB6EAB', '#FFEAA3', '#263d9a', '#9B59B6',
      '#73aa20', '#5DADE2', '#48C9B0', '#F7DC6F', '#AF7AC5',
    ],
    stroke: { show: true, width: 2, colors: ['#fff'] },
    plotOptions: {
      pie: {
        donut: { size: '50%' },
      },
    },
    labels: chartLabels.value,
    legend: { show: false },
    dataLabels: { enabled: false },
    tooltip: { enabled: true },
    // This part handles the "fading" effect safely
    fill: { opacity: 1 },
  }))

  /**
   * Safe Highlight using Opacity instead of Selection
   * @param {number|null} index - Hovered index or null to reset
   */
  function setHighlight (index) {
    const opacities = series.value.map((_, i) => (index === null || i === index ? 1 : 0.3))

    ApexCharts.exec(chartId, 'updateOptions', {
      fill: {
        opacity: opacities,
      },
      // Optional: slightly expand the hovered slice without using toggleSelection
      plotOptions: {
        pie: {
          customScale: index === null ? 1 : 1.05,
        },
      },
    }, false, false)
  }
</script>

<template>
  <div v-if="series.length > 0" class="section recurring-themes">
    <h3 class="title-section d-flex align-center">Your Recurring Themes</h3>
    <p class="text-description fs-14">Patterns that help you understand yourself better</p>

    <div class="chart-wrapper mt-10">
      <apexchart
        :options="chartOptions"
        :series="series"
        style="transform: scale(1.3)"
        type="donut"
        width="100%"
      />
    </div>

    <div class="custom-legend">
      <div
        v-for="(item, index) in legendData"
        :key="index"
        class="legend-item"
        @mouseenter="setHighlight(index)"
        @mouseleave="setHighlight(null)"
      >
        <div class="legend-info">
          <span class="legend-color" :style="{ backgroundColor: item.color }" />
          <span class="legend-label">{{ item.label }}</span>
        </div>
        <span class="legend-percentage">{{ item.percentage }}%</span>
      </div>
    </div>
  </div>
</template>
