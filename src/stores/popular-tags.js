import { collection, getDocs } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase'

const VITE_POST_COLLECTION = import.meta.env.VITE_POST_COLLECTION

export const usePopularTagsStore = defineStore('popularTags', {
  state: () => ({
    tags: [],
  }),
  actions: {
    /**
     * Fetches all posts from the Firestore collection and calculates the most popular tags.
     * It iterates through each post, collects tags from `stepFour.tags`, counts their occurrences,
     * sorts them in descending order of popularity, and stores the top 5 tags in the state.
     */
    async getPopularTags () {
      try {
        const q = collection(db, VITE_POST_COLLECTION)
        const querySnapshot = await getDocs(q)
        const allTags = []

        // Iterate through each document in the collection using .docs
        querySnapshot.docs.forEach(doc => {
          const post = doc.data()
          // Check if tags exist and is an array
          const tags = post.stepFour?.tags
          if (Array.isArray(tags) && tags.length > 0) {
            allTags.push(...tags)
          }
        })

        // Count the occurrences of each tag
        const tagCounts = allTags.reduce((acc, tag) => {
          acc[tag] = (acc[tag] || 0) + 1
          return acc
        }, {})

        // Sort tags by count in descending order using sort()
        const sortedTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a])

        // Store the top 5 tags
        this.tags = sortedTags.slice(0, 5)
      } catch (error) {
        console.error('Error getting popular tags:', error)
      }
    },
  },
})
