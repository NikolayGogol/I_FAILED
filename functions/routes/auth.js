const express = require('express')
const { createUser } = require('../controllers/createUser')
const { requestEmailChange } = require('../controllers/requestEmailChange')
const { verifyEmailChange } = require('../controllers/verifyEmailChange')
const forgotPasswordController = require('../controllers/forgotPassword')
const { resendVerificationEmail } = require('../controllers/resendVerificationEmail')
const { verifyUser } = require('../controllers/verifyUser')

const router = express.Router()

router.post('/createUser', createUser)
router.post('/verifyUser', verifyUser)
router.post('/resendVerificationEmail', resendVerificationEmail)

// Password reset routes
router.post('/forgotPassword', forgotPasswordController.forgotPassword)
router.post('/verifyOTP', forgotPasswordController.verifyOTP)
router.post('/resetPassword', forgotPasswordController.resetPassword)

// Email change routes
router.post('/requestEmailChange', requestEmailChange)
router.post('/verifyEmailChange', verifyEmailChange)

module.exports = router
