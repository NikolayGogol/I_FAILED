import { collection, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query, startAfter, where } from 'firebase/firestore'
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
      const promises = categories.map(async cat => {
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
    async getPostByCategory (category, pageSize = 10, lastDocId = null) {
      const postsRef = collection(db, VITE_POST_COLLECTION)
      let q = query(
        postsRef,
        where('selectedCategories', 'array-contains', {
          id: category.id,
          label: category.label,
        }),
        orderBy('createdAt', 'desc'), // Order by a field for consistent pagination
        limit(pageSize + 1), // Fetch one more to check if there's a next page
      )

      if (lastDocId) {
        const lastDocRef = doc(db, VITE_POST_COLLECTION, lastDocId)
        const lastDoc = await getDoc(lastDocRef)
        if (lastDoc.exists()) {
          q = query(
            postsRef,
            where('selectedCategories', 'array-contains', {
              id: category.id,
              label: category.label,
            }),
            orderBy('createdAt', 'desc'),
            startAfter(lastDoc),
            limit(pageSize + 1),
          )
        }
      }

      const snapshot = await getDocs(q)
      const results = []
      let nextCursorDocId = null
      let hasMore = false

      for (const [index, doc] of snapshot.docs.entries()) {
        if (index < pageSize) {
          results.push({
            ...doc.data(),
            id: doc.id,
          })
        }
      }

      if (snapshot.docs.length > pageSize) {
        hasMore = true
        nextCursorDocId = snapshot.docs[pageSize - 1].id // The last doc of the current page
      } else if (results.length > 0) {
        nextCursorDocId = results.at(-1).id
      }

      return {
        posts: results,
        nextCursorDocId,
        hasMore,
      }
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
