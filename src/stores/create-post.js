import { addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { useFirestore } from 'vuefire'
import { getDownloadURL, ref, uploadBytes } from '@/firebase' // Correctly import storage from your firebase setup
import { storage } from '@/firebase' // Explicitly import storage
import { useAuthStore } from '@/stores/auth.js'
import { fakeStepFour, fakeStepOne, fakeStepThree, fakeStepTwo } from '@/utils/faker.js'

const collection_db = import.meta.env.VITE_POST_COLLECTION

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
    async createFakePost () {
      // This function is not modified to upload images as per the request.
      // It will continue to create posts without images.
      const authStore = useAuthStore()
      const db = useFirestore()
      this.stepOne.selectedCategories = fakeStepOne()

      const step2 = await fakeStepTwo()
      this.stepTwo.title = step2.title
      this.stepTwo.description = step2.description
      this.stepTwo.howDidItFeel = step2.howDidItFeel
      this.stepTwo.whatWentWrong = step2.whatWentWrong
      this.stepTwo.date = step2.date
      this.stepTwo.images = step2.images

      const step3 = fakeStepThree()
      this.stepThree.whatILearned = step3.whatILearned
      this.stepThree.keyTakeaways = step3.keyTakeaways
      this.stepThree.whatIdDoDifferently = step3.whatIdDoDifferently
      this.stepThree.advice = step3.advice

      const step4 = fakeStepFour()
      this.stepFour.cost = step4.cost
      this.stepFour.recoveryTime = step4.recoveryTime
      this.stepFour.emotionTags = step4.emotionTags
      this.stepFour.tags = step4.tags

      const obj2send = {
        stepOne: this.stepOne,
        stepTwo: { ...this.stepTwo, images: [] }, // Exclude raw File objects
        stepThree: this.stepThree,
        stepFour: this.stepFour,
        stepFive: this.stepFive,
        createdAt: serverTimestamp(),
        uid: authStore.user?.uid,
        user: {
          displayName: authStore.user?.displayName,
          photoURL: authStore.user?.photoURL,
        },
      }
      try {
        return await addDoc(collection(db, collection_db), obj2send)
      } catch (error) {
        return `Error adding document:', ${error}`
      }
    },
    async createPost () {
      const authStore = useAuthStore()
      const db = useFirestore()

      if (!authStore.user) {
        return { success: false, error: 'User is not authenticated.' }
      }

      // 1. Prepare initial post data, ensuring stepTwo.images is empty for now
      const postData = {
        stepOne: this.stepOne,
        stepTwo: { ...this.stepTwo, images: [] },
        stepThree: this.stepThree,
        stepFour: this.stepFour,
        stepFive: this.stepFive,
        createdAt: serverTimestamp(),
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
        const docRef = await addDoc(collection(db, collection_db), postData)
        const postId = docRef.id

        // 3. Upload images to Firebase Storage
        const imagesToUpload = this.stepTwo.images
        let imageUrls = []

        if (imagesToUpload && imagesToUpload.length > 0) {
          const uploadPromises = imagesToUpload.map(imageObject => {
            const imageFile = imageObject.file
            if (!imageFile) return Promise.resolve(null)

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
