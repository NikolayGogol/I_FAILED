const admin = require('firebase-admin')
const functions = require('firebase-functions')
const Stripe = require('stripe')

// Safely get the secret key from Firebase Functions config
const stripeSecretKey = 'ddsadasds'
let stripe = null

if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2020-08-27',
  })
  functions.logger.info('Stripe SDK initialized successfully.')
} else {
  functions.logger.warn(
    'Stripe secret key is not configured. The payment processing service will be unavailable.',
  )
}

/**
 * Creates a Stripe customer and subscribes them to a premium plan.
 */
exports.createSubscription = async (req, res) => {
  if (!stripe) {
    functions.logger.error(
      'Attempted to process a payment, but Stripe is not configured. Please set stripe.secret_key in Firebase Functions config.',
    )
    return res.status(503).json({
      message: 'The payment service is currently unavailable. Please try again later.',
    })
  }

  try {
    const { uid, paymentMethodId } = req.body

    if (!uid || !paymentMethodId) {
      return res.status(400).json({ message: 'Missing uid or paymentMethodId.' })
    }

    const userRecord = await admin.auth().getUser(uid)
    const email = userRecord.email

    let customer
    const customers = await stripe.customers.list({ email, limit: 1 })
    // eslint-disable-next-line
    customer
      = customers.data.length > 0
        ? customers.data[0]
        : await stripe.customers.create({
            payment_method: paymentMethodId,
            email,
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
          })

    if (customer.invoice_settings.default_payment_method !== paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id })
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })
    }

    const priceId = functions.config().stripe?.premium_price_id
    if (!priceId) {
      functions.logger.error('Stripe premium_price_id is not configured.')
      return res.status(503).json({
        message: 'The payment service is not fully configured (missing price ID).',
      })
    }

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent'],
    })

    const latestInvoice = subscription.latest_invoice
    if (latestInvoice?.payment_intent?.status === 'requires_action') {
      functions.logger.warn(`Subscription for user ${uid} requires further action.`)
      return res.status(402).json({
        message: 'Payment requires additional action.',
        requiresAction: true,
        clientSecret: latestInvoice.payment_intent.client_secret,
      })
    }

    const userDocRef = admin.firestore().collection('users').doc(uid)
    const premiumSince = admin.firestore.FieldValue.serverTimestamp()
    const premiumUntil = new Date()
    premiumUntil.setFullYear(premiumUntil.getFullYear() + 1)

    await userDocRef.update({
      isPremium: true,
      premiumSince,
      premiumUntil,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
    })

    functions.logger.info(`User ${uid} subscribed successfully.`)
    return res.status(200).json({
      status: 'success',
      message: 'Subscription created successfully!',
      isPremium: true,
      premiumSince,
      premiumUntil: premiumUntil.toISOString(),
    })
  } catch (error) {
    functions.logger.error('Error creating subscription:', error)
    return res.status(500).json({ message: 'Failed to create subscription.', error: error.message })
  }
}
