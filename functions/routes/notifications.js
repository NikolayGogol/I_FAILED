const express = require('express')
const { sendLikeEmail, sendCommentEmail } = require('../controllers/notify/email-notify')
const router = express.Router()

router.post('/send-like-email', sendLikeEmail)
router.post('/send-comment-email', sendCommentEmail)

module.exports = router
