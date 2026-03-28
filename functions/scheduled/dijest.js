const admin = require('firebase-admin')
const logger = require('firebase-functions/logger')

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

    logger.info(`Found users for mailing: ${users.length}`)

    for (const user of users) {
      const today = new Date(currentDate)
      today.setUTCHours(0, 0, 0, 0)

      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      logger.info(`\nSearching for posts for user ${user.id} in the UTC date range:`)
      logger.info(`  - From (>=): ${yesterday.toISOString()}`)
      logger.info(`  - To (<):   ${today.toISOString()}`)

      const postsCollection = db.collection(STATISTIC_COLLECTION).doc(user.id).collection('what_I_read')
      const postsQuery = postsCollection
        .where('createdAt', '>=', yesterday)
        .where('createdAt', '<', today)

      const postsSnapshot = await postsQuery.get()

      if (postsSnapshot.empty) {
        logger.info('Result: No posts found for yesterday.')
        continue
      }

      logger.info(`Result: Found ${postsSnapshot.size} posts from yesterday.`)
      for (const doc of postsSnapshot.docs) {
        const postData = doc.data()
        console.log(doc.id);
      }
    }

    return users
  } catch (error) {
    logger.error('Error while generating report:', error)
    return []
  }
}
module.exports = generateReport

// For testing, as if today is March 28, 2026:
const testDate = new Date('2026-03-28T10:00:00Z')
generateReport('daily', testDate)
  .then(users => logger.info(`Test run finished, found users: ${users.length}`))
  .catch(error => logger.error('Error during testing:', error))
