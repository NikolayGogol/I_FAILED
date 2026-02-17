const cors = require('cors')
const express = require('express')
const admin = require('firebase-admin')
const logger = require('firebase-functions/logger')
const { onRequest } = require('firebase-functions/v2/https')
const nodemailer = require('nodemailer')

// Initialize Firebase Admin
admin.initializeApp()
const db = admin.firestore()

const app = express()

// Automatically allow cross-origin requests
app.use(cors({ origin: true }))
app.use(express.json())

// Email transporter configuration
// Supports Firebase Functions config and environment variables
const functions = require('firebase-functions')
function getConfig () {
  try {
    return functions.config()
  } catch {
    return {}
  }
}

const config = getConfig()

function createEmailTransporter () {
  const emailUser = config.email?.user || process.env.EMAIL_USER
  const emailPassword = config.email?.password || process.env.EMAIL_PASSWORD
  const emailFrom = config.email?.from || process.env.EMAIL_FROM || emailUser
  const smtpHost = config.smtp?.host || process.env.SMTP_HOST || 'smtp.gmail.com'
  const smtpPort = config.smtp?.port || process.env.SMTP_PORT || 587

  if (!emailUser || !emailPassword) {
    logger.warn('Email credentials not configured. Email sending will fail.')
    // Return a mock transporter for development/testing
    return {
      sendMail: async () => {
        logger.warn('Email not configured - simulating email send')
        return { messageId: 'mock-message-id' }
      },
    }
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: Number.parseInt(smtpPort),
    secure: Number.parseInt(smtpPort) === 465, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  })
}

// Generate random 6-digit OTP code
function generateOTP () {
  return Math.floor(100_000 + Math.random() * 900_000).toString()
}

// Send OTP code via email
async function sendOTPEmail (email, code) {
  const transporter = createEmailTransporter()

  const config = getConfig()
  const emailFrom = config.email?.from || process.env.EMAIL_FROM || config.email?.user || process.env.EMAIL_USER || 'noreply@yourapp.com'

  const mailOptions = {
    from: emailFrom,
    to: email,
    subject: 'Password Reset Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Verification</h2>
        <p>You requested to reset your password. Use the verification code below:</p>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h1 style="color: #1e293b; font-size: 32px; letter-spacing: 8px; margin: 0;">${code}</h1>
        </div>
        <p style="color: #666;">This code will expire in 10 minutes.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `,
    text: `Your password reset verification code is: ${code}. This code will expire in 10 minutes.`,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    logger.info('Email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    logger.error('Error sending email:', error)
    throw error
  }
}

// Send password reset OTP code
app.post('/sendPasswordResetOTP', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Generate OTP code
    const otpCode = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

    // Store OTP in Firestore
    const otpDoc = {
      email: email.toLowerCase(),
      code: otpCode,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      attempts: 0,
      verified: false,
    }

    await db.collection('passwordResetOTPs').doc(email.toLowerCase()).set(otpDoc)

    // Send OTP via email
    await sendOTPEmail(email, otpCode)

    logger.info(`OTP sent to ${email}`)

    res.json({
      success: true,
      message: 'Verification code sent to your email',
      // Don't send code in response for security
    })
  } catch (error) {
    logger.error('Error sending OTP:', error)
    res.status(500).json({
      error: 'Failed to send verification code',
      message: error.message,
    })
  }
})

// Verify password reset OTP code
app.post('/verifyPasswordResetOTP', async (req, res) => {
  try {
    const { email, code } = req.body

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' })
    }

    // Get OTP document from Firestore
    const otpDocRef = db.collection('passwordResetOTPs').doc(email.toLowerCase())
    const otpDoc = await otpDocRef.get()

    if (!otpDoc.exists) {
      return res.status(404).json({ error: 'No verification code found for this email' })
    }

    const otpData = otpDoc.data()

    // Check if code is already verified
    if (otpData.verified) {
      return res.status(400).json({ error: 'This code has already been used' })
    }

    // Check if code has expired
    const expiresAt = otpData.expiresAt.toDate()
    if (new Date() > expiresAt) {
      return res.status(400).json({ error: 'Verification code has expired' })
    }

    // Check attempts limit (max 5 attempts)
    if (otpData.attempts >= 5) {
      return res.status(429).json({ error: 'Too many verification attempts. Please request a new code.' })
    }

    // Increment attempts
    await otpDocRef.update({
      attempts: admin.firestore.FieldValue.increment(1),
    })

    // Verify code
    if (otpData.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' })
    }

    // Mark code as verified
    await otpDocRef.update({
      verified: true,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    // Generate action code for password reset
    // In Firebase, we can use the email to generate a password reset link
    // For now, we'll return a token that can be used to reset password
    const resetToken = Buffer.from(`${email}:${Date.now()}`).toString('base64')

    logger.info(`OTP verified for ${email}`)

    res.json({
      success: true,
      message: 'Code verified successfully',
      resetToken,
      email,
    })
  } catch (error) {
    logger.error('Error verifying OTP:', error)
    res.status(500).json({
      error: 'Failed to verify code',
      message: error.message,
    })
  }
})

// Reset password with verified OTP
app.post('/resetPasswordWithOTP', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password are required' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' })
    }

    // Verify OTP first
    const otpDocRef = db.collection('passwordResetOTPs').doc(email.toLowerCase())
    const otpDoc = await otpDocRef.get()

    if (!otpDoc.exists) {
      return res.status(404).json({ error: 'No verification code found' })
    }

    const otpData = otpDoc.data()

    if (!otpData.verified) {
      return res.status(400).json({ error: 'Code not verified. Please verify the code first.' })
    }

    // Check if reset token is still valid (within 1 hour)
    const verifiedAt = otpData.verifiedAt?.toDate()
    if (!verifiedAt || (Date.now() - verifiedAt) > 60 * 60 * 1000) {
      return res.status(400).json({ error: 'Reset session expired. Please request a new code.' })
    }

    // Reset password using Firebase Admin
    try {
      const userRecord = await admin.auth().getUserByEmail(email.toLowerCase())
      await admin.auth().updateUser(userRecord.uid, {
        password: newPassword,
      })

      // Delete OTP document after successful reset
      await otpDocRef.delete()

      logger.info(`Password reset successful for ${email}`)

      res.json({
        success: true,
        message: 'Password reset successfully',
      })
    } catch (authError) {
      if (authError.code === 'auth/user-not-found') {
        return res.status(404).json({ error: 'User not found' })
      }
      throw authError
    }
  } catch (error) {
    logger.error('Error resetting password:', error)
    res.status(500).json({
      error: 'Failed to reset password',
      message: error.message,
    })
  }
})

// Clean up expired OTP codes (can be called periodically via Cloud Scheduler)
app.post('/cleanupExpiredOTPs', async (req, res) => {
  try {
    const now = new Date()
    const expiredOTPs = await db
      .collection('passwordResetOTPs')
      .where('expiresAt', '<', now)
      .get()

    const batch = db.batch()
    for (const doc of expiredOTPs) {
      batch.delete(doc.ref)
    }

    await batch.commit()

    logger.info(`Cleaned up ${expiredOTPs.size} expired OTP codes`)

    res.json({
      success: true,
      message: `Cleaned up ${expiredOTPs.size} expired OTP codes`,
    })
  } catch (error) {
    logger.error('Error cleaning up expired OTPs:', error)
    res.status(500).json({
      error: 'Failed to cleanup expired OTPs',
      message: error.message,
    })
  }
})

// Existing routes
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
