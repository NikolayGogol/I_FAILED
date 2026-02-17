const express = require('express')
const {
  helloWorld,
  anotherFunction,
  cleanupExpiredOTPs,
} = require('../controllers/miscController')

const router = express.Router()

router.get('/helloWorld', helloWorld)
router.get('/anotherFunction', anotherFunction)
router.post('/cleanupExpiredOTPs', cleanupExpiredOTPs)

module.exports = router
