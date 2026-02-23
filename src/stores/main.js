import { collection, getDocs } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase'

// Make sure to define VITE_POST_COLLECTION in your .env file
const collection_db = import.meta.env.VITE_POST_COLLECTION

export const useMainStore = defineStore('main', {
  state: () => ({}),
  actions: {
    async getFeeds () {
      const posts = []
      const querySnapshot = await getDocs(collection(db, collection_db))
      for (const doc of querySnapshot.docs) {
        // Add the document ID to the post object
        posts.push({ id: doc.id, ...doc.data() })
      }
      return posts
    },
  },
})
