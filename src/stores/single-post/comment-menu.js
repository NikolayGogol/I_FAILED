import {
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase.js'

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
        const docRef = doc(db, comments_collection, commentId)
        await updateDoc(docRef, {
          text: newText,
          updatedAt: serverTimestamp(),
        })
      } catch (error) {
        console.error('Error updating comment:', error)
        throw error
      }
    },
  },
})
