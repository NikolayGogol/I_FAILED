const admin = require('firebase-admin')
const functions = require('firebase-functions')
const Stripe = require('stripe')

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
let stripe = null

if (stripeSecretKey) {
  stripe = Stripe(stripeSecretKey)
  functions.logger.info('Stripe initialized successfully.')
} else {
  functions.logger.warn(
    'Stripe secret key is not configured. The payment processing service will be unavailable.',
  )
}

/**
 * Creates a Stripe checkout URL for a user to subscribe to a premium plan.
 */
exports.createCheckout = async (req, res) => {
  if (!stripe) {
    functions.logger.error(
      'Attempted to create a checkout, but Stripe is not configured. Please set stripe.secret_key in Firebase Functions config.',
    )
    return res.status(503).json({
      message: 'The payment service is currently unavailable. Please try again later.',
    })
  }

  try {
    const { uid, interval } = req.body

    if (!uid) {
      return res.status(400).json({ message: 'Missing uid.' })
    }

    const userRecord = await admin.auth().getUser(uid)
    const email = userRecord.email

    const isTrial = interval === 'trial'
    let priceId;
    if (interval === 'yearly') {
      priceId = process.env.STRIPE_YEARLY_PRICE_ID
    } else {
      // Use the monthly price for both 'monthly' and 'trial'
      priceId = process.env.STRIPE_MONTHLY_PRICE_ID
    }

    if (!priceId) {
      functions.logger.error(`Stripe price_id for interval '${interval}' is not configured.`)
      return res.status(503).json({
        message: 'The payment service is not fully configured (missing price ID).',
      })
    }

    // Attempt to find if user already has a Stripe customer ID in Firestore
    const userDocRef = admin.firestore().collection('users').doc(uid)
    const userDoc = await userDocRef.get()
    let customerId = userDoc.data()?.stripeCustomerId

    // If no customer ID, create a new Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          firebaseUID: uid,
        },
      })
      customerId = customer.id
      await userDocRef.set({ stripeCustomerId: customerId }, { merge: true })
    }

    // Default success/cancel URLs based on the origin or a default
    const origin = req.headers.origin || 'http://localhost:5173'
    const successUrl = `${origin}/premium?success=true`
    const cancelUrl = `${origin}/premium?canceled=true`

    const sessionConfig = {
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          firebaseUID: uid,
        },
      },
    }

    if (isTrial) {
      // Add 14 days of free trial
      sessionConfig.subscription_data.trial_period_days = 14
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    functions.logger.info(`Checkout session created for user ${uid}.`)
    return res.status(200).json({
      checkoutUrl: session.url,
    })
  } catch (error) {
    functions.logger.error('Error creating checkout:', error)
    return res.status(500).json({ message: 'Failed to create checkout.', error: error.message })
  }
}

const { FieldValue } = require('firebase-admin/firestore')

/**
 * Handles Stripe webhooks to update user subscription status.
 */
exports.webhook = async (req, res) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
  let event

  if (endpointSecret) {
    // Get the signature from the headers
    const signature = req.headers['stripe-signature']
    try {
      // Use req.rawBody provided by Firebase Functions
      event = stripe.webhooks.constructEvent(req.rawBody, signature, endpointSecret)
    } catch (error) {
      functions.logger.error(`Webhook signature verification failed: ${error.message}`)
      return res.status(400).send(`Webhook Error: ${error.message}`)
    }
  } else {
    // Fallback if no endpoint secret is configured (not recommended for production)
    event = req.body
  }

  functions.logger.info(`Stripe webhook received: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription
          const customerId = session.customer

          // Retrieve the subscription to get the metadata
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const userId = subscription.metadata.firebaseUID

          if (userId) {
            const userDocRef = admin.firestore().collection('users').doc(userId)
            const premiumSince = FieldValue.serverTimestamp()
            // current_period_end is a Unix timestamp in seconds
            const premiumUntil = new Date(subscription.current_period_end * 1000)

            await userDocRef.set({
              isPremium: true,
              premiumSince,
              premiumUntil,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
            }, { merge: true })
            functions.logger.info(`User ${userId} subscribed successfully.`)
          } else {
            functions.logger.warn(`No firebaseUID found in metadata for subscription ${subscriptionId}`)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const userId = subscription.metadata.firebaseUID

        if (userId) {
          const userDocRef = admin.firestore().collection('users').doc(userId)

          if (subscription.status === 'active' || subscription.status === 'trialing') {
            const premiumUntil = new Date(subscription.current_period_end * 1000)
            await userDocRef.set({
              isPremium: true,
              premiumUntil,
            }, { merge: true })
            functions.logger.info(`Subscription updated for user ${userId}.`)
          } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
            await userDocRef.set({
              isPremium: false,
              premiumUntil: FieldValue.delete(),
            }, { merge: true })
            functions.logger.info(`Subscription deactivated for user ${userId}.`)
          }
        } else {
          functions.logger.warn(`No firebaseUID found in metadata for updated subscription ${subscription.id}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const userId = subscription.metadata.firebaseUID

        if (userId) {
          const userDocRef = admin.firestore().collection('users').doc(userId)
          await userDocRef.set({
            isPremium: false,
            premiumUntil: FieldValue.delete(),
          }, { merge: true })
          functions.logger.info(`Subscription deleted for user ${userId}.`)
        }
        break
      }

      case 'customer.updated': {
        const customer = event.data.object
        functions.logger.info(`Customer ${customer.id} was updated.`)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object
        if (invoice.subscription) {
          functions.logger.info(`Invoice paid for subscription ${invoice.subscription}.`)
          // Note: Access is generally updated by 'customer.subscription.updated'
          // because Stripe extends the subscription's 'current_period_end'.
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        if (invoice.subscription) {
          functions.logger.warn(`Payment failed for invoice ${invoice.id}, subscription ${invoice.subscription}.`)
          // Note: Stripe will automatically transition the subscription to 'past_due' or 'unpaid'
          // which will trigger 'customer.subscription.updated' to remove premium access.
        }
        break
      }

      default: {
        // Unhandled event type
        break
      }
    }
  } catch (error) {
    functions.logger.error('Error handling webhook event:', error.message, error.stack)
    return res.status(500).send(`Internal Server Error: ${error.message}`)
  }

  res.sendStatus(200)
}
