import { arrayRemove, arrayUnion, collection, doc, getDocs, updateDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase'
import { useAuthStore } from './auth'

const VITE_POST_COLLECTION = import.meta.env.VITE_POST_COLLECTION
const VITE_USERS_COLLECTION = import.meta.env.VITE_USERS_COLLECTION

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

    async followTag (tag) {
      const authStore = useAuthStore()
      if (!authStore.user) {
        return { success: false, message: 'User not authenticated' }
      }

      const userRef = doc(db, VITE_USERS_COLLECTION, authStore.user.uid)
      const isFollowing = authStore.user.followedTags?.includes(tag)

      try {
        if (isFollowing) {
          await updateDoc(userRef, {
            followedTags: arrayRemove(tag),
          })
          authStore.user.followedTags = authStore.user.followedTags.filter(t => t !== tag)
          return { success: true, following: false, message: `Unfollowed ${tag}` }
        } else {
          await updateDoc(userRef, {
            followedTags: arrayUnion(tag),
          })
          if (!authStore.user.followedTags) {
            authStore.user.followedTags = []
          }
          authStore.user.followedTags.push(tag)
          return { success: true, following: true, message: `Following ${tag}` }
        }
      } catch (error) {
        console.error('Error following tag:', error)
        return { success: false, message: 'Failed to update tag follow status' }
      }
    },
    async toggleInterestInTag(tag) {
      const authStore = useAuthStore()
      if (!authStore.user) return { success: false, message: 'User not authenticated' }

      const userRef = doc(db, VITE_USERS_COLLECTION, authStore.user.uid)
      const isNotInterested = authStore.user.notInterestedTags?.includes(tag)

      try {
        if (isNotInterested) {
          await updateDoc(userRef, {
            notInterestedTags: arrayRemove(tag)
          });
          authStore.user.notInterestedTags = authStore.user.notInterestedTags.filter(t => t !== tag)
          return { success: true, interested: true, message: `You will now see posts with ${tag}` }
        } else {
          await updateDoc(userRef, {
            notInterestedTags: arrayUnion(tag)
          });
          if (!authStore.user.notInterestedTags) {
            authStore.user.notInterestedTags = []
          }
          authStore.user.notInterestedTags.push(tag)
          return { success: true, interested: false, message: `Not interested in ${tag}` }
        }
      } catch (error) {
        console.error('Error updating interest in tag:', error)
        return { success: false, message: 'Failed to update tag interest status' }
      }
    }
  },
})
