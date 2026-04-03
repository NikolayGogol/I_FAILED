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
    // The helpful comments count is a global bonus to the wisdom gap
    const helpfulCommentsBonus = (failureAgeStore.helpfulCommentsCount || 0) * 0.25

    // If there's no date of birth, we can't calculate age, so just show posts.
    if (!userDob || !dayjs(userDob, 'MM/DD/YYYY').isValid()) {
      return posts.map(p => ({ ...p, isMilestone: false })).toSorted((a, b) => b.createdAt.seconds - a.createdAt.seconds)
    }

    const birthDate = dayjs(userDob, 'MM/DD/YYYY')

    // Sort posts oldest to newest to process them chronologically
    const sortedPosts = [...posts].toSorted((a, b) => a.createdAt.seconds - b.createdAt.seconds)

    const timelineItems = []
    let runningLessonsLearned = 0
    let runningUnresolved = 0

    for (const post of sortedPosts) {
      // 1. Add the post itself to the timeline
      timelineItems.push({ ...post, isMilestone: false })

      // 2. Update the running counts based on the post's properties
      if (post.lessonLearned) {
        runningLessonsLearned++
      } else {
        runningUnresolved++
      }

      // 3. Calculate the failure age as it was right after this post was made
      const postDate = dayjs.unix(post.createdAt.seconds)
      const actualAgeAtPostTime = postDate.diff(birthDate, 'year')

      // The wisdom gap formula, derived from failure-age.js
      // (lessons * 1.5) + (unresolved * 0.9)
      const wisdomGap = (runningLessonsLearned * 1.5) + (runningUnresolved * 0.9) + helpfulCommentsBonus
      const currentFailureAge = actualAgeAtPostTime + wisdomGap

      // 4. Check if this new failure age has crossed a milestone threshold
      const lastAchievedMilestoneAge = timelineItems
        .filter(i => i.isMilestone)
        .reduce((max, i) => Math.max(max, i.milestoneAge), 0)

      const milestoneJustAchieved = ageMilestones.find(m => m.age > lastAchievedMilestoneAge && currentFailureAge >= m.age)

      if (milestoneJustAchieved) {
        // 5. If a milestone was achieved, add it to the timeline
        timelineItems.push({
          id: `age-milestone-${milestoneJustAchieved.age}`,
          title: `🎉 Reached ${milestoneJustAchieved.age} Failure Age`,
          createdAt: post.createdAt, // This milestone was achieved at the same time as the post
          isMilestone: true,
          milestoneLabel: milestoneJustAchieved.label,
          milestoneAge: milestoneJustAchieved.age,
          description: milestoneJustAchieved.label,
        })
      }
    }

    // Sort the final combined list for display (newest first)
    return timelineItems.toSorted((a, b) => {
      if (b.createdAt.seconds !== a.createdAt.seconds) {
        return b.createdAt.seconds - a.createdAt.seconds
      }
      // If a post and a milestone have the same timestamp, show the milestone first in the descending list.
      return b.isMilestone ? 1 : -1
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
          :class="{'milestone-tag': card?.isMilestone}"
        >
          <div class="time-card">
            <p>{{ dayjs.unix(card.createdAt.seconds).format('MMMM') }}</p>
            <p>{{ dayjs.unix(card.createdAt.seconds).format('YYYY') }}</p>
          </div>
          <div class="content-card">
            <div class="d-flex align-center justify-space-between">
              <template v-if="card.selectedCategories">
                <div v-if="card?.selectedCategories[0]?.label" class="tag">{{ card.selectedCategories[0].label }}</div>
                <div v-if="card?.lessonLearned" class="tag-green">RECOVERED</div>
                <div v-else class="tag-yellow">RECOVERING</div>
              </template>
            </div>
            <h5>{{ card.title }}</h5>
            <p v-if="card?.isMilestone" class="text-description">Unlocked {{ card.description }}</p>
            <div class="d-flex mt-2">
              <div v-if="!card.isMilestone && card?.lessonLearned?.recoveryTime" class="text-description fs-12">
                ⏱️ {{ card.lessonLearned.recoveryTime.title }} recovery
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
