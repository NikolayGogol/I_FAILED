import { addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { useFirestore } from 'vuefire'
import { getDownloadURL, ref, uploadBytes } from '@/firebase' // Correctly import storage from your firebase setup
// eslint-disable-next-line import/no-duplicates
import { storage } from '@/firebase' // Explicitly import storage
import { useAuthStore } from '@/stores/auth.js'

const collection_db = import.meta.env.VITE_POST_COLLECTION
const collection_db_scheduled = import.meta.env.VITE_POST_COLLECTION_SCEDULED

export const useCreatePostStore = defineStore('createPost', {
  state: () => ({
    stepOne: {
      selectedCategories: [],
    },
    stepTwo: {
      title: '',
      description: '',
      date: null,
      whatWentWrong: '',
      howDidItFeel: '',
      images: [], // This will hold the array of image objects
    },
    stepThree: {
      whatILearned: '',
      keyTakeaways: '',
      whatIdDoDifferently: '',
      advice: '',
    },
    stepFour: {
      cost: '',
      recoveryTime: null,
      emotionTags: [],
      tags: [],
    },
    stepFive: {
      isAnonymous: false,
      visibility: 'Public',
      allowComments: true,
      enableTriggerWarning: false,
      scheduleDate: null,
    },
  }),
  actions: {
    async createPost () {
      const authStore = useAuthStore()
      const db = useFirestore()

      if (!authStore.user) {
        return { success: false, error: 'User is not authenticated.' }
      }

      // 1. Prepare initial post data, ensuring stepTwo.images is empty for now
      const scheduleDate = this.stepFive.scheduleDate
      const postData = {
        stepOne: this.stepOne,
        stepTwo: { ...this.stepTwo, images: [] },
        stepThree: this.stepThree,
        stepFour: this.stepFour,
        stepFive: this.stepFive,
        createdAt: serverTimestamp(),
        status: scheduleDate ? 'scheduled' : 'published',
        scheduledAt: scheduleDate ? new Date(scheduleDate) : null,
        publishedAt: scheduleDate ? null : serverTimestamp(),
        uid: authStore.user.uid,
        user: {
          displayName: authStore.user.displayName,
          photoURL: authStore.user.photoURL,
        },
        likes: 0,
        comments: 0,
        views: 0,
        likedBy: [],
      }

      try {
        // 2. Create the document in Firestore to get a unique ID
        // If scheduled, save to 'scheduledPosts' collection, otherwise to main collection
        const targetCollection = scheduleDate ? collection_db_scheduled : collection_db
        const docRef = await addDoc(collection(db, targetCollection), postData)
        const postId = docRef.id

        // 3. Upload images to Firebase Storage
        const imagesToUpload = this.stepTwo.images
        let imageUrls = []

        if (imagesToUpload && imagesToUpload.length > 0) {
          const uploadPromises = imagesToUpload.map(imageObject => {
            const imageFile = imageObject.file
            if (!imageFile) {
              return Promise.resolve(null)
            }

            // Use the same storage path structure regardless of collection
            const storageRef = ref(storage, `posts/${postId}/${Date.now()}_${imageObject.name}`)
            return uploadBytes(storageRef, imageFile).then(snapshot => getDownloadURL(snapshot.ref))
          })

          const resolvedUrls = await Promise.all(uploadPromises)
          imageUrls = resolvedUrls.filter(url => url !== null)
        }

        // 4. If images were uploaded, update the document with their URLs in the correct field
        if (imageUrls.length > 0) {
          // **FIX:** Use dot notation to update the nested 'images' array within 'stepTwo'
          await updateDoc(docRef, { 'stepTwo.images': imageUrls })
        }

        return { success: true, postId }
      } catch (error) {
        console.error('Error creating post:', error)
        return { success: false, error: error.message }
      }
    },
  },
})
