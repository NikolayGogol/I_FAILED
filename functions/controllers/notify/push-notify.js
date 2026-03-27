const admin = require('firebase-admin')

async function sendPushNotification (fcmToken, title, body, data = {}) {
  if (!fcmToken) {
    console.error('FCM token is missing')
    return
  }

  const message = {
    notification: {
      title,
      body,
    },
    data,
    token: fcmToken,
  }

  try {
    await admin.messaging().send(message)
    console.log('Push notification sent successfully')
  } catch (error) {
    console.error('Error sending push notification:', error)
  }
}

async function sendLikePush (req, res) {
  const { fcmToken, postTitle, likedBy, type } = req.body
  const title = 'New Like!'
  const body = `${likedBy} liked your post: "${postTitle}"`

  try {
    await sendPushNotification(fcmToken, title, body, { type })
    res.status(200).send('Push notification sent successfully')
  } catch {
    res.status(500).send('Error sending push notification')
  }
}

module.exports = {
  sendPushNotification,
  sendLikePush,
}
