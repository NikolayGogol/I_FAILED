import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
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
const VITE_POSTS = import.meta.env.VITE_POST_COLLECTION

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

        const currentItems = collectionDoc.data().items || []

        if (currentItems.includes(post.id)) {
          throw new Error('Post already exists in this collection.')
        }

        const newItems = arrayUnion(post.id)
        const newCounter = currentItems.length + 1

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
    async getPostFromCollection (id) {
      const collectionRef = doc(db, VITE_LIBRARY, id)
      const collectionSnap = await getDoc(collectionRef)

      if (!collectionSnap.exists()) {
        console.log('No such collection document!')
        return []
      }

      const postIds = collectionSnap.data().items
      if (!postIds || postIds.length === 0) {
        return []
      }

      const postsRef = collection(db, VITE_POSTS)
      const allPosts = []
      // Firestore 'in' query is limited to 30 items. We need to chunk the requests.
      const CHUNK_SIZE = 30
      for (let i = 0; i < postIds.length; i += CHUNK_SIZE) {
        const chunk = postIds.slice(i, i + CHUNK_SIZE)
        const q = query(postsRef, where(documentId(), 'in', chunk))
        const querySnapshot = await getDocs(q)
        for (const doc of querySnapshot.docs) {
          allPosts.push({ id: doc.id, ...doc.data() })
        }
      }

      // The posts from getDocs are not ordered. We should order them based on postIds array.
      const postsById = new Map(allPosts.map(p => [p.id, p]))
      const orderedPosts = postIds.map(id => postsById.get(id)).filter(Boolean)

      return orderedPosts
    },
    async removePostFromCollection (collectionId, postId, counter) {
      const docRef = doc(db, VITE_LIBRARY, collectionId)
      return await updateDoc(docRef, {
        ...counter,
        items: arrayRemove(postId),
      })
    },
  },
})
