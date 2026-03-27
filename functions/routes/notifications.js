const express = require('express')
const { sendLikeEmail, sendCommentEmail, sendMentionEmail, sendFollowerEmail } = require('../controllers/notify/email-notify')
const router = express.Router()

router.post('/send-like-email', sendLikeEmail)
router.post('/send-comment-email', sendCommentEmail)
router.post('/send-mention-email', sendMentionEmail)
router.post('/send-follower-email', sendFollowerEmail)

module.exports = router
