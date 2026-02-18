const express = require('express')
const { createUser } = require('../controllers/createUser')
const { verifyUser } = require('../controllers/verifyUser')

const router = express.Router()

router.post('/createUser', createUser)
router.post('/verifyUser', verifyUser)

module.exports = router
