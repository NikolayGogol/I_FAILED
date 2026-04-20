const admin = require('firebase-admin')
const functions = require('firebase-functions')
const LemonSqueezy = require('@lemonsqueezy/lemonsqueezy.js')

const lemonSqueezySecretKey = functions.config().lemonsqueezy?.secret_key
let lemonSqueezy = null

if (lemonSqueezySecretKey) {
  lemonSqueezy = new LemonSqueezy(lemonSqueezySecretKey)
  functions.logger.info('Lemon Squeezy SDK initialized successfully.')
} else {
  functions.logger.warn(
    'Lemon Squeezy secret key is not configured. The payment processing service will be unavailable.',
  )
}

/**
 * Creates a Lemon Squeezy checkout URL for a user to subscribe to a premium plan.
 */
exports.createCheckout = async (req, res) => {
  if (!lemonSqueezy) {
    functions.logger.error(
      'Attempted to create a checkout, but Lemon Squeezy is not configured. Please set lemonsqueezy.secret_key in Firebase Functions config.',
    )
    return res.status(503).json({
      message: 'The payment service is currently unavailable. Please try again later.',
    })
  }

  try {
    const { uid } = req.body

    if (!uid) {
      return res.status(400).json({ message: 'Missing uid.' })
    }

    const userRecord = await admin.auth().getUser(uid)
    const email = userRecord.email

    const variantId = functions.config().lemonsqueezy?.premium_variant_id
    if (!variantId) {
      functions.logger.error('Lemon Squeezy premium_variant_id is not configured.')
      return res.status(503).json({
        message: 'The payment service is not fully configured (missing variant ID).',
      })
    }

    const checkout = await lemonSqueezy.createCheckout({
        store: functions.config().lemonsqueezy?.store_id,
        variant: variantId,
        custom: {
            user_id: uid,
        },
        checkout_data: {
            email: email,
        }
    })

    functions.logger.info(`Checkout created for user ${uid}.`)
    return res.status(200).json({
      checkoutUrl: checkout.url
    })
  } catch (error) {
    functions.logger.error('Error creating checkout:', error)
    return res.status(500).json({ message: 'Failed to create checkout.', error: error.message })
  }
}

/**
 * Handles Lemon Squeezy webhooks to update user subscription status.
 */
exports.webhook = async (req, res) => {
    // This part will be more complex. I need to handle different webhook events.
    // For now, I will just log the request and return 200.
    functions.logger.info('Lemon Squeezy webhook received.')
    // I need to verify the webhook signature here.
    // I will add that later.

    const { event_name, data } = req.body;

    if (event_name === 'subscription_created' || event_name === 'subscription_payment_success') {
        const userId = data.attributes.custom_data?.user_id;
        const customerId = data.attributes.customer_id;
        const subscriptionId = data.id;

        if (userId) {
            const userDocRef = admin.firestore().collection('users').doc(userId);
            const premiumSince = admin.firestore.FieldValue.serverTimestamp();
            const premiumUntil = new Date(data.attributes.renews_at);

            await userDocRef.update({
                isPremium: true,
                premiumSince,
                premiumUntil,
                lemonSqueezyCustomerId: customerId,
                lemonSqueezySubscriptionId: subscriptionId,
            });
            functions.logger.info(`User ${userId} subscribed successfully.`);
        }
    } else if (event_name === 'subscription_cancelled' || event_name === 'subscription_expired') {
        const userId = data.attributes.custom_data?.user_id;
        if (userId) {
            const userDocRef = admin.firestore().collection('users').doc(userId);
            await userDocRef.update({
                isPremium: false,
                premiumUntil: admin.firestore.FieldValue.delete(),
            });
            functions.logger.info(`Subscription for user ${userId} cancelled or expired.`);
        }
    }

    res.sendStatus(200);
}
