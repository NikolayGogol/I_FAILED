<script setup>
  import { computed, onMounted, ref } from 'vue'
  import VueApexCharts from 'vue3-apexcharts'
  import { recoveryTimeOptions } from '@/models/categories.js'
  import { useGrowChartStore } from '@/stores/failure-age/grow-chart.js'

  const growChartStore = useGrowChartStore()
  const communityAverageRecoveryTime = ref(0)
  const userAverageRecoveryTime = ref(0)
  const communityEngagement = ref(0)
  const userEngagement = ref(0)
  const userResilience = ref(0)
  const communityResilience = ref(0)
  const maxRecoveryDays = Math.max(...recoveryTimeOptions.map(opt => opt.days))

  onMounted(async () => {
    await growChartStore.fetchLessonLearnedPosts()
    await growChartStore.fetchComments()
    await growChartStore.fetchResilience()
    calculateCommunityAverageRecoveryTime()
    calculateEngagement()
    calculateResilience()
    const userAverage = +sessionStorage.getItem('averageRecoveryTime')
    if (!Number.isNaN(userAverage)) {
      userAverageRecoveryTime.value = userAverage
    }
  })

  function calculateCommunityAverageRecoveryTime () {
    const recoveryTimes = growChartStore.lessonLearnedPosts
      .map(el => el.lessonLearned)
      .map(lessonLearned => {
        if (lessonLearned.recoveryTime?.days) {
          return lessonLearned.recoveryTime.days
        } else {
          const option = recoveryTimeOptions.find(opt => opt.value === lessonLearned.recoveryTime?.value)
          return option?.days
        }
      })
      .filter(days => days != null)

    if (recoveryTimes.length > 0) {
      const sum = recoveryTimes.reduce((acc, days) => acc + days, 0)
      communityAverageRecoveryTime.value = Math.round(sum / recoveryTimes.length)
    }
  }

  function calculateEngagement () {
    const communityComments = growChartStore.commentsList
    const communityLikes = growChartStore.likesList
    if (communityComments.length > 0 || communityLikes.length > 0) {
      communityEngagement.value = communityComments.length + communityLikes.length
    }
    const userComments = growChartStore.commentsListOwn
    const userLikes = growChartStore.likesListOwn
    if (userComments.length > 0 || userLikes.length > 0) {
      userEngagement.value = userComments.length + userLikes.length
    }
  }
  function calculateResilience () {
    userResilience.value = growChartStore.posts.postOwn.length - growChartStore.posts.learnedOwn.length
    communityResilience.value = growChartStore.posts.postCommunity.length - growChartStore.posts.learnedCommunity.length
  }
  const communityAveragePercentage = computed(() => {
    if (communityAverageRecoveryTime.value > 0) {
      return Math.round((communityAverageRecoveryTime.value / maxRecoveryDays) * 100)
    }
    return 0
  })

  const userAveragePercentage = computed(() => {
    if (userAverageRecoveryTime.value > 0) {
      return Math.round((userAverageRecoveryTime.value / maxRecoveryDays) * 100)
    }
    return 0
  })

  const userEngagementPercentage = computed(() => {
    return (userEngagement.value * 100) / communityEngagement.value
  })
  const communityEngagementPercentage = computed(() => {
    if (communityEngagement.value > 0) {
      return Math.round((communityEngagement.value * 100) / growChartStore.posts.postCommunity.length)
    }
    return 0
  })
  const userResiliencePercentage = computed(() => {
    return (userResilience.value * 100) / communityResilience.value
  })
  const communityResiliencePercentage = computed(() => {
    if (communityResilience.value > 0) {
      return Math.round((communityResilience.value * 100) / growChartStore.posts.postCommunity.length)
    }
    return 0
  })
  const chartOptions = computed(() => ({
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false,
      },
    },
    colors: ['#E77136', '#FFD4A3'],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '45%',
        endingShape: 'rounded',
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: ['Recovery Time', 'Engagement', 'Resilience'],
      labels: {
        style: {
          fontSize: '12px',
          colors: '#808079', // Example color, adjust as needed
          fontFamily: '"Poppins", sans-serif',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Percentage (%)',
      },
      max: 100,
    },
    fill: {
      opacity: 1,
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      fontFamily: '"Poppins", sans-serif',
      fontSize: '12px',
      labels: {
        colors: ['#808079'],
      },
      itemMargin: {
        horizontal: 10,
      },
    },
    tooltip: {
      enabled: false, // Disable the tooltip
    },
  }))

  const series = computed(() => ([
    {
      name: 'You',
      data: [userAveragePercentage.value, Math.min(userEngagementPercentage.value, 100), Math.min(userResiliencePercentage.value, 100)],
    },
    {
      name: 'Community Avg',
      data: [communityAveragePercentage.value, communityEngagementPercentage.value, communityResiliencePercentage.value],
    },
  ]))

</script>

<template>
  <div class="section mt-6 grow-chart">
    {{ communityEngagementPercentage }}
    <h3 class="title-section">You're Growing at Your Own Pace</h3>
    <p class="text-description fs-14">Your journey compared to community averages</p>
    <div class="mt-4">
      <VueApexCharts height="350" :options="chartOptions" :series="series" type="bar" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.text-error {
  color: red;
}
</style>
