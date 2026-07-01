import dayjs from 'dayjs'
import { list as ageMilestones } from '@/models/age.js'
import { recoveryTimeOptions } from '@/models/categories.js'
import { useAuthStore } from '@/stores/auth.js'
import { useFailureAgeStore } from '@/stores/failure-age.js'
import { lessonCounter } from '@/utils/lesson-counter.js'

export function lessonCounterTemplate (arr) {
  let counter = 0
  const data = arr.filter(el => el.lessonLearned)
  for (const item of data) {
    counter += lessonCounter(item?.lessonLearned)
  }
  return counter
}
export function totalCostTemplate (arr) {
  return arr.map(el => el.lessonLearned)
    .filter(Boolean)
    .map(el => el.cost)
    .reduce((a, b) => Number(a) + Number(b), 0)
}
export function recoveryTimeTemplate (arr) {
  const maxRecoveryDays = Math.max(...recoveryTimeOptions.map(opt => opt.days))
  const data = arr.map(el => el.lessonLearned)
    .filter(Boolean)
  const lessonLearned = data
    .filter(item => item?.recoveryTime)
    .map(el => el.recoveryTime?.days)
    .filter(Boolean)
  const daysCount = lessonLearned.reduce((acc, curr) => acc + curr, 0)
  const average = daysCount / lessonLearned.length
  if (average > 0) {
    return Math.round((average / maxRecoveryDays) * 100)
  }
  return 0
}

export function timelineDataTemplate (posts) {
  const failureAgeStore = useFailureAgeStore()
  const user = useAuthStore().user
  const userDob = user?.dob || '10/13/1991'
  const helpfulCommentsBonus = failureAgeStore.helpfulCommentsTotalData.count
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
    if (a.isMilestone) {
      return -1
    }
    if (b.isMilestone) {
      return 1
    }

    // Lessons come before posts
    if (a.isLesson && !b.isLesson) {
      return -1
    }
    if (!a.isLesson && b.isLesson) {
      return 1
    }

    return 0 // Keep original order if all other criteria are equal
  })
}
export function keyLessonsTemplate (arr) {
  return arr.map(el => el.lessonLearned)
    .filter(Boolean)
    .map(el => el.keyTakeaways)
    .filter(Boolean)
}
