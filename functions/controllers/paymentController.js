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
    const { uid, interval, isTrial } = req.body

    if (!uid) {
      return res.status(400).json({ message: 'Missing uid.' })
    }

    const userRecord = await admin.auth().getUser(uid)
    const email = userRecord.email

    let priceId
    // eslint-disable-next-line
    priceId = interval === 'yearly' ? process.env.STRIPE_YEARLY_PRICE_ID : process.env.STRIPE_MONTHLY_PRICE_ID

    if (!priceId) {
      functions.logger.error(`Stripe price_id for interval '${interval}' is not configured.`)
      return res.status(503).json({
        message: 'The payment service is not fully configured (missing price ID).',
      })
    }

    // Attempt to find if user already has a Stripe customer ID in Firestore
    const userDocRef = admin.firestore().collection('users').doc(uid)
    const userDoc = await userDocRef.get()

    if (isTrial && userDoc.data()?.hasUsedTrial) {
      return res.status(403).json({ message: 'You have already used your free trial.' })
    }

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

/**
 * Cancels a user's subscription.
 */
exports.cancelSubscription = async (req, res) => {
  const { uid } = req.body

  if (!uid) {
    return res.status(400).json({ message: 'Missing uid in request body.' })
  }

  try {
    const userDoc = await admin.firestore().collection('users').doc(uid).get()

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found.' })
    }

    const userData = userDoc.data()
    const subscriptionId = userData.stripeSubscriptionId

    if (!subscriptionId) {
      return res.status(400).json({ message: 'User does not have an active Stripe subscription.' })
    }

    // Cancel the subscription at the end of the billing period
    await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })

    // Update Firestore to reflect the canceled state (user keeps premium until the end of the period)
    await admin.firestore().collection('users').doc(uid).set({
      isCanceled: true,
    }, { merge: true })

    functions.logger.info(`Subscription ${subscriptionId} canceled for user ${uid}.`)
    return res.status(200).json({ message: 'Subscription canceled successfully.' })
  } catch (error) {
    functions.logger.error('Error canceling subscription:', error.message)
    return res.status(500).json({ message: 'Failed to cancel subscription.', error: error.message })
  }
}

/**
 * Renews a canceled (but still active) subscription.
 */
exports.renewSubscription = async (req, res) => {
  const { uid, interval } = req.body

  if (!uid) {
    return res.status(400).json({ message: 'Missing uid.' })
  }

  try {
    const userDocRef = admin.firestore().collection('users').doc(uid)
    const userDoc = await userDocRef.get()

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found.' })
    }

    const userData = userDoc.data()
    const subscriptionId = userData.stripeSubscriptionId

    if (!subscriptionId) {
      return res.status(400).json({ message: 'User does not have an active Stripe subscription.' })
    }

    const updateParams = { cancel_at_period_end: false }

    if (interval) {
      // @ts-nocheck
      let priceId
      // eslint-disable-next-line
      priceId = interval === 'yearly' ? process.env.STRIPE_YEARLY_PRICE_ID : process.env.STRIPE_MONTHLY_PRICE_ID

      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      if (subscription.items && subscription.items.data.length > 0) {
        updateParams.items = [{
          id: subscription.items.data[0].id,
          price: priceId,
        }]
        updateParams.proration_behavior = 'create_prorations'

        if (subscription.status === 'trialing') {
          updateParams.trial_end = 'now'
        }
      }
    }

    // Reactivate the subscription
    await stripe.subscriptions.update(subscriptionId, updateParams)

    await admin.firestore().collection('users').doc(uid).set({
      isCanceled: false,
    }, { merge: true })

    functions.logger.info(`Subscription ${subscriptionId} renewed for user ${uid}.`)
    return res.status(200).json({ message: 'Subscription renewed successfully.' })
  } catch (error) {
    functions.logger.error('Error renewing subscription:', error.message)
    return res.status(500).json({ message: 'Failed to renew subscription.', error: error.message })
  }
}

const { FieldValue } = require('firebase-admin/firestore')

/**
 * Handles Stripe webhooks to update user subscription status.
 */
// eslint-disable-next-line
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

          // Retrieve the subscription to get the metadata, expanding default_payment_method to get card details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ['default_payment_method'],
          })
          const userId = subscription.metadata.firebaseUID

          if (userId) {
            const userDocRef = admin.firestore().collection('users').doc(userId)
            const premiumSince = FieldValue.serverTimestamp()
            // current_period_end is a Unix timestamp in seconds
            const premiumUntil = new Date(subscription.current_period_end * 1000)

            let planPrice = null
            let planInterval = null
            if (subscription.items?.data?.[0]?.price?.unit_amount) {
              planPrice = `$${(subscription.items.data[0].price.unit_amount / 100).toFixed(2)}`
              planInterval = subscription.items.data[0].plan?.interval || 'month'
            }

            let cardBrand = null
            let cardLast4 = null
            if (subscription.default_payment_method?.card) {
              cardBrand = subscription.default_payment_method.card.brand
              cardLast4 = subscription.default_payment_method.card.last4
            } else {
              const customer = await stripe.customers.retrieve(customerId, { expand: ['invoice_settings.default_payment_method'] })
              if (customer.invoice_settings?.default_payment_method?.card) {
                cardBrand = customer.invoice_settings.default_payment_method.card.brand
                cardLast4 = customer.invoice_settings.default_payment_method.card.last4
              }
            }

            const updateData = {
              isPremium: true,
              premiumSince,
              premiumUntil,
              subscriptionStatus: subscription.status,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              isCanceled: false,
            }
            if (subscription.status === 'trialing') {
              updateData.hasUsedTrial = true
            }
            if (planPrice) {
              updateData.planPrice = planPrice
            }
            if (planInterval) {
              updateData.planInterval = planInterval
            }
            if (cardBrand) {
              updateData.cardBrand = cardBrand
            }
            if (cardLast4) {
              updateData.cardLast4 = cardLast4
            }

            await userDocRef.set(updateData, { merge: true })
            functions.logger.info(`User ${userId} subscribed successfully.`)
          } else {
            functions.logger.warn(`No firebaseUID found in metadata for subscription ${subscriptionId}`)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscriptionEvent = event.data.object
        const userId = subscriptionEvent.metadata.firebaseUID

        if (userId) {
          const userDocRef = admin.firestore().collection('users').doc(userId)

          if (subscriptionEvent.status === 'active' || subscriptionEvent.status === 'trialing') {
            const subscription = await stripe.subscriptions.retrieve(subscriptionEvent.id, {
              expand: ['default_payment_method'],
            })

            const premiumUntil = new Date(subscription.current_period_end * 1000)

            let planPrice = null
            let planInterval = null
            if (subscription.items?.data?.[0]?.price?.unit_amount) {
              planPrice = `$${(subscription.items.data[0].price.unit_amount / 100).toFixed(2)}`
              planInterval = subscription.items.data[0].plan?.interval || 'month'
            }

            let cardBrand = null
            let cardLast4 = null
            if (subscription.default_payment_method?.card) {
              cardBrand = subscription.default_payment_method.card.brand
              cardLast4 = subscription.default_payment_method.card.last4
            } else {
              const customer = await stripe.customers.retrieve(subscription.customer, { expand: ['invoice_settings.default_payment_method'] })
              if (customer.invoice_settings?.default_payment_method?.card) {
                cardBrand = customer.invoice_settings.default_payment_method.card.brand
                cardLast4 = customer.invoice_settings.default_payment_method.card.last4
              }
            }

            const updateData = {
              isPremium: true,
              premiumUntil,
              subscriptionStatus: subscription.status,
              isCanceled: subscription.cancel_at_period_end === true,
            }
            if (planPrice) {
              updateData.planPrice = planPrice
            }
            if (planInterval) {
              updateData.planInterval = planInterval
            }
            if (cardBrand) {
              updateData.cardBrand = cardBrand
            }
            if (cardLast4) {
              updateData.cardLast4 = cardLast4
            }

            await userDocRef.set(updateData, { merge: true })
            functions.logger.info(`Subscription updated for user ${userId}.`)
            // eslint-disable-next-line
          } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
            await userDocRef.set({
              isPremium: false,
              premiumUntil: FieldValue.delete(),
            }, { merge: true })
            functions.logger.info(`Subscription deactivated for user ${userId}.`)
          }
        } else {
          // eslint-disable-next-line
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
            isCanceled: FieldValue.delete(),
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

      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        if (invoice.subscription) {
          functions.logger.info(`Invoice payment succeeded for subscription ${invoice.subscription}.`)

          const usersSnapshot = await admin.firestore().collection('users').where('stripeCustomerId', '==', invoice.customer).get()
          if (!usersSnapshot.empty) {
            const uid = usersSnapshot.docs[0].id

            const paymentsCollection = process.env.PAYMENTS_COLLECTION || 'payment_history'
            await admin.firestore().collection(paymentsCollection).add({
              uid,
              amount: invoice.amount_paid || 0,
              currency: invoice.currency || 'usd',
              status: invoice.status || 'paid',
              createdAt: FieldValue.serverTimestamp(),
              stripeInvoiceId: invoice.id || null,
              stripeSubscriptionId: invoice.subscription || null,
              hostedInvoiceUrl: invoice.hosted_invoice_url || null,
              invoicePdf: invoice.invoice_pdf || null,
            })
            functions.logger.info(`Payment history added for user ${uid}.`)
          }
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
