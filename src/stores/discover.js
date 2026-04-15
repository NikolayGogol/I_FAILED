import { collection, getDocs, query } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase.js'
const VITE_USER_CATEGORY_READS_COLLECTION = import.meta.env.VITE_USER_CATEGORY_READS_COLLECTION
export const useDiscoverStore = defineStore('discover', {
  state: () => ({}),
  actions: {
    async fetchSimilarPost () {
      const postsRef = collection(db, VITE_USER_CATEGORY_READS_COLLECTION)
      const q = query(postsRef)
      const snapshot = await getDocs(q)
      const result = []
      for (const doc of snapshot.docs) {
        result.push({
          ...doc.data(),
          id: doc.id,
        })
      }
      return getUniqueRandomCategories(result)
    },
  },
})
function getUniqueRandomCategories (data, count = 3) {
  const shuffled = [...data].toSorted(() => 0.5 - Math.random())

  const seenCategories = new Set()
  const result = []

  for (const item of shuffled) {
    if (!seenCategories.has(item.categoryId)) {
      seenCategories.add(item.categoryId)
      result.push(item)
    }
    if (result.length === count) {
      break
    }
  }

  return result
}
