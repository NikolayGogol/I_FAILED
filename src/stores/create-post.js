import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment, limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db, getDownloadURL, ref, storage, uploadBytes } from '@/firebase'
import { visibilityList } from '@/models/categories.js'
import { noAvatar } from '@/models/no-data.js'
import { useAuthStore } from '@/stores/auth.js'

const collection_db = import.meta.env.VITE_POST_COLLECTION
const VITE_USERS_COLLECTION = import.meta.env.VITE_USERS_COLLECTION
const collection_db_scheduled = import.meta.env.VITE_POST_COLLECTION_SCEDULED
//
export const useCreatePostStore = defineStore('createPost', {
  state: () => ({
    selectedCategories: null,
    title: '',
    whatHappened: '',
    whenHappened: null,
    scheduleDate: null,
    whatWentWrong: null,
    howDidItFeel: null,
    images: [],
    emotionTags: [],
    tags: [],
    suggestedTags: [],
    isAnonymous: false,
    visibility: visibilityList[0],
    allowComments: true,
    enableTriggerWarning: false,
    triggerTags: [],
    lessonLearned: {
      whatILearned: null,
      keyTakeaways: null,
      whatIdDoDifferently: null,
      advice: null,
      recoveryTime: null,
      cost: 0,
    },
  }),
  actions: {
    resetState () {
      this.selectedCategories = null
      this.title = ''
      this.whatHappened = ''
      this.whenHappened = null
      this.scheduleDate = null
      this.whatWentWrong = null
      this.howDidItFeel = null
      this.images = []
      this.emotionTags = []
      this.tags = []
      this.isAnonymous = false
      this.visibility = visibilityList[0]
      this.allowComments = true
      this.enableTriggerWarning = false
      this.triggerTags = []
      this.lessonLearned = {
        whatILearned: null,
        keyTakeaways: null,
        whatIdDoDifferently: null,
        advice: null,
        recoveryTime: null,
        cost: 0,
      }
    },
    async createPost () {
      const authStore = useAuthStore()
      if (!authStore.user) {
        return { success: false, error: 'User is not authenticated.' }
      }
      const scheduleDate = this.scheduleDate
      const isScheduled = !!scheduleDate

      const postData = {
        selectedCategories: this.selectedCategories ? [this.selectedCategories] : [],
        title: this.title,
        whatHappened: this.whatHappened,
        whenHappened: this.whenHappened,
        whatWentWrong: this.whatWentWrong,
        howDidItFeel: this.howDidItFeel,
        emotionTags: this.emotionTags,
        tags: this.tags,
        images: [], // Placeholder
        isAnonymous: this.isAnonymous,
        visibility: this.visibility,
        allowComments: this.allowComments,
        enableTriggerWarning: this.enableTriggerWarning,
        triggerTags: this.triggerTags,
        createdAt: serverTimestamp(),
        status: isScheduled ? 'scheduled' : 'published',
        scheduledAt: isScheduled ? new Date(scheduleDate) : null,
        publishedAt: isScheduled ? null : serverTimestamp(),
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
        const targetCollection = isScheduled ? collection_db_scheduled : collection_db
        const docRef = await addDoc(collection(db, targetCollection), postData)
        const postId = docRef.id

        // Increment user's post count
        const userRef = doc(db, VITE_USERS_COLLECTION, authStore.user.uid)
        await updateDoc(userRef, {
          postCount: increment(1),
        })

        let imageObjects = []
        if (this.images && this.images.length > 0) {
          const uploadPromises = this.images.map(async imageObject => {
            const thumbFile = imageObject.thumb
            const fullFile = imageObject.full

            if (!thumbFile || !fullFile) {
              return null // Return null to be filtered out later
            }

            const timestamp = Date.now()
            const thumbStorageRef = ref(storage, `posts/${postId}/${timestamp}_${imageObject.name}_thumb`)
            const fullStorageRef = ref(storage, `posts/${postId}/${timestamp}_${imageObject.name}_full`)

            // Upload both files concurrently
            const thumbUploadTask = uploadBytes(thumbStorageRef, thumbFile).then(snapshot => getDownloadURL(snapshot.ref))
            const fullUploadTask = uploadBytes(fullStorageRef, fullFile).then(snapshot => getDownloadURL(snapshot.ref))

            const [thumbUrl, fullUrl] = await Promise.all([thumbUploadTask, fullUploadTask])

            return { thumb: thumbUrl, full: fullUrl, name: imageObject.name }
          })

          const resolvedImageObjects = await Promise.all(uploadPromises)
          imageObjects = resolvedImageObjects.filter(obj => obj !== null)
        }

        if (imageObjects.length > 0) {
          await updateDoc(docRef, { images: imageObjects })
        }

        this.resetState()
        return { success: true, postId }
      } catch (error) {
        console.error('Error creating post:', error)
        return { success: false, error: error.message }
      }
    },
    async fetchSuggestedTags () {
      if (this.suggestedTags.length > 0) {
        return
      }
      try {
        const postsRef = collection(db, collection_db)
        const q = query(postsRef, orderBy('createdAt', 'desc'), limit(50))
        const querySnapshot = await getDocs(q)
        const tagsSet = new Set()
        // Correctly iterate over the documents in the snapshot
        for (const doc of querySnapshot.docs) {
          const data = doc.data()
          if (data && data.tags && Array.isArray(data.tags)) {
            for (const tag of data.tags) {
              tagsSet.add(tag)
            }
          }
        }

        this.suggestedTags = Array.from(tagsSet)
      } catch (error) {
        console.error('Error fetching suggested tags:', error)
      }
    },
  },
})
