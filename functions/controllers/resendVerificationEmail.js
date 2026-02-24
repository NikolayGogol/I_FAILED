const admin = require('firebase-admin')
const { sendVerificationEmail } = require('../utils/email')

const db = admin.firestore()

async function resendVerificationEmail (req, res) {
  const { token } = req.body

  if (!token) {
    return res.status(400).send({ status: 'error', message: 'Verification token is required.' })
  }

  try {
    const pendingUserRef = db.collection(process.env.PENDING_USERS).doc(token)
    const pendingUserDoc = await pendingUserRef.get()

    if (!pendingUserDoc.exists) {
      return res.status(404).send({ status: 'error', message: 'Verification process not found or already completed.' })
    }

    const { email } = pendingUserDoc.data()

    // Generate a new verification link (or you can reuse the same token if it's not expired)
    const verificationLink = `${process.env.VERIFY_LINK}/verify-new-user?token=${token}`
    await sendVerificationEmail(email, verificationLink)

    return res.status(200).send({ status: 'success', message: 'Verification email sent again.' })
  } catch (error) {
    console.error('Error resending verification email:', error)
    return res.status(500).send({ status: 'error', message: 'Internal server error.' })
  }
}

module.exports = { resendVerificationEmail }
