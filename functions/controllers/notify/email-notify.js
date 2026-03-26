const logger = require('firebase-functions/logger')
const { sendLikeNotificationEmail } = require('../../utils/email')

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
module.exports = { sendLikeEmail }
