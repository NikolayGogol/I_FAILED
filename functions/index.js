const cors = require('cors')
const express = require('express')
const admin = require('firebase-admin')
const { onRequest } = require('firebase-functions/v2/https')
require('dotenv').config() // Load environment variables from .env

// Initialize Firebase Admin FIRST
admin.initializeApp()

const authRoutes = require('./routes/auth')
const emailVerificationRoutes = require('./routes/emailVerificationRoutes') // Import the new router
const notificationRoutes = require('./routes/notifications') // Import the new router
const postsRoutes = require('./routes/posts')
const { dailyDigest, weeklyDigest } = require('./scheduled/dijest')
const { publishScheduledPosts } = require('./scheduled/publish-posts')

const app = express()

// Enable CORS for all origins
const corsMiddleware = cors({ origin: true })
app.use(corsMiddleware)

// Explicitly handle preflight (OPTIONS) requests
app.options('*', corsMiddleware)

app.use(express.json())
// Mount the routers
app.use(authRoutes)
app.use(postsRoutes)
app.use(notificationRoutes) // Use the new router
app.use(emailVerificationRoutes) // Use the new router

// Export the API as a single Cloud Function
exports.api = onRequest(app)

// Export the scheduled function
exports.publishScheduledPosts = publishScheduledPosts
exports.dailyDigest = dailyDigest
exports.weeklyDigest = weeklyDigest
