import {
  deleteDoc,
  doc,
} from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase.js'
import { useAuthStore } from '@/stores/auth.js'
import { useSinglePostStore } from '@/stores/single-post/single-post.js'

const comments_collection = import.meta.env.VITE_COMMENTS

export const useCommentMenuStore = defineStore('commentMenu', {
  actions: {
    async deleteComment (commentId) {
      try {
        const docRef = doc(db, comments_collection, commentId)
        await deleteDoc(docRef)
      } catch (error) {
        console.error('Error deleting comment:', error)
        throw error
      }
    },
    async updateComment (commentId, newText) {
      try {
        const authStore = useAuthStore()
        const user = authStore.user
        const singlePostStore = useSinglePostStore()

        await singlePostStore.updateComment(commentId, newText, user)
      } catch (error) {
        console.error('Error updating comment:', error)
        throw error
      }
    },
  },
})
