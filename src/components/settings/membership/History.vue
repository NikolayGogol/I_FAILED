<script setup>
  import dayjs from 'dayjs'
  import { computed, onMounted } from 'vue'
  import { useAuthStore } from '@/stores/auth.js'
  import { usePaymentStore } from '@/stores/payment.js'

  const emit = defineEmits(['back'])
  const authStore = useAuthStore()
  const paymentStore = usePaymentStore()

  const cardBrand = computed(() => {
    const brand = authStore.user?.payment?.cardBrand || 'Visa'
    return brand.charAt(0).toUpperCase() + brand.slice(1)
  })

  const cardLast4 = computed(() => authStore.user?.payment?.cardLast4 || '****')

  onMounted(() => {
    if (authStore.user?.uid) {
      paymentStore.fetchPaymentHistory(authStore.user.uid)
    }
  })

  function formatDate (timestamp) {
    if (!timestamp) return ''
    // Handle Firebase Client SDK Timestamp (has .seconds)
    if (timestamp.seconds) {
      return dayjs.unix(timestamp.seconds).format('DD.MM.YYYY')
    }
    // Handle Firebase Admin SDK serialized Timestamp (has ._seconds)
    if (timestamp._seconds) {
      return dayjs.unix(timestamp._seconds).format('DD.MM.YYYY')
    }
    // Fallback for string dates (like ISO strings)
    return dayjs(timestamp).format('DD.MM.YYYY')
  }

  function formatAmount (amount, currency) {
    // Amount is usually in cents for USD
    const value = (amount / 100).toFixed(2)
    const sym = currency?.toLowerCase() === 'usd' ? '$' : ''
    return `${sym}${value}`
  }
</script>

<template>
  <div class="history-container">
    <div class="header d-flex align-center cursor-pointer" @click="emit('back')">
      <v-icon class="mr-4 text-grey-darken-1" icon="mdi-chevron-left" />
      <span class="text-subtitle-1 text-grey-darken-3">Payment history</span>
    </div>

    <div v-if="paymentStore.loading" class="d-flex justify-center mt-10">
      <v-progress-circular color="primary" indeterminate />
    </div>

    <div v-else class="history-table mt-8">
      <div class="table-header text-caption font-weight-bold text-grey-darken-3">
        <div class="col-date">Date</div>
        <div class="col-method">Paid via</div>
        <div class="col-amount">Amount</div>
      </div>

      <template v-if="paymentStore.history.length > 0">
        <div
          v-for="item in paymentStore.history"
          :key="item.id"
          class="table-row text-body-2 text-grey-darken-3"
        >
          <div class="col-date">{{ formatDate(item.createdAt) }}</div>
          <div class="col-method">{{ cardBrand }} **{{ cardLast4 }}</div>
          <div class="col-amount font-weight-medium">{{ formatAmount(item.amount, item.currency) }}</div>
        </div>
      </template>

      <div v-else class="text-center text-grey mt-10">
        No payment history found.
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/styles/components/settings/membership/history.scss";
</style>
