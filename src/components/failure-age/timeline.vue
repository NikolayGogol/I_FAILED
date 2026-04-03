<script setup>
  import dayjs from 'dayjs'
  import { computed } from 'vue'
  import { list as ageMilestones } from '@/models/age.js'
  import { useAuthStore } from '@/stores/auth.js'
  import { useFailureAgeStore } from '@/stores/failure-age.js'

  const failureAgeStore = useFailureAgeStore()
  const authStore = useAuthStore()

  const combinedTimelineData = computed(() => {
    const posts = failureAgeStore.posts || []
    const userDob = authStore.user?.dob
    const helpfulCommentsBonus = (failureAgeStore.helpfulCommentsCount || 0) * 0.25

    if (!userDob || !dayjs(userDob, 'MM/DD/YYYY').isValid()) {
      return posts.map(p => ({ ...p, isMilestone: false, isLesson: false })).toSorted((a, b) => b.createdAt.seconds - a.createdAt.seconds)
    }

    const birthDate = dayjs(userDob, 'MM/DD/YYYY')

    // 1. Create a flat list of all potential events (posts and lessons)
    const allEvents = []
    for (const post of posts) {
      // Add the original post event
      allEvents.push({ ...post, type: 'post' })

      // If the post has a lesson with its own timestamp, add it as a separate event
      if (post.lessonLearned && post.lessonLearned.createdAt) {
        allEvents.push({
          ...post, // Carry over post data like title
          id: `lesson-${post.id}`, // Create a unique ID for the lesson event
          createdAt: post.lessonLearned.createdAt,
          type: 'lesson',
        })
      }
    }

    // 2. Sort all events chronologically to process them in the correct order
    allEvents.sort((a, b) => a.createdAt.seconds - b.createdAt.seconds)

    const timelineItems = []
    let runningLessonsLearned = 0
    let runningUnresolved = 0

    // 3. Process all events chronologically
    for (const event of allEvents) {
      if (event.type === 'post') {
        timelineItems.push({ ...event, isMilestone: false, isLesson: false })
        runningUnresolved++
      } else if (event.type === 'lesson') {
        timelineItems.push({ ...event, isMilestone: false, isLesson: true })
        runningLessonsLearned++
        runningUnresolved--
      }

      // After each event, recalculate the failure age
      const eventDate = dayjs.unix(event.createdAt.seconds)
      const actualAgeAtEventTime = eventDate.diff(birthDate, 'year')
      const wisdomGap = (runningLessonsLearned * 1.5) + (runningUnresolved * 0.9) + helpfulCommentsBonus
      const currentFailureAge = actualAgeAtEventTime + wisdomGap

      // Check if a milestone was crossed
      let lastAchievedMilestoneAge = timelineItems
        .filter(i => i.isMilestone)
        .reduce((max, i) => Math.max(max, i.milestoneAge), 0)

      let milestoneJustAchieved = ageMilestones.find(m => m.age > lastAchievedMilestoneAge && currentFailureAge >= m.age)

      while (milestoneJustAchieved) {
        timelineItems.push({
          id: `age-milestone-${milestoneJustAchieved.age}`,
          title: `🎉 Reached ${milestoneJustAchieved.age} Failure Age`,
          createdAt: event.createdAt,
          isMilestone: true,
          isLesson: false,
          milestoneLabel: milestoneJustAchieved.label,
          milestoneAge: milestoneJustAchieved.age,
          description: milestoneJustAchieved.label,
        })
        lastAchievedMilestoneAge = milestoneJustAchieved.age
        milestoneJustAchieved = ageMilestones.find(m => m.age > lastAchievedMilestoneAge && currentFailureAge >= m.age)
      }
    }

    // 4. Sort the final combined list for display (newest first)
    return timelineItems.toSorted((a, b) => {
      // Primary sort: newest first by creation time
      if (b.createdAt.seconds !== a.createdAt.seconds) {
        return b.createdAt.seconds - a.createdAt.seconds
      }

      // Secondary sort for items with the same creation time
      // Higher milestone age comes first
      if (a.isMilestone && b.isMilestone) {
        return b.milestoneAge - a.milestoneAge
      }

      // Milestones come before anything else
      if (a.isMilestone) return -1
      if (b.isMilestone) return 1

      // Lessons come before posts
      if (a.isLesson && !b.isLesson) return -1
      if (!a.isLesson && b.isLesson) return 1

      return 0 // Keep original order if all other criteria are equal
    })
  })
</script>

<template>
  <section v-if="combinedTimelineData.length > 0" class="section recovery-timeline">
    <div class="title-section">Recovery Timeline</div>
    <div class="position-relative">
      <div class="line" />
      <ul>
        <li
          v-for="card in combinedTimelineData"
          :key="card.id"
          class="item"
          :class="[
            {'milestone-tag': card.isMilestone},
            {'lesson-tag': card.isLesson}
          ]"
        >
          <div class="time-card">
            <p>{{ dayjs.unix(card.createdAt.seconds).format('MMMM') }}</p>
            <p>{{ dayjs.unix(card.createdAt.seconds).format('YYYY') }}</p>
          </div>
          <div class="content-card">
            <div v-if="card.selectedCategories && !card.isLesson" class="d-flex align-center justify-space-between">
              <div v-if="card?.selectedCategories[0]?.label" class="tag">{{ card.selectedCategories[0].label }}</div>
              <div v-if="card.lessonLearned" class="tag-green">RECOVERED</div>
              <div v-else class="tag-yellow">RECOVERING</div>
            </div>
            <h5>
              <template v-if="card.isLesson">💡</template>
              {{ card.title }}
            </h5>
            <p v-if="card.isMilestone" class="text-description">Unlocked {{ card.description }}</p>
            <div class="d-flex mt-2">
              <div v-if="!card.isLesson && card?.lessonLearned?.recoveryTime" class="text-description fs-12">
                ⏱️ {{ card.lessonLearned.recoveryTime.title }} recovery
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
