import { collection, getDocs, query, doc, getDoc } from 'firebase/firestore'
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
      const q = query(collection(db, collection_db))
      const querySnapshot = await getDocs(q)

      this.totalPosts = querySnapshot.size

      for (const postDoc of querySnapshot.docs) {
        const postData = postDoc.data()
        // FIX: Use postData.uid to fetch the author's data
        if (postData.uid) {
          const userRef = doc(db, 'users', postData.uid)
          const userSnap = await getDoc(userRef)
          if (userSnap.exists()) {
            // Overwrite the user object with the full user data from the 'users' collection
            posts.push({ id: postDoc.id, ...postData, user: { ...userSnap.data(), uid: userSnap.id } })
          } else {
            // If user is not found, push the post with its original data
            posts.push({ id: postDoc.id, ...postData })
          }
        } else {
          // If post has no author UID, push it as is
          posts.push({ id: postDoc.id, ...postData })
        }
      }

      // Sort the posts on the client-side by creation date
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
