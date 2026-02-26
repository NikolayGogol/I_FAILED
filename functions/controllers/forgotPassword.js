const admin = require('firebase-admin')
const { Timestamp } = require('firebase-admin/firestore')
const logger = require('firebase-functions/logger')
const { sendOTPEmail } = require('../utils/email')

const db = admin.firestore()

exports.forgotPassword = async (req, res) => {
  logger.info('Forgot Password function triggered.')

  try {
    const { email } = req.body
    if (!email) {
      logger.warn('Forgot Password attempt without email.')
      return res.status(400).json({ message: 'Email is required' })
    }

    logger.info(`Processing forgot password for email: ${email}`)

    // Check if user exists in Firebase Auth
    try {
      logger.info('Checking if user exists in Firebase Auth...')
      await admin.auth().getUserByEmail(email)
      logger.info('User found in Firebase Auth.')
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        logger.warn(`Forgot password attempt for non-existent user: ${email}`)
        return res.status(404).json({ message: 'No account found with this email' })
      }
      // Re-throw other auth errors to be caught by the outer catch block
      logger.error('Error checking user in Firebase Auth:', error)
      throw error
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100_000 + Math.random() * 900_000).toString()
    logger.info(`Generated OTP: ${otp} for email: ${email}`)

    // Set expiration to 15 minutes from now
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)

    // Store OTP in Firestore
    logger.info('Storing OTP in Firestore...')
    await db.collection('password_resets').doc(email).set({
      otp,
      expiresAt: Timestamp.fromDate(expiresAt),
      verified: false,
    })
    logger.info('OTP stored successfully.')

    // Send OTP via email
    logger.info('Sending OTP email...')
    await sendOTPEmail(email, otp)
    logger.info('OTP email sent successfully.')

    return res.status(200).json({ message: 'Verification code sent to your email' })
  } catch (error) {
    logger.error('Critical error in forgotPassword function:', error)
    res.status(500).json({ message: 'Failed to process request', error: error.message })
  }
}

exports.verifyOTP = async (req, res) => {
  // ... (rest of the file is the same)
  try {
    const { email, code } = req.body
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' })
    }

    const docRef = db.collection('password_resets').doc(email)
    const doc = await docRef.get()

    if (!doc.exists) {
      return res.status(400).json({ message: 'Invalid or expired code' })
    }

    const data = doc.data()
    const now = Timestamp.now()

    if (data.otp !== code) {
      return res.status(400).json({ message: 'Invalid verification code' })
    }

    if (now.toMillis() > data.expiresAt.toMillis()) {
      return res.status(400).json({ message: 'Verification code has expired' })
    }

    // Mark as verified
    await docRef.update({ verified: true })

    return res.status(200).json({ message: 'Code verified successfully' })
  } catch (error) {
    logger.error('Error in verifyOTP:', error)
    res.status(500).json({ message: 'Failed to verify code', error: error.message })
  }
}

exports.resetPassword = async (req, res) => {
  try {
    const { email, code, password } = req.body
    if (!email || !code || !password) {
      return res.status(400).json({ message: 'Email, code and password are required' })
    }

    const docRef = db.collection('password_resets').doc(email)
    const doc = await docRef.get()

    if (!doc.exists) {
      return res.status(400).json({ message: 'Invalid request' })
    }

    const data = doc.data()

    if (data.otp !== code || !data.verified) {
      return res.status(400).json({ message: 'Code not verified' })
    }

    // Update user password in Firebase Auth
    const user = await admin.auth().getUserByEmail(email)
    await admin.auth().updateUser(user.uid, {
      password,
    })

    // Delete the reset document
    await docRef.delete()

    return res.status(200).json({ message: 'Password reset successfully' })
  } catch (error) {
    logger.error('Error in resetPassword:', error)
    res.status(500).json({ message: 'Failed to reset password', error: error.message })
  }
}
