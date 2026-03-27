const express = require('express')
const { sendLikeEmail, sendCommentEmail, sendMentionEmail } = require('../controllers/notify/email-notify')
const router = express.Router()

router.post('/send-like-email', sendLikeEmail)
router.post('/send-comment-email', sendCommentEmail)
router.post('/send-mention-email', sendMentionEmail)

module.exports = router
