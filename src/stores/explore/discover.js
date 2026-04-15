import { collection, getCountFromServer, getDocs, query, where } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase.js'

const VITE_USER_CATEGORY_READS_COLLECTION = import.meta.env.VITE_USER_CATEGORY_READS_COLLECTION
const VITE_POST_COLLECTION = import.meta.env.VITE_POST_COLLECTION
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
      return getUniqueRandomCategories(result, 3)
    },
    async countPostByCategory (categories) {
      const promises = categories.map(async (cat) => {
        const postsRef = collection(db, VITE_POST_COLLECTION)
        const q = query(postsRef, where('selectedCategories', 'array-contains', {
          id: cat.id,
          label: cat.label,
        }))
        const snapshot = await getCountFromServer(q)
        return {
          id: cat.id,
          label: cat.label,
          count: snapshot.data().count,
        }
      })
      return Promise.all(promises)
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
