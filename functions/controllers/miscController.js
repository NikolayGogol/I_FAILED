const admin = require('firebase-admin')
const logger = require('firebase-functions/logger')

const db = admin.firestore()

const OTP_COLLECTION = process.env.OTP_COLLECTION || 'passwordResetOTPs'

exports.helloWorld = (req, res) => {
  logger.info('Hello logs!', { structuredData: true })
  res.json({
    message: 'Hello from Firebase!',
    timestamp: new Date().toISOString(),
    query: req.query,
  })
}

exports.anotherFunction = (req, res) => {
  res.send('I am also public thanks to Express!')
}

exports.cleanupExpiredOTPs = async (req, res) => {
  try {
    const now = new Date()
    const expiredOTPs = await db
      .collection(OTP_COLLECTION)
      .where('expiresAt', '<', now)
      .get()

    const batch = db.batch()
    for (const doc of expiredOTPs.docs) {
      batch.delete(doc.ref)
    }

    await batch.commit()

    const count = expiredOTPs.size
    logger.info(`Cleaned up ${count} expired OTP codes`)
    res.json({ success: true, message: `Cleaned up ${count} expired OTP codes` })
  } catch (error) {
    logger.error('Error cleaning up expired OTPs:', error)
    res.status(500).json({ error: 'Failed to cleanup expired OTPs', message: error.message })
  }
}
