const admin = require('firebase-admin')
const logger = require('firebase-functions/logger')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { sendDigestEmail } = require('../utils/email')

const USERS_COLLECTION = process.env.USERS_COLLECTION
const STATISTIC_COLLECTION = process.env.STATISTIC_COLLECTION

async function generateReport (type = 'daily', currentDate = new Date()) {
  const db = admin.firestore()

  try {
    const usersRef = db.collection(USERS_COLLECTION)
    const q = usersRef.where('settings.notify.email.selectedRadio', '==', type)
    const snapshot = await q.get()

    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))

    for (const user of users) {
      const today = new Date(currentDate)
      today.setUTCHours(0, 0, 0, 0)

      const startDate = new Date(today)
      if (type === 'daily') {
        startDate.setDate(startDate.getDate() - 1)
      } else if (type === 'weekly') {
        startDate.setDate(startDate.getDate() - 7)
      }

      const postsCollection = db
        .collection(STATISTIC_COLLECTION)
        .doc(user.id)
        .collection('what_I_read')
      const postsQuery = postsCollection
        .where('createdAt', '>=', startDate)
        .where('createdAt', '<', today)

      const postsSnapshot = await postsQuery.get()

      if (postsSnapshot.empty) {
        logger.info(`Result: No posts found for the ${type} period.`)
        continue
      }

      let postsCount = 0
      const categoryPostCounts = new Map()

      for (const doc of postsSnapshot.docs) {
        const postData = doc.data()
        const docRef = db
          .collection(process.env.POST_COLLECTION)
          .doc(postData.postId)
        const docSnap = await docRef.get()

        postsCount++
        if (docSnap.exists) {
          const post = docSnap.data()
          if (post.selectedCategories && post.selectedCategories.length > 0) {
            const category = post.selectedCategories[0]
            if (category && category.label) {
              categoryPostCounts.set(
                category.label,
                (categoryPostCounts.get(category.label) || 0) + 1,
              )
            }
          }
        }
      }

      const categoriesCount = categoryPostCounts.size
      logger.info(
        `User ${user.id} read ${postsCount} posts in ${categoriesCount} categories`,
      )

      if (user.email) {
        await sendDigestEmail(user.email, postsCount, categoryPostCounts, type)
      }
    }

    return users
  } catch (error) {
    logger.error('Error while generating report:', error)
    return []
  }
}

exports.dailyDigest = onSchedule({
  schedule: 'every day 09:00',
  timeZone: 'Europe/Kiev',
}, async () => {
  generateReport('daily')
    .then(users =>
      logger.info(`Daily digest run finished, found users: ${users.length}`),
    )
    .catch(error => logger.error('Error during daily digest:', error))
})

exports.weeklyDigest = onSchedule({
  schedule: 'every monday 09:00',
  timeZone: 'Europe/Kiev',
}, async () => {
  generateReport('weekly')
    .then(users =>
      logger.info(`Weekly digest run finished, found users: ${users.length}`),
    )
    .catch(error => logger.error('Error during weekly digest:', error))
})

module.exports = {
  generateReport,
  dailyDigest: exports.dailyDigest,
  weeklyDigest: exports.weeklyDigest,
}
generateReport('weekly')
