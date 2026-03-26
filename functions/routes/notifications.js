const express = require('express')
const { sendLikeEmail } = require('../controllers/notify/email-notify')
const router = express.Router()

router.post('/send-like-email', sendLikeEmail)

module.exports = router
