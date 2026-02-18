const logger = require('firebase-functions/logger')
const { sendWelcomeEmail } = require('../utils/email')

exports.createUser = async (req, res) => {
  try {
    const { email, password, displayName } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    await sendWelcomeEmail(email, displayName)

    return res.status(201).json({ status: 'success' })
  } catch (error) {
    logger.error('Error creating user:', error)
    res.status(500).json({ error: 'Failed to create user', message: error.message })
  }
}
