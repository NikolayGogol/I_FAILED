import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase'

// Make sure to define VITE_POST_COLLECTION in your .env file
const collection_db = import.meta.env.VITE_POST_COLLECTION

export const useMainStore = defineStore('main', {
  state: () => ({}),
  actions: {
    async getFeeds () {
      const posts = []
      const q = query(collection(db, collection_db), orderBy('createAt', 'desc'))
      const querySnapshot = await getDocs(q)
      for (const doc of querySnapshot.docs) {
        // Add the document ID to the post object
        posts.push({ id: doc.id, ...doc.data() })
      }
      return posts
    },
  },
})
