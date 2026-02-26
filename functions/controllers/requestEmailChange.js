const admin = require('firebase-admin')
const { sendEmailChangeVerification } = require('../utils/email')
const crypto = require('crypto')

const db = admin.firestore()

const requestEmailChange = async (req, res) => {
  try {
    const { newEmail } = req.body
    // Assuming you have middleware that decodes the token and adds user to req
    // If not, you need to verify the ID token here.
    // For now, let's assume req.user is populated or we need to get uid from body (less secure without auth middleware)

    // BUT WAIT: The previous code used req.user.uid.
    // If you don't have an auth middleware, this will fail.
    // Let's check if you have auth middleware.
    // If not, we should probably verify the token here.

    // Let's assume for a moment that the client sends an ID token in the Authorization header.
    const idToken = req.headers.authorization?.split('Bearer ')[1]

    let userId
    if (idToken) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken)
        userId = decodedToken.uid
      } catch (e) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
    } else {
       // If no token, we can't proceed securely.
       return res.status(401).json({ error: 'No token provided' })
    }

    if (!newEmail) {
      return res.status(400).json({ error: 'New email is required' })
    }

    // Check if email is already in use
    try {
      await admin.auth().getUserByEmail(newEmail)
      return res.status(400).json({ error: 'Email is already in use' })
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error
      }
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = Date.now() + 3600000 // 1 hour

    // Save request to Firestore
    await db.collection('emailChangeRequests').add({
      uid: userId,
      newEmail,
      token,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    // Construct verification link
    const verificationLink = `${process.env.APP_URL}/verify-email-change?token=${token}`

    // Send email
    await sendEmailChangeVerification(newEmail, verificationLink)

    return res.status(200).json({ message: 'Verification email sent' })
  } catch (error) {
    console.error('Error requesting email change:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

module.exports = { requestEmailChange }
