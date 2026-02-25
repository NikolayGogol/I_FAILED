const express = require('express')
const { getAllUsers } = require('../controllers/getAllUsers')

const router = express.Router()

router.get('/getAllUsers', getAllUsers)

module.exports = router
