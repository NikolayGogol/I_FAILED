const express = require('express')
const { createUser } = require('../controllers/createUser')
const { forgotPassword, verifyOTP, resetPassword } = require('../controllers/forgotPassword')
const { verifyUser } = require('../controllers/verifyUser')

const router = express.Router()

router.post('/createUser', createUser)
router.post('/verifyUser', verifyUser)

// Password reset routes
router.post('/forgotPassword', forgotPassword)
router.post('/verifyOTP', verifyOTP)
router.post('/resetPassword', resetPassword)

module.exports = router
