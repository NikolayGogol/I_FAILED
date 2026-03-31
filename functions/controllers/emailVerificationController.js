const admin = require('firebase-admin')
const functions = require('firebase-functions')
const { sendUpdateEmailVerification } = require('../utils/email') // Use the existing email utility

/**
 * Sends an email verification link to the user for an email change request.
 * This function is called by the client when a user wants to change their email.
 * It generates a Firebase email verification link and uses the existing email utility to send it.
 */
exports.sendVerificationEmail = async (req, res) => {
  try {
    const { newEmail, uid } = req.body // Also get UID to get user record

    if (!newEmail || !uid) {
      return res.status(400).json({ message: 'Missing newEmail or uid in request body.' })
    }

    // Get the user record to access the current email
    const user = await admin.auth().getUser(uid)
    const currentEmail = user.email

    // Generate the email verification link using Firebase Admin SDK
    // IMPORTANT: Use generateVerifyAndChangeEmailLink for email change verification
    const actionCodeSettings = {
      // This URL should point to a page on your frontend that can handle the email verification.
      // Firebase will append `?mode=verifyEmail&oobCode=...` to this URL.
      // It's crucial that your frontend route (e.g., /verify-email) is configured to handle this.
      url: `${process.env.VERIFY_LINK}/verify-email`, // Assuming you have a /verify-email route on your frontend
      handleCodeInApp: true,
    }

    // Generate the link that will be sent in the email
    // This function requires the current email and the new email
    const link = await admin.auth().generateVerifyAndChangeEmailLink(currentEmail, newEmail, actionCodeSettings)

    // Use the existing utility function to send the email
    await sendUpdateEmailVerification(newEmail, link)

    functions.logger.info(`Update verification email sent to ${newEmail} for user ${uid}`)
    return res.status(200).json({ message: 'Verification email sent successfully.' })
  } catch (error) {
    functions.logger.error('Error sending update verification email:', error)
    return res.status(500).json({ message: 'Failed to send verification email.', error: error.message })
  }
}
