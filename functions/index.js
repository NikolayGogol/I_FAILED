const { onRequest } = require('firebase-functions/v2/https')
const logger = require('firebase-functions/logger')
const express = require('express')
const cors = require('cors')

const app = express()

// Automatically allow cross-origin requests
app.use(cors({ origin: true }))

app.get('/helloWorld', (req, res) => {
  logger.info('Hello logs!', { structuredData: true })
  res.json({
    message: 'Hello from Firebase!',
    timestamp: new Date().toISOString(),
    query: req.query,
  })
})

app.get('/anotherFunction', (req, res) => {
  res.send('I am also public thanks to Express!')
})

exports.api = onRequest(app)
