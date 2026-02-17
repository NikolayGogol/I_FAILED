const express = require('express')
const {
  createUser,
  // verifyEmailAndCreateUser,
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPasswordWithOTP,
} = require('../controllers/authController')

const router = express.Router()

// Маршрути для реєстрації
router.post('/createUser', createUser)
// router.get('/verify-email', verifyEmailAndCreateUser)

// Маршрути для скидання паролю
router.post('/sendPasswordResetOTP', sendPasswordResetOTP)
router.post('/verifyPasswordResetOTP', verifyPasswordResetOTP)
router.post('/resetPasswordWithOTP', resetPasswordWithOTP)

module.exports = router
