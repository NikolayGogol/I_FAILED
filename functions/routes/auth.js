const express = require('express')
const { createUser } = require('../controllers/createUser')
const { forgotPassword, verifyOTP, resetPassword } = require('../controllers/forgotPassword')
const { resendVerificationEmail } = require('../controllers/resendVerificationEmail')
const { verifyUser } = require('../controllers/verifyUser')

const router = express.Router()

router.post('/createUser', createUser)
router.post('/verifyUser', verifyUser)
router.post('/resendVerificationEmail', resendVerificationEmail)

// Password reset routes
router.post('/forgotPassword', forgotPassword)
router.post('/verifyOTP', verifyOTP)
router.post('/resetPassword', resetPassword)

module.exports = router
