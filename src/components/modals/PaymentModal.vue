<script setup>
  import { loadStripe } from '@stripe/stripe-js'
  import { onMounted, ref } from 'vue'

  const emit = defineEmits(['confirm', 'close'])
  const props = defineProps({
    dialog: {
      type: Boolean,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  })

  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  let stripe = null
  let cardElement = null
  const cardErrors = ref('')

  onMounted(async () => {
    stripe = await stripePromise
    const elements = stripe.elements()
    cardElement = elements.create('card', {
      style: {
        base: {
          'color': '#32325d',
          'fontFamily': '"Helvetica Neue", Helvetica, sans-serif',
          'fontSmoothing': 'antialiased',
          'fontSize': '16px',
          '::placeholder': {
            color: '#aab7c4',
          },
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a',
        },
      },
    })
    cardElement.mount('#card-element')

    cardElement.on('change', event => {
      cardErrors.value = event.error ? event.error.message : ''
    })
  })

  async function submitPayment () {
    if (props.loading) return
    cardErrors.value = ''

    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    })

    if (error) {
      cardErrors.value = error.message
    } else {
      emit('confirm', paymentMethod.id)
    }
  }

  function closeDialog () {
    if (props.loading) return
    emit('close')
  }
</script>

<template>
  <v-dialog max-width="500px" :model-value="dialog" persistent @update:model-value="closeDialog">
    <v-card class="pa-4 rounded-xl">
      <v-card-title class="text-center">
        <span class="text-h5 font-weight-bold">Upgrade to Premium</span>
      </v-card-title>
      <v-card-text>
        Enter your card details to subscribe.
        <div id="card-element" class="mt-4 pa-3" style="border: 1px solid #ccc; border-radius: 4px;">
          <!-- A Stripe Element will be inserted here. -->
        </div>
        <div v-if="cardErrors" class="text-red-darken-2 mt-2">{{ cardErrors }}</div>
      </v-card-text>
      <div class="d-flex justify-center mt-4">
        <div class="cancel-btn" @click="closeDialog">Cancel</div>
        <div class="submit-btn ml-3" @click="submitPayment">
          <v-progress-circular
            v-if="loading"
            color="white"
            indeterminate
            size="20"
            width="2"
          />
          <span v-else>Subscribe</span>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>
