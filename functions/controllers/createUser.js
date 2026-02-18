const admin = require('firebase-admin')
const { FieldValue, Timestamp } = require('firebase-admin/firestore')
const logger = require('firebase-functions/logger')
const { sendVerificationEmail } = require('../utils/email')
const crypto = require('crypto')

const db = admin.firestore()

exports.createUser = async (req, res) => {
  try {
    const { email, password, displayName, whyJoining } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Generate a verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')

    // Set expiration to 24 hours from now
    const expiresAtDate = new Date()
    expiresAtDate.setHours(expiresAtDate.getHours() + 24)

    // Store user data temporarily
    await db.collection(process.env.PENDING_USERS).doc(verificationToken).set({
      email,
      password,
      displayName,
      whyJoining,
      expiresAt: Timestamp.fromDate(expiresAtDate),
      createdAt: FieldValue.serverTimestamp(),
    })

    const verificationLink = `${process.env.VERIFY_LINK}/verify-new-user?token=${verificationToken}`
    await sendVerificationEmail(email, verificationLink)

    return res.status(200).json({ status: 'success', message: 'Verification email sent.' })
  } catch (error) {
    logger.error('Error in registration process:', error)
    res.status(500).json({ error: 'Failed to start registration', message: error.message })
  }
}
