/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const logger = require('firebase-functions/logger')
const { onRequest } = require('firebase-functions/v2/https')

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

exports.helloWorld = onRequest({ cors: true }, (request, response) => {
  console.log(2)
  logger.info('Hello logs!', { structuredData: true })
  response.json({
    message: 'Hello from Firebase!',
    timestamp: new Date().toISOString(),
    query: request.query,
  })
})
