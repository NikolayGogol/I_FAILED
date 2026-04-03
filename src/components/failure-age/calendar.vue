<script setup>
  import { computed, ref } from 'vue'
  import { useFailureAgeStore } from '@/stores/failure-age.js'

  const failureAgeStore = useFailureAgeStore()

  // Reactive variables for the currently displayed month
  const today = new Date()
  const currentYear = ref(today.getFullYear())
  const currentMonth = ref(today.getMonth()) // 0-11

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const currentMonthName = computed(() => monthNames[currentMonth.value])

  const postsByDay = computed(() => {
    const posts = failureAgeStore.posts || []
    const postsMap = {}
    for (const post of posts) {
      if (!post.createdAt || !post.createdAt.seconds) continue
      const postDate = new Date(post.createdAt.seconds * 1000)

      if (Number.isNaN(postDate)) {
        continue
      }

      if (
        postDate.getFullYear() === currentYear.value
        && postDate.getMonth() === currentMonth.value
      ) {
        const day = postDate.getDate()
        postsMap[day] = (postsMap[day] || 0) + 1
      }
    }
    return postsMap
  })

  const calendarGrid = computed(() => {
    const year = currentYear.value
    const month = currentMonth.value

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const dayOfWeek = new Date(year, month, 1).getDay() // 0=Sunday, 1=Monday...
    const emptyCells = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // For Monday start

    const grid = []
    // Add empty cells for the days of the previous month
    for (let i = 0; i < emptyCells; i++) {
      grid.push({ type: 'empty' })
    }

    // Add the days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      grid.push({
        type: 'day',
        day: day,
        count: postsByDay.value[day] || 0,
      })
    }

    return grid
  })

  function previousMonth () {
    if (currentMonth.value === 0) {
      currentMonth.value = 11
      currentYear.value--
    } else {
      currentMonth.value--
    }
  }

  function nextMonth () {
    if (currentMonth.value === 11) {
      currentMonth.value = 0
      currentYear.value++
    } else {
      currentMonth.value++
    }
  }

  function getColorClass (count) {
    if (!count || count === 0) return 'bg-orange-lighten-5'
    if (count === 1) return 'bg-orange-lighten-4'
    if (count <= 3) return 'bg-orange-lighten-3'
    if (count <= 5) return 'bg-orange-lighten-2'
    return 'bg-orange-lighten-1'
  }
</script>

<template>
  <div class="section mt-6 calendar">
    <h3 class="title-section">Your Activity Calendar</h3>
    <p class="text-description fs-14">Heatmap view of active failure periods</p>

    <div class="calendar-controls mt-4">
      <v-btn color="primary" density="comfortable" icon="mdi-chevron-left" @click="previousMonth" />
      <span class="month-name">{{ currentMonthName }} {{ currentYear }}</span>
      <v-btn color="primary" density="comfortable" icon="mdi-chevron-right" @click="nextMonth" />
    </div>
    <div class="d-flex justify-center">
      <ul class="list-week">
        <li>Mon</li>
        <li>Tue</li>
        <li>Wed</li>
        <li>Thu</li>
        <li>Fri</li>
        <li>Sat</li>
        <li>Sun</li>
      </ul>
    </div>
    <div class="d-flex justify-center">
      <div class="calendar-grid mt-2">
        <div
          v-for="(item, index) in calendarGrid"
          :key="index"
          :class="[
            item.type === 'day' ? 'calendar-day' : 'calendar-day-empty',
            item.type === 'day' ? getColorClass(item.count) : ''
          ]"
        />
      </div>
    </div>
    <div class="d-flex justify-center align-center mt-4 legend">
      <span>Less</span>
      <ul class="d-flex">
        <li class="calendar-day bg-orange-lighten-5" />
        <li class="calendar-day bg-orange-lighten-4" />
        <li class="calendar-day bg-orange-lighten-3" />
        <li class="calendar-day bg-orange-lighten-2" />
        <li class="calendar-day bg-orange-lighten-1" />
      </ul>
      <span>More</span>
    </div>
  </div>
</template>
