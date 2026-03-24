import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/firebase'

const VITE_BOOKMARKS_COLLECTION = 'bookmarks'
const VITE_POST_COLLECTION = import.meta.env.VITE_POST_COLLECTION
const VITE_USERS_COLLECTION = 'users'

function getCurrentUser () {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe()
        resolve(user)
      },
      reject,
    )
  })
}

async function fetchUser (uid) {
  if (!uid) return null
  const userDocRef = doc(db, VITE_USERS_COLLECTION, uid)
  const userDoc = await getDoc(userDocRef)
  return userDoc.exists() ? userDoc.data() : null
}

export const useLibraryStore = defineStore('library', {
  state: () => ({
    bookmarkedPosts: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchBookmarkedPosts () {
      this.loading = true
      this.error = null

      const user = await getCurrentUser()

      if (!user) {
        this.error = 'User not logged in'
        this.loading = false
        return
      }

      this.bookmarkedPosts = []

      try {
        const uid = user.uid
        const bookmarksCollectionRef = collection(db, VITE_BOOKMARKS_COLLECTION)
        const q = query(bookmarksCollectionRef, where('userId', '==', uid))
        const querySnapshot = await getDocs(q)

        const postPromises = querySnapshot.docs.map(async (bookmarkDoc) => {
          const bookmarkData = bookmarkDoc.data()
          let post = bookmarkData.post

          if (!post) {
            // If the post object is missing, fetch it from the posts collection
            const postDocRef = doc(db, VITE_POST_COLLECTION, bookmarkData.postId)
            const postDoc = await getDoc(postDocRef)
            if (postDoc.exists()) {
              post = postDoc.data()
            }
          }

          if (!post) return null

          // Ensure the user object is complete
          if (!post.user?.photoURL && post.uid) {
            const postAuthor = await fetchUser(post.uid)
            if (postAuthor) {
              post.user = postAuthor
            }
          }

          return {
            id: bookmarkDoc.id,
            ...bookmarkData,
            post,
          }
        })

        const posts = (await Promise.all(postPromises)).filter(Boolean)
        this.bookmarkedPosts = posts
      } catch (error) {
        console.error('Error fetching bookmarked posts:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
  },
})
