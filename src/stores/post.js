import { defineStore } from 'pinia'
import { doc, deleteDoc } from 'firebase/firestore'
import { db } from '@/firebase'

export const usePostStore = defineStore('post', {
  actions: {
    async deletePost(postId) {
      try {
        await deleteDoc(doc(db, 'posts', postId))
        return true
      } catch (error) {
        console.error('Error deleting post: ', error)
        return false
      }
    },
  },
})
