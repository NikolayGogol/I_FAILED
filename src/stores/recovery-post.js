import { doc, updateDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase'

const collection_db = import.meta.env.VITE_POST_COLLECTION

export const useRecoveryPostStore = defineStore('recovery-post', {
  state: () => ({}),
  actions: {
    async recoveryPost (payload) {
      try {
        const { id, ...updateData } = payload
        if (!id) {
          throw new Error('Post ID is required for updating.')
        }

        const postRef = doc(db, collection_db, id)
        await updateDoc(postRef, updateData)

        console.log('Post updated successfully!', id)
        return { success: true }
      } catch (error) {
        console.error('Error updating post:', error)
        return { success: false, error: error.message }
      }
    },
  },
  persist: false,
})
