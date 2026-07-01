const express = require('express')
const router = express.Router()
const { createCheckout, webhook, cancelSubscription, renewSubscription, getPaymentHistory, createCustomerPortal } = require('../controllers/paymentController')

/**
 * @swagger
 * /api/create-checkout:
 *   post:
 *     summary: Creates a new Stripe checkout for a user.
 *     description: |
 *       This endpoint handles the creation of a premium checkout.
 *       It requires the user's UID and the plan interval.
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
 *               interval:
 *                 type: string
 *                 description: The plan interval (monthly or yearly).
 *                 example: 'yearly'
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
 * /api/cancel-subscription:
 *   post:
 *     summary: Cancels a user's Stripe subscription.
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
 *     responses:
 *       200:
 *         description: Subscription canceled successfully.
 */
router.post('/cancel-subscription', cancelSubscription)

/**
 * @swagger
 * /api/renew-subscription:
 *   post:
 *     summary: Renews a canceled Stripe subscription.
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
 *     responses:
 *       200:
 *         description: Subscription renewed successfully.
 */
router.post('/renew-subscription', renewSubscription)

/**
 * @swagger
 * /api/customer-portal:
 *   post:
 *     summary: Creates a Stripe Customer Portal session.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uid:
 *                 type: string
 *     responses:
 *       200:
 *         description: Portal URL created successfully.
 */
router.post('/customer-portal', createCustomerPortal)

/**
 * @swagger
 * /api/webhook:
 *   post:
 *     summary: Handles Stripe webhooks.
 *     description: |
 *       This endpoint receives webhooks from Stripe to update subscription statuses.
 */
router.post('/webhook', webhook)

/**
 * @swagger
 * /api/payment-history/{uid}:
 *   get:
 *     summary: Retrieves payment history for a specific user.
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's unique ID.
 *     responses:
 *       200:
 *         description: A list of payment history records.
 *       400:
 *         description: Missing uid parameter.
 *       500:
 *         description: Internal server error.
 */
router.get('/payment-history/:uid', getPaymentHistory)

module.exports = router
