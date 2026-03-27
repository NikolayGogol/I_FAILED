const logger = require('firebase-functions/logger')
const {
  sendLikeNotificationEmail,
  sendCommentNotificationEmail,
  sendMentionNotificationEmail,
  sendFollowerNotificationEmail,
} = require('../../utils/email')

async function sendLikeEmail (req, res) {
  try {
    const params = req.body
    const email = params.user.email
    const displayName = params.user.displayName
    const postTitle = params.title
    const postId = params.id
    const verificationLink = `${process.env.VERIFY_LINK}/post/${postId}`
    await sendLikeNotificationEmail(email, displayName, postTitle, verificationLink)
    return res.status(200).json({
      status: 'success',
    })
  } catch (error) {
    logger.error('Error in registration process:', error)
    res.status(500).json({ error: 'Failed send email', message: error.message })
  }
}
async function sendCommentEmail (req, res) {
  try {
    const params = req.body
    const email = params.post.user.email
    const displayName = params.authStore.displayName
    const postTitle = params.post.title
    const postId = params.post.id
    const commentText = params.comment.text
    const commentId = params.comment.id
    const postLink = `${process.env.VERIFY_LINK}/post/${postId}#${commentId}`
    await sendCommentNotificationEmail(email, displayName, postTitle, commentText, postLink)
    return res.status(200).json({
      status: 'success',
    })
  } catch (error) {
    logger.error('Error in registration process:', error)
    res.status(500).json({ error: 'Failed send email', message: error.message })
  }
}
async function sendMentionEmail (req, res) {
  try {
    const { recipientEmail, mentionerName, postTitle, commentText, postLink } = req.body
    await sendMentionNotificationEmail(
      recipientEmail,
      mentionerName,
      postTitle,
      commentText,
      postLink)
    return res.status(200).json({
      status: 'success',
    })
  } catch (error) {
    logger.error('Error in registration process:', error)
    res.status(500).json({ error: 'Failed send email', message: error.message })
  }
}

async function sendFollowerEmail (req, res) {
  try {
    const { recipientEmail, followerName, followerId } = req.body
    const followerProfileLink = `${process.env.VERIFY_LINK}/user-info/${followerId}`
    await sendFollowerNotificationEmail(recipientEmail, followerName, followerProfileLink)
    return res.status(200).json({
      status: 'success',
    })
  } catch (error) {
    logger.error('Error in follower email process:', error)
    res.status(500).json({ error: 'Failed send email', message: error.message })
  }
}

//
module.exports = { sendLikeEmail, sendCommentEmail, sendMentionEmail, sendFollowerEmail }
