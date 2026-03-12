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
    // These fields are not in the new form, but keeping them for the createPost logic
    whatILearned: '',
    keyTakeaways: '',
    whatIdDoDifferently: '',
    advice: '',
    cost: '',
    recoveryTime: null,
    emotionTags: [],
    tags: [],
    scheduleDate: null,
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
      this.whatILearned = ''
      this.keyTakeaways = ''
      this.whatIdDoDifferently = ''
      this.advice = ''
      this.cost = ''
      this.recoveryTime = null
      this.emotionTags = []
      this.tags = []
      this.scheduleDate = null
    },
    async createPost () {
      const authStore = useAuthStore()
      if (!authStore.user) {
        return { success: false, error: 'User is not authenticated.' }
      }

      const postData = {
        stepOne: { selectedCategories: this.selectedCategories ? [this.selectedCategories] : [] },
        stepTwo: {
          title: this.title,
          description: this.whatHappened,
          date: this.whenHappened,
          images: [], // Placeholder
        },
        // Assuming default/empty values for steps 3 and 4 as they are not in the new form
        stepThree: {
          whatILearned: this.whatILearned,
          keyTakeaways: this.keyTakeaways,
          whatIdDoDifferently: this.whatIdDoDifferently,
          advice: this.advice,
        },
        stepFour: {
          cost: this.cost,
          recoveryTime: this.recoveryTime,
          emotionTags: this.emotionTags,
          tags: this.tags,
        },
        stepFive: {
          isAnonymous: this.isAnonymous,
          visibility: this.visibility,
          allowComments: this.allowComments,
          enableTriggerWarning: this.enableTriggerWarning,
          triggerTags: this.triggerTags,
          scheduleDate: this.scheduleDate,
        },
        createdAt: serverTimestamp(),
        status: this.scheduleDate ? 'scheduled' : 'published',
        scheduledAt: this.scheduleDate ? new Date(this.scheduleDate) : null,
        publishedAt: this.scheduleDate ? null : serverTimestamp(),
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
          await updateDoc(docRef, { 'stepTwo.images': imageUrls })
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
