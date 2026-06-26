import { collection, getDocs, query, where } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/firebase.js'

export const usePaymentStore = defineStore('payment', () => {
  const history = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchPaymentHistory (uid) {
    loading.value = true
    error.value = null
    try {
      if (!uid) {
        history.value = []
        return
      }

      const paymentsRef = collection(db, 'payment_history')
      // Fetch payments only for this user.
      // We don't use orderBy in the query to avoid the need for a composite index in Firestore,
      // instead we sort it on the client.
      const q = query(paymentsRef, where('uid', '==', uid))

      const snapshot = await getDocs(q)

      const payments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))

      // Sort from newest to oldest
      payments.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0
        const timeB = b.createdAt?.seconds || 0
        return timeB - timeA
      })

      history.value = payments
    } catch (error_) {
      console.error('Failed to fetch payment history:', error_)
      error.value = error_.message
    } finally {
      loading.value = false
    }
  }

  return {
    history,
    loading,
    error,
    fetchPaymentHistory,
  }
})
