const admin = require('firebase-admin')
const { onSchedule } = require('firebase-functions/v2/scheduler')

exports.publishScheduledPosts = onSchedule('every 10 minutes', async event => {
  const db = admin.firestore()
  const now = admin.firestore.Timestamp.now()

  try {
    const snapshot = await db.collection(process.env.POST_COLLECTION)
      .where('status', '==', 'scheduled')
      .where('scheduledAt', '<=', now)
      .get()

    if (snapshot.empty) {
      console.log('No scheduled posts to publish.')
      return
    }

    const batch = db.batch()
    for (const doc of snapshot.docs) {
      batch.update(doc.ref, {
        status: 'published',
        publishedAt: now,
        scheduledAt: admin.firestore.FieldValue.delete(),
      })
    }

    await batch.commit()
    console.log(`Successfully published ${snapshot.size} posts.`)
  } catch (error) {
    console.error('Error publishing scheduled posts:', error)
  }
})
