const admin = require('firebase-admin')
const { FieldValue } = require('firebase-admin/firestore')
const logger = require('firebase-functions/logger')
const { sendWelcomeEmail } = require('../utils/email')

const db = admin.firestore()

exports.verifyUser = async (req, res) => {
  try {
    const { token } = req.body
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' })
    }

    const pendingUserRef = db.collection(process.env.PENDING_USERS).doc(token)
    const pendingUserDoc = await pendingUserRef.get()

    if (!pendingUserDoc.exists) {
      logger.warn(`Verification attempt with non-existent token: ${token}`)
      return res.status(404).json({ error: 'Invalid or expired token' })
    }

    const pendingUserData = pendingUserDoc.data()
    const { email, password, displayName, whyJoining, expiresAt } = pendingUserData

    // Check if the token has expired
    if (expiresAt && expiresAt.toDate() < new Date()) {
      logger.warn(`Verification attempt with expired token for email: ${email}`)
      await pendingUserRef.delete()
      return res.status(400).json({ error: 'Verification token has expired.' })
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      emailVerified: true, // Mark email as verified
    })

    // Store user data in 'users' collection
    await db.collection(process.env.USERS_COLLECTION).doc(userRecord.uid).set({
      email,
      displayName,
      whyJoining,
      createdAt: FieldValue.serverTimestamp(),
    })

    // Delete the pending user document
    await pendingUserRef.delete()

    // Send welcome email
    try {
      await sendWelcomeEmail(email, displayName)
    } catch (emailError) {
      logger.error('Failed to send welcome email after verification:', emailError)
      // We don't fail the whole process if the welcome email fails
    }

    return res.status(201).json({ status: 'success', uid: userRecord.uid })
  } catch (error) {
    logger.error('Error verifying user:', error)
    res.status(500).json({ error: 'Failed to verify user', message: error.message })
  }
}
