const admin = require('firebase-admin')

const db = admin.firestore()

const verifyEmailChange = async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ error: 'Token is required' })
    }

    // Find request in Firestore
    const snapshot = await db.collection('emailChangeRequests')
      .where('token', '==', token)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return res.status(400).json({ error: 'Invalid or expired token' })
    }

    const doc = snapshot.docs[0]
    const data = doc.data()

    if (data.expiresAt < Date.now()) {
      await doc.ref.delete()
      return res.status(400).json({ error: 'Token expired' })
    }

    // Update user email in Auth
    await admin.auth().updateUser(data.uid, {
      email: data.newEmail,
      emailVerified: true, // Mark as verified since they clicked the link
    })

    // Update user email in Firestore
    await db.collection('users').doc(data.uid).update({
      email: data.newEmail,
    })

    // Delete request
    await doc.ref.delete()

    return res.status(200).json({ message: 'Email updated successfully' })
  } catch (error) {
    console.error('Error verifying email change:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

module.exports = { verifyEmailChange }
