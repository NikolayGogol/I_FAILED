import { collection, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query, startAfter, where } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

const collection_db = import.meta.env.VITE_POST_COLLECTION

export const useMainStore = defineStore('main', {
  state: () => ({
    posts: [],
    lastVisible: null,
    hasMore: true,
    loading: false,
    activeTab: 'latest',
    totalPosts: 0, // State to hold the total count
  }),
  actions: {
    // Action to get the total number of posts
    async fetchTotalPostCount () {
      try {
        const postsRef = collection(db, collection_db)
        const snapshot = await getCountFromServer(postsRef)
        this.totalPosts = snapshot.data().count
      } catch (error) {
        console.error('Error fetching total post count:', error)
      }
    },

    async fetchPosts ({ tab, pageSize = 4 } = {}) {
      // If a new tab is selected, reset everything
      if (tab && tab !== this.activeTab) {
        this.activeTab = tab
        this.posts = []
        this.lastVisible = null
        this.hasMore = true
      }

      if (this.loading || !this.hasMore) {
        return
      }

      this.loading = true
      const authStore = useAuthStore()

      try {
        const postsRef = collection(db, collection_db)
        let q

        const queryConstraints = [limit(pageSize)]
        if (this.lastVisible) {
          queryConstraints.push(startAfter(this.lastVisible))
        }

        if (this.activeTab === 'popular') {
          q = query(postsRef, orderBy('views', 'desc'), ...queryConstraints)
        } else if (this.activeTab === 'for-you') {
          const following = authStore.user?.following || []
          if (following.length === 0) {
            this.posts = []
            this.hasMore = false
            this.loading = false
            return
          }
          const followedUIDs = following.slice(0, 10)
          q = query(postsRef, where('uid', 'in', followedUIDs), orderBy('createdAt', 'desc'), ...queryConstraints)
        } else { // 'latest'
          q = query(postsRef, orderBy('createdAt', 'desc'), ...queryConstraints)
        }

        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
          this.hasMore = false
        } else {
          this.lastVisible = querySnapshot.docs.at(-1)
          if (querySnapshot.docs.length < pageSize) {
            this.hasMore = false
          }

          const newPosts = []
          for (const postDoc of querySnapshot.docs) {
            const postData = postDoc.data()
            const finalPost = { id: postDoc.id, ...postData }

            if (postData.uid) {
              const userRef = doc(db, 'users', postData.uid)
              const userSnap = await getDoc(userRef)
              finalPost.user = userSnap.exists() ? { ...finalPost.user, ...userSnap.data(), uid: userSnap.id } : { ...finalPost.user, uid: postData.uid }
            }
            newPosts.push(finalPost)
          }
          this.posts.push(...newPosts)
        }
      } catch (error) {
        console.error('Error fetching posts:', error)
        this.hasMore = false
      } finally {
        this.loading = false
      }
    },
  },
  persist: false,
})
