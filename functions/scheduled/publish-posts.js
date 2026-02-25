const admin = require('firebase-admin')
const { onSchedule } = require('firebase-functions/v2/scheduler')

exports.publishScheduledPosts = onSchedule({
  schedule: 'every 1 minutes',
  timeZone: 'Europe/Kiev', // Set your timezone
}, async event => {
  const db = admin.firestore()
  const now = admin.firestore.Timestamp.now()
  const scheduledCollection = process.env.POST_COLLECTION_SCEDULED || 'scheduledPosts'
  const publishedCollection = process.env.POST_COLLECTION || 'posts'

  console.log(`Checking for scheduled posts at ${new Date().toISOString()}...`)

  try {
    // Query for scheduled posts that are due
    const snapshot = await db.collection(scheduledCollection)
      .where('scheduledAt', '<=', now)
      .get()

    if (snapshot.empty) {
      console.log('No scheduled posts to publish.')
      return
    }

    console.log(`Found ${snapshot.size} posts to publish.`)

    const batch = db.batch()

    for (const doc of snapshot.docs) {
      const postData = doc.data()

      // Prepare data for the published collection
      const publishedData = {
        ...postData,
        status: 'published',
        publishedAt: now,
      }

      // Remove scheduledAt field
      delete publishedData.scheduledAt

      // Create a new document in the published collection with the same ID
      const newDocRef = db.collection(publishedCollection).doc(doc.id)
      batch.set(newDocRef, publishedData)

      // Delete the document from the scheduled collection
      batch.delete(doc.ref)
    }

    await batch.commit()
    console.log(`Successfully published ${snapshot.size} posts.`)
  } catch (error) {
    console.error('Error publishing scheduled posts:', error)
  }
})
