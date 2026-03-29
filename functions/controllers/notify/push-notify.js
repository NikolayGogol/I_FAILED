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
  const { fcmToken, postTitle, likedBy, type, postId } = req.body
  const title = 'New Like!'
  const body = `${likedBy} liked your post: "${postTitle}"`

  try {
    await sendPushNotification(fcmToken, title, body, { type, url: `/post/${postId}` })
    res.status(200).send('Push notification sent successfully')
  } catch {
    res.status(500).send('Error sending push notification')
  }
}
async function sendCommentPush (req, res) {
  const { fcmToken, postTitle, likedBy, type, postId, commentID } = req.body
  const title = 'New Comment!'
  const body = `${likedBy} comment your post: "${postTitle}"`

  try {
    await sendPushNotification(fcmToken, title, body, { type, url: `/post/${postId}#${commentID}` })
    res.status(200).send('Push notification sent successfully')
  } catch {
    res.status(500).send('Error sending push notification')
  }
}
async function sendMentionPush (req, res) {
  const { fcmToken, postTitle, likedBy, type, postId, commentID } = req.body
  const title = 'New Mention!'
  const body = `${likedBy} mention your: "${postTitle}"`

  try {
    await sendPushNotification(fcmToken, title, body, { type, url: `/post/${postId}#${commentID}` })
    res.status(200).send('Push notification sent successfully')
  } catch {
    res.status(500).send('Error sending push notification')
  }
}
async function sendFollowPush (req, res) {
  const { fcmToken, followerName, type } = req.body
  const title = 'New Following!'
  const body = `${followerName} follow your`
  try {
    await sendPushNotification(fcmToken, title, body, { type, url: '' })
    res.status(200).send('Push notification sent successfully')
  } catch {
    res.status(500).send('Error sending push notification')
  }
}

module.exports = {
  sendLikePush,
  sendCommentPush,
  sendMentionPush,
  sendFollowPush,
}
