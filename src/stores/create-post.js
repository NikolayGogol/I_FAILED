import { addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { getDownloadURL, ref, uploadBytes } from '@/firebase'
import { db, storage } from '@/firebase'
import { visibilityList } from '@/models/categories.js'
import { noAvatar } from '@/models/no-data.js'
import { useAuthStore } from '@/stores/auth.js'

const collection_db = import.meta.env.VITE_POST_COLLECTION

export const useCreatePostStore = defineStore('createPost', {
  state: () => ({
    selectedCategories: null,
    title: '',
    whatHappened: '',
    whenHappened: null,
    images: [],
    isAnonymous: false,
    visibility: visibilityList[0],
    allowComments: true,
    enableTriggerWarning: false,
    triggerTags: [],
  }),
  actions: {
    resetState () {
      this.selectedCategories = null
      this.title = ''
      this.whatHappened = ''
      this.whenHappened = null
      this.images = []
      this.isAnonymous = false
      this.visibility = visibilityList[0]
      this.allowComments = true
      this.enableTriggerWarning = false
      this.triggerTags = []
    },
    async createPost () {
      const authStore = useAuthStore()
      if (!authStore.user) {
        return { success: false, error: 'User is not authenticated.' }
      }

      const postData = {
        selectedCategories: this.selectedCategories ? [this.selectedCategories] : [],
        title: this.title,
        description: this.whatHappened,
        date: this.whenHappened,
        images: [], // Placeholder
        isAnonymous: this.isAnonymous,
        visibility: this.visibility,
        allowComments: this.allowComments,
        enableTriggerWarning: this.enableTriggerWarning,
        triggerTags: this.triggerTags,
        createdAt: serverTimestamp(),
        status: 'published',
        publishedAt: serverTimestamp(),
        uid: authStore.user.uid,
        user: {
          displayName: this.isAnonymous ? 'Anonymous' : authStore.user.displayName,
          photoURL: this.isAnonymous ? noAvatar : authStore.user.photoURL,
        },
        likes: 0,
        comments: 0,
        views: 0,
        likedBy: [],
      }

      try {
        const docRef = await addDoc(collection(db, collection_db), postData)
        const postId = docRef.id

        let imageUrls = []
        if (this.images && this.images.length > 0) {
          const uploadPromises = this.images.map(imageObject => {
            const imageFile = imageObject.file
            if (!imageFile) return Promise.resolve(null)
            const storageRef = ref(storage, `posts/${postId}/${Date.now()}_${imageObject.name}`)
            return uploadBytes(storageRef, imageFile).then(snapshot => getDownloadURL(snapshot.ref))
          })
          const resolvedUrls = await Promise.all(uploadPromises)
          imageUrls = resolvedUrls.filter(url => url !== null)
        }

        if (imageUrls.length > 0) {
          await updateDoc(docRef, { images: imageUrls })
        }

        this.resetState()
        return { success: true, postId }
      } catch (error) {
        console.error('Error creating post:', error)
        return { success: false, error: error.message }
      }
    },
  },
})
