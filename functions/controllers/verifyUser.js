// Import required modules
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');
const logger = require('firebase-functions/logger');
const { sendWelcomeEmail } = require('../utils/email');

// Initialize Firestore
const db = admin.firestore();

/**
 * Verifies a user's email using a verification token.
 * If the token is valid, it creates a new user in Firebase Authentication and a corresponding user document in Firestore.
 */
exports.verifyUser = async (req, res) => {
  try {
    // Extract the verification token from the request body
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Get the pending user document from Firestore using the token
    const pendingUserRef = db.collection(process.env.PENDING_USERS).doc(token);
    const pendingUserDoc = await pendingUserRef.get();

    // If the document doesn't exist, the token is invalid or has been used
    if (!pendingUserDoc.exists) {
      logger.warn(`Verification attempt with non-existent token: ${token}`);
      return res.status(404).json({ error: 'Invalid or expired token' });
    }

    // Extract data from the pending user document
    const pendingUserData = pendingUserDoc.data();
    const { email, password, displayName, whyJoining, expiresAt } = pendingUserData;

    // Check if the verification token has expired
    if (expiresAt && expiresAt.toDate() < new Date()) {
      logger.warn(`Verification attempt with expired token for email: ${email}`);
      // Clean up the expired pending user document
      await pendingUserRef.delete();
      return res.status(400).json({ error: 'Verification token has expired.' });
    }

    // Create the user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      emailVerified: true, // Mark the email as verified upon creation
    });

    // Create a new user document in the main 'users' collection
    await db.collection(process.env.USERS_COLLECTION).doc(userRecord.uid).set({
      email,
      displayName,
      whyJoining,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Delete the temporary pending user document
    await pendingUserRef.delete();

    // Send a welcome email to the new user
    try {
      await sendWelcomeEmail(email, displayName);
    } catch (emailError) {
      // Log if the welcome email fails, but don't block the success response
      logger.error('Failed to send welcome email after verification:', emailError);
    }

    // Respond with success and the new user's UID
    return res.status(201).json({ status: 'success', uid: userRecord.uid });
  } catch (error) {
    // Log and respond with an error if something goes wrong
    logger.error('Error verifying user:', error);
    res.status(500).json({ error: 'Failed to verify user', message: error.message });
  }
};
