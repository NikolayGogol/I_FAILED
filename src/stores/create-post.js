import { addDoc, collection } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { useFirestore } from 'vuefire'
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
      images: [],
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
        createAt: new Date(),
        uid: authStore.user?.uid,
        user: {
          displayName: authStore.user?.displayName,
          photoURL: authStore.user?.photoURL,
        },
      }
      console.log(obj2send)
      try {
        return await addDoc(collection(db, collection_db), obj2send)
      } catch (error) {
        return `Error adding document:', ${error}`
      }
    },
    async createPost () {
      const authStore = useAuthStore()
      const db = useFirestore()
      const obj2send = {
        stepOne: this.stepOne,
        stepTwo: { ...this.stepTwo, images: [] }, // Exclude raw File objects
        stepThree: this.stepThree,
        stepFour: this.stepFour,
        stepFive: this.stepFive,
        createAt: new Date(),
        uid: authStore.user?.uid,
        user: {
          displayName: authStore.user?.displayName,
          photoURL: authStore.user?.photoURL,
        },
      }
      console.log(obj2send)
      try {
        return await addDoc(collection(db, collection_db), obj2send)
      } catch (error) {
        return `Error adding document:', ${error}`
      }
    },
  },
})
