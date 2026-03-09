// Import required modules
const admin = require('firebase-admin')
const { sendVerificationEmail } = require('../utils/email')

// Initialize Firestore
const db = admin.firestore()

/**
 * Resends the verification email to a user who has not yet verified their account.
 */
async function resendVerificationEmail (req, res) {
  // Extract the verification token from the request body
  const { token } = req.body

  // Validate that the token is provided
  if (!token) {
    return res.status(400).send({ status: 'error', message: 'Verification token is required.' })
  }

  try {
    // Get the pending user document from Firestore using the token
    const pendingUserRef = db.collection(process.env.PENDING_USERS).doc(token)
    const pendingUserDoc = await pendingUserRef.get()

    // If the document doesn't exist, the token is invalid or has been used
    if (!pendingUserDoc.exists) {
      return res.status(404).send({ status: 'error', message: 'Verification process not found or already completed.' })
    }

    // Extract the email from the pending user's data
    const { email } = pendingUserDoc.data()

    // Reconstruct the verification link
    const verificationLink = `${process.env.VERIFY_LINK}/verify-new-user?token=${token}`

    // Send the verification email again
    await sendVerificationEmail(email, verificationLink)

    // Respond with success
    return res.status(200).send({ status: 'success', message: 'Verification email sent again.' })
  } catch (error) {
    // Log and respond with an error if something goes wrong
    console.error('Error resending verification email:', error)
    return res.status(500).send({ status: 'error', message: 'Internal server error.' })
  }
}

// Export the function
module.exports = { resendVerificationEmail }
