const sgMail = require('@sendgrid/mail')
const admin = require('firebase-admin')
const { FieldValue } = require('firebase-admin/firestore')
const logger = require('firebase-functions/logger')

const db = admin.firestore()

// --- Налаштування SendGrid ---
// Ключ завантажується зі змінних оточення (.env файл)
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const OTP_COLLECTION = process.env.OTP_COLLECTION
const FROM_EMAIL = process.env.EMAIL_USER

// --- Helper Functions ---

async function sendEmail ({ to, subject, html }) {
  const msg = { to, from: FROM_EMAIL, subject, html }
  try {
    await sgMail.send(msg)
    logger.info(`Email sent to ${to}. Subject: ${subject}`)
    return { success: true }
  } catch (error) {
    logger.error('SendGrid Error:', error.response ? error.response.body : error)
    throw new Error('Failed to send email via SendGrid')
  }
}

async function sendWelcomeEmail (email, displayName) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome, ${displayName}!</h2>
      <p>Thank you for joining our application. We are excited to have you on board.</p>
    </div>
  `
  return sendEmail({ to: email, subject: 'Welcome to Our App!', html })
}

async function sendOTPEmail (email, code) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Verification</h2>
      <p>Use the verification code below:</p>
      <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
        <h1 style="color: #1e293b; font-size: 32px; letter-spacing: 8px; margin: 0;">${code}</h1>
      </div>
      <p style="color: #666;">This code will expire in 10 minutes.</p>
    </div>
  `
  return sendEmail({ to: email, subject: 'Password Reset Verification Code', html })
}

function generateOTP () {
  return Math.floor(100_000 + Math.random() * 900_000).toString()
}

// --- Controller Exports ---

exports.createUser = async (req, res) => {
  try {
    const { email, password, displayName, whyJoining } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const userRecord = await admin.auth().createUser({ email, password, displayName })

    await db.collection('users').doc(userRecord.uid).set({
      email,
      displayName,
      whyJoining,
      createdAt: FieldValue.serverTimestamp(),
    })

    await sendWelcomeEmail(email, displayName)

    return res.status(201).json({ status: 'success', uid: userRecord.uid })
  } catch (error) {
    logger.error('Error creating user:', error)
    res.status(500).json({ error: 'Failed to create user', message: error.message })
  }
}

exports.sendPasswordResetOTP = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const otpCode = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await db.collection(OTP_COLLECTION).doc(email.toLowerCase()).set({
      email: email.toLowerCase(),
      code: otpCode,
      expiresAt,
      createdAt: FieldValue.serverTimestamp(),
      attempts: 0,
      verified: false,
    })

    await sendOTPEmail(email, otpCode)
    res.json({ success: true, message: 'Verification code sent' })
  } catch (error) {
    logger.error('Error sending OTP:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

exports.verifyPasswordResetOTP = async (req, res) => {
  try {
    const { email, code } = req.body
    const otpDocRef = db.collection(OTP_COLLECTION).doc(email.toLowerCase())
    const otpDoc = await otpDocRef.get()

    if (!otpDoc.exists) {
      return res.status(404).json({ error: 'Code not found' })
    }

    const otpData = otpDoc.data()
    if (otpData.code !== code) {
      return res.status(400).json({ error: 'Invalid code' })
    }
    if (new Date() > otpData.expiresAt.toDate()) {
      return res.status(400).json({ error: 'Code expired' })
    }

    await otpDocRef.update({ verified: true, verifiedAt: FieldValue.serverTimestamp() })

    res.json({ success: true, message: 'Code verified successfully' })
  } catch (error) {
    logger.error('Verification failed:', error)
    res.status(500).json({ error: 'Verification failed' })
  }
}

exports.resetPasswordWithOTP = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body
    const otpDocRef = db.collection(OTP_COLLECTION).doc(email.toLowerCase())
    const otpDoc = await otpDocRef.get()

    if (!otpDoc.exists || !otpDoc.data().verified) {
      return res.status(400).json({ error: 'Code not verified' })
    }

    const userRecord = await admin.auth().getUserByEmail(email.toLowerCase())
    await admin.auth().updateUser(userRecord.uid, { password: newPassword })
    await otpDocRef.delete()

    res.json({ success: true, message: 'Password reset successful' })
  } catch (error) {
    logger.error('Reset failed:', error)
    res.status(500).json({ error: 'Reset failed' })
  }
}
