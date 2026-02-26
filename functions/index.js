const cors = require('cors')
const express = require('express')
const admin = require('firebase-admin')
const { onRequest } = require('firebase-functions/v2/https')

// Initialize Firebase Admin FIRST
admin.initializeApp()

const authRoutes = require('./routes/auth')
const { publishScheduledPosts } = require('./scheduled/publish-posts')

const app = express()

// Enable CORS for all origins
const corsMiddleware = cors({ origin: true })
app.use(corsMiddleware)

// Explicitly handle preflight (OPTIONS) requests
app.options('*', corsMiddleware)

app.use(express.json())

// --- DEBUGGING STEP ---
// Add a simple status endpoint to check if the function is alive at all
app.get('/status', (req, res) => {
  res.status(200).send('API is running!')
})
// --- END DEBUGGING STEP ---

// Mount the routers
app.use(authRoutes)

// Export the API as a single Cloud Function
exports.api = onRequest(app)

// Export the scheduled function
exports.publishScheduledPosts = publishScheduledPosts
