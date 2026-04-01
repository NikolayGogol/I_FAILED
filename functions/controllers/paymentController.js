const admin = require('firebase-admin')
const functions = require('firebase-functions')
const Stripe = require('stripe')

// Initialize Stripe with your secret key from Firebase Functions config
const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2020-08-27', // Use a consistent API version
})

/**
 * Creates a Stripe customer and subscribes them to a premium plan.
 * Assumes a single premium product/price ID is configured in Stripe.
 */
exports.createSubscription = async (req, res) => {
  try {
    const { uid, paymentMethodId } = req.body

    if (!uid || !paymentMethodId) {
      return res.status(400).json({ message: 'Missing uid or paymentMethodId.' })
    }

    // Get user's email from Firebase Auth
    const userRecord = await admin.auth().getUser(uid)
    const email = userRecord.email

    // 1. Create or retrieve a Stripe Customer
    let customer
    const customers = await stripe.customers.list({ email, limit: 1 })

    customer = customers.data.length > 0
      ? customers.data[0]
      : (await stripe.customers.create({
          payment_method: paymentMethodId,
          email,
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        }))

    // 2. Attach the PaymentMethod to the Customer (if not already default)
    if (customer.invoice_settings.default_payment_method !== paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id })
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })
    }

    // 3. Create the Subscription
    // You need to replace 'price_YOUR_PREMIUM_PRICE_ID' with your actual Stripe Price ID
    const priceId = functions.config().stripe.premium_price_id
    if (!priceId) {
      throw new Error('Stripe premium_price_id is not configured in Firebase Functions.')
    }

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent'],
    })

    // Handle potential payment confirmation (e.g., 3D Secure)
    const latestInvoice = subscription.latest_invoice
    if (latestInvoice && latestInvoice.payment_intent && latestInvoice.payment_intent.status === 'requires_action') {
      // This scenario would require client-side confirmation, which is more complex
      // For simplicity, we'll assume direct payment for now or handle it as a failure.
      // In a real app, you'd send back client_secret for client-side confirmation.
      functions.logger.warn(`Subscription requires action for user ${uid}. Payment Intent ID: ${latestInvoice.payment_intent.id}`)
      return res.status(402).json({
        message: 'Payment requires additional action. Please complete it on the client.',
        requiresAction: true,
        clientSecret: latestInvoice.payment_intent.client_secret,
      })
    }

    // 4. Update user's Firestore document
    const userDocRef = admin.firestore().collection('users').doc(uid)
    const premiumSince = admin.firestore.FieldValue.serverTimestamp()
    const premiumUntil = new Date()
    premiumUntil.setFullYear(premiumUntil.getFullYear() + 1) // Example: 1 year subscription

    await userDocRef.update({
      isPremium: true,
      premiumSince,
      premiumUntil, // Store as a Date object or Firestore Timestamp
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
      // Add other relevant subscription details
    })

    functions.logger.info(`User ${uid} subscribed successfully. Subscription ID: ${subscription.id}`)
    return res.status(200).json({
      status: 'success',
      message: 'Subscription created successfully!',
      isPremium: true,
      premiumSince,
      premiumUntil: premiumUntil.toISOString(), // Send ISO string for client
    })
  } catch (error) {
    functions.logger.error('Error creating subscription:', error)
    return res.status(500).json({ message: 'Failed to create subscription.', error: error.message })
  }
}
