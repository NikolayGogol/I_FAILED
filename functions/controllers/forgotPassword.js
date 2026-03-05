// Import required modules
const admin = require('firebase-admin');
const { Timestamp } = require('firebase-admin/firestore');
const logger = require('firebase-functions/logger');
const { sendOTPEmail } = require('../utils/email');

// Initialize Firestore
const db = admin.firestore();
const POST_PASSWORD_RESET = process.env.POST_PASSWORD_RESET;

/**
 * Handles the "forgot password" request.
 * Generates a One-Time Password (OTP), stores it in Firestore, and sends it to the user's email.
 */
exports.forgotPassword = async (req, res) => {
  logger.info('Forgot Password function triggered.');

  try {
    // Extract email from the request body
    const { email } = req.body;
    if (!email) {
      logger.warn('Forgot Password attempt without email.');
      return res.status(400).json({ message: 'Email is required' });
    }

    logger.info(`Processing forgot password for email: ${email}`);

    // Verify that the user exists in Firebase Authentication
    try {
      logger.info('Checking if user exists in Firebase Auth...');
      await admin.auth().getUserByEmail(email);
      logger.info('User found in Firebase Auth.');
    } catch (error) {
      // If user is not found, return a 404 error
      if (error.code === 'auth/user-not-found') {
        logger.warn(`Forgot password attempt for non-existent user: ${email}`);
        return res.status(404).json({ message: 'No account found with this email' });
      }
      // For other errors, log and re-throw
      logger.error('Error checking user in Firebase Auth:', error);
      throw error;
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100_000 + Math.random() * 900_000).toString();
    logger.info(`Generated OTP: ${otp} for email: ${email}`);

    // Set the OTP to expire in 15 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Store the OTP and its expiration date in Firestore
    logger.info('Storing OTP in Firestore...');
    await db.collection(POST_PASSWORD_RESET).doc(email).set({
      otp,
      expiresAt: Timestamp.fromDate(expiresAt),
      verified: false, // Flag to check if OTP has been successfully verified
    });
    logger.info('OTP stored successfully.');

    // Send the OTP to the user's email
    logger.info('Sending OTP email...');
    await sendOTPEmail(email, otp);
    logger.info('OTP email sent successfully.');

    return res.status(200).json({ message: 'Verification code sent to your email' });
  } catch (error) {
    logger.error('Critical error in forgotPassword function:', error);
    res.status(500).json({ message: 'Failed to process request', error: error.message });
  }
};

/**
 * Verifies the OTP provided by the user.
 */
exports.verifyOTP = async (req, res) => {
  try {
    // Extract email and OTP code from the request body
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    // Get the OTP document from Firestore
    const docRef = db.collection(POST_PASSWORD_RESET).doc(email);
    const doc = await docRef.get();

    // Check if the document exists
    if (!doc.exists) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    const data = doc.data();
    const now = Timestamp.now();

    // Validate the OTP code
    if (data.otp !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Check if the OTP has expired
    if (now.toMillis() > data.expiresAt.toMillis()) {
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    // Mark the OTP as verified in Firestore
    await docRef.update({ verified: true });

    return res.status(200).json({ message: 'Code verified successfully' });
  } catch (error) {
    logger.error('Error in verifyOTP:', error);
    res.status(500).json({ message: 'Failed to verify code', error: error.message });
  }
};

/**
 * Resets the user's password after successful OTP verification.
 */
exports.resetPassword = async (req, res) => {
  try {
    // Extract email, OTP code, and new password from the request body
    const { email, code, password } = req.body;
    if (!email || !code || !password) {
      return res.status(400).json({ message: 'Email, code and password are required' });
    }

    // Get the OTP document from Firestore
    const docRef = db.collection(POST_PASSWORD_RESET).doc(email);
    const doc = await docRef.get();

    // Check if the request is valid
    if (!doc.exists) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    const data = doc.data();

    // Ensure the OTP was correct and has been verified
    if (data.otp !== code || !data.verified) {
      return res.status(400).json({ message: 'Code not verified' });
    }

    // Update the user's password in Firebase Authentication
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, {
      password,
    });

    // Delete the password reset document from Firestore
    await docRef.delete();

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    logger.error('Error in resetPassword:', error);
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
};
