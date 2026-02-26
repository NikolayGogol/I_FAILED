import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { defineStore } from 'pinia'
import { auth, db, storage, updateProfile } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

export const useProfileStore = defineStore('profile', {
  state: () => ({
    posts: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchUserPosts (userId) {
      this.loading = true
      this.error = null
      this.posts = []

      try {
        const postsRef = collection(db, 'posts')
        const q = query(postsRef, where('uid', '==', userId))
        const querySnapshot = await getDocs(q)

        const posts = []
        for (const doc of querySnapshot.docs) {
          const post = { id: doc.id, ...doc.data() }
          if (post.uid) {
            const authStore = useAuthStore()
            post.user = {
              displayName: authStore.user?.displayName,
              photoURL: authStore.user?.photoURL,
            }
          }
          posts.push(post)
        }
        this.posts = posts
      } catch (error) {
        console.error('Error fetching user posts:', error)
        this.error = 'Failed to fetch posts.'
      } finally {
        this.loading = false
      }
    },

    async updateUserProfile ({ displayName, photoFile }) {
      this.loading = true
      this.error = null
      const authStore = useAuthStore()

      try {
        const user = auth.currentUser
        if (!user) {
          throw new Error('No user logged in')
        }

        let newPhotoURL = user.photoURL
        const newDisplayName = displayName || user.displayName

        // Upload new photo if provided
        if (photoFile) {
          const fileRef = storageRef(storage, `profile_photos/${user.uid}/${photoFile.name}`)
          const snapshot = await uploadBytes(fileRef, photoFile)
          newPhotoURL = await getDownloadURL(snapshot.ref)
        }

        // 1. Update profile in Firebase Auth
        await updateProfile(user, {
          displayName: newDisplayName,
          photoURL: newPhotoURL,
        })

        // 2. CORRECT: Also update the user document in Firestore
        const userDocRef = doc(db, 'users', user.uid)
        await updateDoc(userDocRef, {
          displayName: newDisplayName,
          photoURL: newPhotoURL,
        })

        // 3. Update local state for immediate reactivity
        authStore.$patch({
          user: {
            ...authStore.user,
            displayName: newDisplayName,
            photoURL: newPhotoURL,
          },
        })

        return true
      } catch (error) {
        console.error('Error updating profile:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
