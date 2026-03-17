import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase'

const collection_db = import.meta.env.VITE_POST_COLLECTION
const collection_db_scheduled = import.meta.env.VITE_POST_COLLECTION_SCEDULED

export const useRecoveryPostStore = defineStore('recovery-post', {
  state: () => ({}),
  actions: {
    async recoveryPost (payload) {
      try {
        const { id, ...updateData } = payload
        if (!id) {
          throw new Error('Post ID is required for updating.')
        }

        // 1. Determine target collection and state
        const isScheduled = !!updateData.scheduleDate
        const targetCollection = isScheduled ? collection_db_scheduled : collection_db
        const sourceCollection = isScheduled ? collection_db : collection_db_scheduled

        // Prepare the status and date fields based on the scheduleDate
        const formattedData = {
          ...updateData,
          status: isScheduled ? 'scheduled' : 'published',
          scheduledAt: isScheduled ? new Date(updateData.scheduleDate) : null,
          // Only update publishedAt if we are publishing it right now
          ...( !isScheduled && { publishedAt: serverTimestamp() } ),
        }

        // Remove scheduleDate as we use scheduledAt in DB
        delete formattedData.scheduleDate

        // 2. We don't know for sure where it currently resides, so we check both, or try target first
        // Usually, the easiest way to handle moving is:
        // Try getting it from source, if it exists, it's a move.
        // If it doesn't, try target.

        let currentDocRef = doc(db, sourceCollection, id)
        let docSnap = await getDoc(currentDocRef)
        let isMoving = true

        if (!docSnap.exists()) {
           // It might already be in the target collection
           currentDocRef = doc(db, targetCollection, id)
           docSnap = await getDoc(currentDocRef)
           isMoving = false
        }

        if (!docSnap.exists()) {
            throw new Error('Post not found in either collection.')
        }

        if (isMoving) {
            // We need to move the document
            const existingData = docSnap.data()
            const newData = { ...existingData, ...formattedData }

            // Create in target collection
            const newDocRef = doc(db, targetCollection, id)
            await setDoc(newDocRef, newData)

            // Delete from source collection
            await deleteDoc(currentDocRef)
            console.log(`Post moved to ${targetCollection} and updated successfully!`, id)
        } else {
            // Simply update in place
            await updateDoc(currentDocRef, formattedData)
            console.log(`Post updated successfully in ${targetCollection}!`, id)
        }

        return { success: true }
      } catch (error) {
        console.error('Error updating post:', error.message)
        return { success: false, error: error.message }
      }
    },
  },
  persist: false,
})
