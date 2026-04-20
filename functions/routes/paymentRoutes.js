const express = require('express')
const router = express.Router()
const { createCheckout, webhook } = require('../controllers/paymentController')

/**
 * @swagger
 * /api/create-checkout:
 *   post:
 *     summary: Creates a new Lemon Squeezy checkout for a user.
 *     description: |
 *       This endpoint handles the creation of a premium checkout.
 *       It requires the user's UID.
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
 *     responses:
 *       200:
 *         description: Checkout URL created successfully.
 *       400:
 *         description: Bad request, missing uid.
 *       500:
 *         description: Internal server error.
 */
router.post('/create-checkout', createCheckout)

/**
 * @swagger
 * /api/webhook:
 *   post:
 *     summary: Handles Lemon Squeezy webhooks.
 *     description: |
 *       This endpoint receives webhooks from Lemon Squeezy to update subscription statuses.
 */
router.post('/webhook', webhook)

module.exports = router
