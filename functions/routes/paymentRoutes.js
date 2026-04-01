const express = require('express')
const router = express.Router()
const { createSubscription } = require('../controllers/paymentController')

/**
 * @swagger
 * /api/create-subscription:
 *   post:
 *     summary: Creates a new Stripe subscription for a user.
 *     description: |
 *       This endpoint handles the creation of a premium subscription.
 *       It requires the user's UID and a Stripe PaymentMethod ID.
 *       It creates a Stripe customer (if one doesn't exist), attaches the payment method,
 *       and creates a subscription. Finally, it updates the user's document in Firestore.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uid:
 *                 type: string
 *                 description: The user's unique ID.
 *                 example: 'some-firebase-uid'
 *               paymentMethodId:
 *                 type: string
 *                 description: The Stripe PaymentMethod ID generated on the client.
 *                 example: 'pm_1Hh2bJ2eZvKYlo2C...'
 *     responses:
 *       200:
 *         description: Subscription created successfully.
 *       400:
 *         description: Bad request, missing uid or paymentMethodId.
 *       500:
 *         description: Internal server error.
 */
router.post('/create-subscription', createSubscription)

module.exports = router
