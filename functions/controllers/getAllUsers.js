const admin = require('firebase-admin');
const logger = require('firebase-functions/logger');

exports.getAllUsers = async (req, res) => {
  try {
    const listUsersResult = await admin.auth().listUsers(1000); // Get up to 1000 users
    const users = listUsersResult.users.map(userRecord => {
      return {
        id: userRecord.uid,
        displayName: userRecord.displayName,
        email: userRecord.email,
        photoURL: userRecord.photoURL,
        // Add any other properties you need from the userRecord
      };
    });

    return res.status(200).json(users);
  } catch (error) {
    logger.error('Error getting all users from Auth:', error);
    res.status(500).json({ error: 'Failed to get users', message: error.message });
  }
};
