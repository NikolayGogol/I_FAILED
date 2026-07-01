<script setup>
  import dayjs from 'dayjs'
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import History from '@/components/settings/membership/History.vue'
  import Subscribe from '@/components/sidebars/Subscribe.vue'
  import { getIcon } from '@/models/icons.js'
  import { useAuthStore } from '@/stores/auth.js'
  import { useSubscriptionStore } from '@/stores/subscription.js'
  import { isPremium } from '@/utils/premium.js'

  const router = useRouter()
  const authStore = useAuthStore()
  const subscriptionStore = useSubscriptionStore()
  const toast = useToast()
  const showCancelModal = ref(false)
  const showSuccessModal = ref(false)
  const isCanceling = ref(false)
  const activeTab = ref(0)
  const isOpeningPortal = ref(false)

  const everything = [
    { text: 'Advanced analytics on your failures' },
    { text: 'Custom "Failure Resume" templates.scss' },
    { text: 'Ad-free experience' },
    { text: 'Priority support' },
    { text: '"Verified Resilience" badge' },
    { text: 'Export all your data' },
    { text: 'Custom themes' },
    { text: 'Early access to new features' },
  ]

  /**
   * Confirms and processes the subscription cancellation.
   * Calls the backend to cancel the active Stripe subscription.
   */
  async function confirmCancelSubscription () {
    isCanceling.value = true
    const success = await subscriptionStore.cancelSubscription()
    isCanceling.value = false

    if (success) {
      showCancelModal.value = false
      showSuccessModal.value = true
    } else {
      toast.error(subscriptionStore.error || 'Failed to cancel subscription')
    }
  }

  /**
   * Redirects the user to the premium page.
   * The user can select a plan (Monthly/Yearly) there before renewing.
   */
  function handleRenewSubscription () {
    router.push('/premium')
  }

  async function handleOpenPortal () {
    isOpeningPortal.value = true
    const success = await subscriptionStore.openCustomerPortal()
    isOpeningPortal.value = false
    if (!success) {
      toast.error(subscriptionStore.error || 'Failed to open billing portal')
    }
  }

  /**
   * Computes the display name of the current subscription.
   * Combines the plan interval with the trial status to show a clear name.
   */

  const subscriptionName = computed(() => {
    const status = authStore.user?.payment?.subscriptionStatus
    if (status === 'trialing') {
      return 'Free Trial'
    } else if (authStore.user?.payment?.planInterval === 'year') {
      return 'Yearly Premium'
    } else {
      return 'Monthly Premium'
    }
  })

  /**
   * Checks if the user has canceled their premium subscription.
   * A canceled subscription remains active until the end of the billing period.
   */
  const isCanceled = computed(() => authStore.user?.payment?.isCanceled === true)

  /**
   * Formats the date of the next payment or expiration.
   */
  const premiumUntilDate = computed(() => {
    if (authStore.user?.payment?.premiumUntil) {
      const seconds = authStore.user.payment.premiumUntil.seconds
      if (seconds) return dayjs.unix(seconds).format('DD.MM.YYYY')
      return dayjs(authStore.user.payment.premiumUntil).format('DD.MM.YYYY')
    }
    return null
  })
  const planPrice = computed(() => {
    return authStore.user?.payment?.subscriptionStatus === 'trialing' ? '$0.00' : authStore.user?.payment?.planPrice
  })
  const cardBrand = computed(() => {
    const brand = authStore.user?.payment?.cardBrand || 'Visa'
    return brand.charAt(0).toUpperCase() + brand.slice(1)
  })
  const cardLast4 = computed(() => authStore.user?.payment?.cardLast4 || '****')

</script>

<template>

  <div v-if="!activeTab" class="premium-settings-card">
    <template v-if="isPremium">
      <h2 class="title">Membership details</h2>

      <div class="subscription-header">
        <div class="logo-circle pa-2">
          <v-img src="../../assets/Logo.png" />
        </div>
        <span class="subscription-name">{{ subscriptionName }}</span>
      </div>

      <div class="details-list">
        <div class="detail-row">
          <span class="label mb-0">Next Payment</span>
          <span v-if="isCanceled" class="value font-weight-bold" style="color: #E53935;">Canceled</span>
          <span v-else class="value">{{ premiumUntilDate || '14.03.2026' }}</span>
        </div>
        <div class="detail-row">
          <span class="label mb-0">Price</span>
          <span class="value">{{ planPrice }}</span>
        </div>
        <div class="detail-row payment-method-row">
          <span class="label mb-0">Payment Method</span>
          <div class="method-info">
            <div class="card-details">
              <div class="d-flex mr-2" v-html="getIcon('card')" />
              <span class="value">{{ cardBrand }} **{{ cardLast4 }}</span>
            </div>
            <button class="change-link" :disabled="subscriptionStore.loading" @click="handleOpenPortal">
              <v-progress-circular
                v-if="isOpeningPortal"
                class="mr-2"
                indeterminate
                size="12"
                width="2"
              />
              <span v-else>Change</span>
            </button>
          </div>
        </div>
        <div class="detail-row history-row" @click="activeTab = 1">
          <span class="label mb-0">Payment history</span>
          <v-icon color="grey-lighten-1" icon="mdi-chevron-right" />
        </div>
      </div>

      <button
        v-if="isCanceled"
        class="submit-btn mt-6"
        :class="{'opacity-60 pointer-events-none': isRenewing}"
        style="padding: 10px 20px;"
        @click="handleRenewSubscription"
      >
        <v-progress-circular
          v-if="isRenewing"
          class="mr-2"
          indeterminate
          size="20"
          width="2"
        />
        <span v-else>Renew subscription</span>
      </button>
      <button v-else class="cancel-sub-btn" @click="showCancelModal = true">
        Cancel Subscription
      </button>

      <!-- Cancel Subscription Modal -->
      <v-dialog v-model="showCancelModal" max-width="500">
        <v-card class="cancel-modal-card pa-8 rounded-xl">
          <h2 class="text-center font-weight-bold mb-2">Cancel subscription?</h2>
          <p class="text-center text-grey-darken-1 mb-6 text-body-2">You will loose all these benefits and downgrade to free plan</p>

          <ul class="modal-benefits-list mb-8">
            <li v-for="(item, index) in everything" :key="index" class="d-flex align-center mb-3">
              <v-icon class="mr-3" color="success" icon="mdi-check-circle" size="20" />
              <span class="text-body-2 font-weight-medium text-grey-darken-3">{{ item.text }}</span>
            </li>
          </ul>

          <v-row>
            <v-col cols="6">
              <button class="cancel-btn w-100" @click="showCancelModal = false">Cancel</button>
            </v-col>
            <v-col cols="6">
              <button class="submit-btn w-100" :class="{'opacity-60 pointer-events-none': isCanceling}" @click="confirmCancelSubscription">
                <v-progress-circular
                  v-if="isCanceling"
                  class="mr-2"
                  indeterminate
                  size="20"
                  width="2"
                />
                <span v-else>Cancel subscription</span>
              </button>
            </v-col>
          </v-row>
        </v-card>
      </v-dialog>

      <!-- Success Cancel Modal -->
      <v-dialog v-model="showSuccessModal" max-width="400">
        <v-card class="cancel-modal-card pa-8 rounded-xl text-center">
          <h2 class="font-weight-bold mb-4" style="font-size: 20px;">Done! Your subscription has been canceled</h2>
          <p class="text-grey-darken-1 mb-6 text-body-2">You can renew your subscription any time</p>
          <button class="submit-btn w-100" @click="showSuccessModal = false">Got it</button>
        </v-card>
      </v-dialog>
    </template>
    <template v-else>
      <h2 class="title">Membership details</h2>

      <div class="subscription-header mb-6">
        <div class="logo-circle pa-2">
          <v-img src="../../assets/Logo.png" />
        </div>
        <span class="subscription-name">Free Plan</span>
      </div>

      <Subscribe />
    </template>
  </div>
  <History v-if="activeTab === 1" @back="activeTab = 0" />
</template>

<style scoped lang="scss">
@use '@/styles/components/settings/premium.scss';
</style>
