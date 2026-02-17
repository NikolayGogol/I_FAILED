const cors = require('cors')
const express = require('express')
const admin = require('firebase-admin')
const { onRequest } = require('firebase-functions/v2/https')

// Initialize Firebase Admin FIRST
admin.initializeApp()

const authRoutes = require('./routes/auth')
const miscRoutes = require('./routes/misc')

const app = express()

// Enable CORS for all origins
const corsMiddleware = cors({ origin: true })
app.use(corsMiddleware)

// Explicitly handle preflight (OPTIONS) requests
app.options('*', corsMiddleware)

app.use(express.json())

// Mount the routers
app.use(authRoutes)
app.use(miscRoutes)

// Export the API as a single Cloud Function
exports.api = onRequest(app)
