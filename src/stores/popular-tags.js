import { collection, getDocs } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase'

const VITE_POST_COLLECTION = import.meta.env.VITE_POST_COLLECTION

export const usePopularTagsStore = defineStore('popularTags', {
  state: () => ({
    allTags: [],
  }),
  actions: {
    /**
     * Fetches all posts from the Firestore collection and calculates the most popular tags.
     * It iterates through each post, collects tags from `tags`, counts their occurrences,
     * sorts them in descending order of popularity, and stores all tags in the state.
     */
    async getPopularTags () {
      try {
        const q = collection(db, VITE_POST_COLLECTION)
        const querySnapshot = await getDocs(q)
        const allTagsList = []

        // Iterate through each document in the collection using .docs
        for (const doc of querySnapshot.docs) {
          const post = doc.data()
          // Check if tags exist and is an array
          const tags = post.tags
          if (Array.isArray(tags) && tags.length > 0) {
            allTagsList.push(...tags)
          }
        }

        // Count the occurrences of each tag
        const tagCounts = allTagsList.reduce((acc, tag) => {
          acc[tag] = (acc[tag] || 0) + 1
          return acc
        }, {})

        // Sort tags by count in descending order using sort()
        const sortedTags = Object.keys(tagCounts).toSorted((a, b) => tagCounts[b] - tagCounts[a])

        // Store all sorted tags
        this.allTags = sortedTags
      } catch (error) {
        console.error('Error getting popular tags:', error)
      }
    },
  },
})
