const express = require('express')
const { sendLikeEmail, sendCommentEmail, sendMentionEmail, sendFollowerEmail } = require('../controllers/notify/email-notify')
const { sendLikePush, sendCommentPush, sendMentionPush, sendFollowPush } = require('../controllers/notify/push-notify')
const router = express.Router()

router.post('/send-like-email', sendLikeEmail)
router.post('/send-comment-email', sendCommentEmail)
router.post('/send-mention-email', sendMentionEmail)
router.post('/send-follower-email', sendFollowerEmail)
router.post('/send-like-push', sendLikePush)
router.post('/send-comment-push', sendCommentPush)
router.post('/send-mention-push', sendMentionPush)
router.post('/send-follower-push', sendFollowPush)

module.exports = router
