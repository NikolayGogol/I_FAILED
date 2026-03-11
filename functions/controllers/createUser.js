// Import required modules
const crypto = require('node:crypto')
const admin = require('firebase-admin')
const { FieldValue, Timestamp } = require('firebase-admin/firestore')
const logger = require('firebase-functions/logger')
const { sendVerificationEmail } = require('../utils/email')

// Initialize Firestore
const db = admin.firestore()

/**
 * Handles the initial user registration request.
 * This function creates a pending user entry in Firestore and sends a verification email.
 */
exports.createUser = async (req, res) => {
  try {
    // Extract user data from the request body
    const { email, password, displayName, whyJoining } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // 1. CHECK IF USER ALREADY EXISTS IN FIREBASE AUTH
    try {
      const userRecord = await admin.auth().getUserByEmail(email)
      if (userRecord) {
        logger.warn(`Registration attempt for existing email: ${email}`)
        return res.status(409).json({ error: 'User already exists', message: 'The email address is already in use by another account.' })
      }
    } catch (error) {
      // If error.code is 'auth/user-not-found', it means the user does NOT exist, which is good.
      // If it's any other error, we should probably stop.
      if (error.code !== 'auth/user-not-found') {
        logger.error('Error checking user existence:', error)
        return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to validate user existence.' })
      }
    }

    // 2. CHECK IF USER ALREADY HAS A PENDING REGISTRATION (Optional but recommended)
    // You might want to prevent spamming verification emails.
    // For now, we proceed to create a new pending request which overwrites or adds to the collection.

    // Generate a secure, random token for email verification
    const verificationToken = crypto.randomBytes(32).toString('hex')

    // Set the verification token to expire in 24 hours
    const expiresAtDate = new Date()
    expiresAtDate.setHours(expiresAtDate.getHours() + 24)

    // Create a reference to the pending user document in Firestore
    // Using a default collection name if the environment variable is not set
    const pendingUsersCollection = process.env.PENDING_USERS || 'pending_users'
    const pendingUserRef = db.collection(pendingUsersCollection).doc(verificationToken)

    // Store the user's data in the pending users collection
    await pendingUserRef.set({
      email,
      password, // Note: Storing passwords in plaintext is not recommended for production. Consider a more secure flow.
      displayName,
      whyJoining,
      expiresAt: Timestamp.fromDate(expiresAtDate),
      createdAt: FieldValue.serverTimestamp(),
    })

    // Construct the verification link
    const verifyLinkBase = process.env.VERIFY_LINK || 'https://ifailed-25dab.web.app'
    const verificationLink = `${verifyLinkBase}/verify-new-user?token=${verificationToken}`

    // Send the verification email to the user
    await sendVerificationEmail(email, verificationLink)

    // Respond with success and the verification token
    return res.status(200).json({ status: 'success', message: 'Verification email sent.', verificationToken })
  } catch (error) {
    // Log and respond with an error if something goes wrong
    logger.error('Error in registration process:', error)
    res.status(500).json({ error: 'Failed to start registration', message: error.message })
  }
}
