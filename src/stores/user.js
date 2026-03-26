import { doc, getDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase'
const VITE_USERS_COLLECTION = import.meta.env.VITE_USERS_COLLECTION

export const useUserStore = defineStore('userStore', {
  actions: {
    async getUserById (id) {
      const docRef = doc(db, VITE_USERS_COLLECTION, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      } else {
        // doc.data() will be undefined in this case
        console.log('No such document!')
        return null
      }
    },
  },
})
