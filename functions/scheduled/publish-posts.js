// Import required modules
const admin = require('firebase-admin')
const { onSchedule } = require('firebase-functions/v2/scheduler')

/**
 * A scheduled Cloud Function that runs periodically to publish scheduled posts.
 * It checks for posts in a 'scheduled' collection that are due to be published,
 * moves them to the main 'published' collection, and updates their status.
 */
exports.publishScheduledPosts = onSchedule({
  // Define the schedule for this function to run
  schedule: 'every 10 minutes',
  // Set the timezone for the schedule
  timeZone: 'Europe/Kiev',
}, async event => {
  console.log(event)
  // Initialize Firestore
  const db = admin.firestore()
  // Get the current timestamp
  const now = admin.firestore.Timestamp.now()

  // Define collection names from environment variables, with fallbacks
  const scheduledCollection = process.env.POST_COLLECTION_SCEDULED || 'scheduledPosts'
  const publishedCollection = process.env.POST_COLLECTION || 'posts'

  console.log(`Checking for scheduled posts at ${new Date().toISOString()}...`)

  try {
    // Query the scheduled posts collection for documents where 'scheduledAt' is in the past
    const snapshot = await db.collection(scheduledCollection)
      .where('scheduledAt', '<=', now)
      .get()

    // If no posts are due, log and exit
    if (snapshot.empty) {
      console.log('No scheduled posts to publish.')
      return
    }

    console.log(`Found ${snapshot.size} posts to publish.`)

    // Create a Firestore batch to perform multiple writes as a single atomic operation
    const batch = db.batch()

    // Iterate over the documents found
    for (const doc of snapshot.docs) {
      const postData = doc.data()

      // Prepare the data for the new document in the published collection
      const publishedData = {
        ...postData,
        status: 'published', // Update status
        publishedAt: now, // Set the publication timestamp
        createdAt: now, // Set the creation timestamp
      }

      // Remove the 'scheduledAt' field as it's no longer needed
      delete publishedData.scheduledAt

      // Create a reference to the new document in the published collection, using the same ID
      const newDocRef = db.collection(publishedCollection).doc(doc.id)
      // Add the 'set' operation to the batch
      batch.set(newDocRef, publishedData)

      // Add the 'delete' operation for the original scheduled document to the batch
      batch.delete(doc.ref)
    }

    // Commit the batch to execute all operations
    await batch.commit()
    console.log(`Successfully published ${snapshot.size} posts.`)
  } catch (error) {
    // Log any errors that occur during the process
    console.error('Error publishing scheduled posts:', error)
  }
})
