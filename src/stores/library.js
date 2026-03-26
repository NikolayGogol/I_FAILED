import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc, getDocs,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
} from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth.js'

const VITE_LIBRARY = import.meta.env.VITE_LIBRARY

export const useLibraryStore = defineStore('library', {
  state: () => ({}),
  actions: {
    async createNewCollection (name) {
      const authStore = useAuthStore()
      const params = {
        name,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        counter: 0,
        uid: authStore.user.uid,
      }
      return await addDoc(collection(db, VITE_LIBRARY), params)
    },
    async getCollections () {
      const authStore = useAuthStore()
      const postsRef = collection(db, VITE_LIBRARY)
      const q = query(postsRef,
        where('uid', '==', authStore.user.uid),
        orderBy('updatedAt', 'desc'),
      )
      const querySnapshot = await getDocs(q)
      const posts = []
      for (const doc of querySnapshot.docs) {
        const post = { id: doc.id, ...doc.data() }
        posts.push(post)
      }
      return posts
    },
    async saveToCollection (payload) {
      const { post, selectedCollection } = payload
      const docRef = doc(db, VITE_LIBRARY, selectedCollection.id)

      return await runTransaction(db, async transaction => {
        const collectionDoc = await transaction.get(docRef)
        if (!collectionDoc.exists()) {
          throw 'Document does not exist!'
        }

        const newItems = arrayUnion(post.id)
        // Since arrayUnion is a transform, we can't easily get the new length on the client.
        // Instead, we'll get the length from the server and add 1 if the item is not already in the array.
        const currentItems = collectionDoc.data().items || []
        const newCounter = currentItems.includes(post.id) ? currentItems.length : currentItems.length + 1

        transaction.update(docRef, {
          items: newItems,
          counter: newCounter,
          updatedAt: new Date(),
        })
      })
    },
    async deleteCollection (id) {
      const docRef = doc(db, VITE_LIBRARY, id)
      return await deleteDoc(docRef)
    },
    async updateCollection (id, payload) {
      const docRef = doc(db, VITE_LIBRARY, id)
      return await updateDoc(docRef, payload)
    },
  },
})
