const express = require('express')
const router = express.Router()
const { sendVerificationEmail } = require('../controllers/emailVerificationController')

/**
 * @swagger
 * /api/send-verification-email:
 *   post:
 *     summary: Sends an email verification link to the user's new email address.
 *     description: |
 *       This endpoint is called when a user wants to change their email.
 *       It requires the new email address and the user's UID.
 *       The backend then generates a Firebase verification link and sends it to the new email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newEmail:
 *                 type: string
 *                 description: The new email address to verify.
 *                 example: 'new.email@example.com'
 *               uid:
 *                 type: string
 *                 description: The user's unique ID.
 *                 example: 'some-firebase-uid'
 *     responses:
 *       200:
 *         description: Verification email sent successfully.
 *       400:
 *         description: Bad request, missing newEmail or uid.
 *       500:
 *         description: Internal server error.
 */
router.post('/send-verification-email', sendVerificationEmail)

module.exports = router
