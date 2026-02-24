import { collection, getDocs, query } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase'

// Make sure to define VITE_POST_COLLECTION in your .env file
const collection_db = import.meta.env.VITE_POST_COLLECTION

export const useMainStore = defineStore('main', {
  state: () => ({
    totalPosts: 0,
  }),
  actions: {
    async getFeeds () {
      const posts = []
      // Fetch documents without server-side sorting
      const q = query(collection(db, collection_db))
      const querySnapshot = await getDocs(q)

      this.totalPosts = querySnapshot.size

      for (const doc of querySnapshot.docs) {
        posts.push({ id: doc.id, ...doc.data() })
      }

      // Sort the posts on the client-side
      posts.sort((a, b) => {
        const dateA = a.createdAt?.toDate() || 0
        const dateB = b.createdAt?.toDate() || 0
        return dateB - dateA // Sort descending
      })

      return posts
    },
  },
  persist: {
    key: 'main-store',
    storage: localStorage,
    paths: ['totalPosts'],
  },
})
