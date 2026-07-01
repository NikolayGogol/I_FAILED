import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore'
import { deleteObject } from 'firebase/storage'
import { defineStore } from 'pinia'
import { db, getDownloadURL, ref, storage, uploadBytes } from '@/firebase'
import { noAvatar } from '@/models/no-data.js'
import { useAuthStore } from '@/stores/auth.js'

const VITE_DRAFT_COLLECTION = import.meta.env.VITE_DRAFT_COLLECTION

export const useEditDraftStore = defineStore('editDraft', {
  actions: {
    async getDraftById (id) {
      try {
        const targetCollection = VITE_DRAFT_COLLECTION || 'drafts'
        const docRef = doc(db, targetCollection, id)
        const docSnap = await getDoc(docRef)
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : 'Draft not found.'
      } catch (error) {
        console.error('Error fetching draft:', error)
        return 'Failed to load the draft.'
      }
    },

    async deleteDraft (id) {
      try {
        const targetCollection = VITE_DRAFT_COLLECTION || 'drafts'
        const docRef = doc(db, targetCollection, id)
        await deleteDoc(docRef)
        return { success: true }
      } catch (error) {
        console.error('Error deleting draft:', error)
        return { success: false, error: error.message }
      }
    },

    async updateDraft (docId, payload = {}) {
      const authStore = useAuthStore()
      if (!authStore.user) {
        return { success: false, error: 'User is not authenticated.' }
      }
      if (!docId) {
        return { success: false, error: 'Missing draft id.' }
      }

      const toFirestoreDate = value => {
        if (!value) {
          return null
        }
        if (value instanceof Date) {
          return Number.isNaN(value.getTime()) ? null : value
        }
        if (typeof value === 'string' || typeof value === 'number') {
          const d = new Date(value)
          return Number.isNaN(d.getTime()) ? null : d
        }
        if (typeof value?.toDate === 'function') {
          const d = value.toDate()
          return Number.isNaN(d?.getTime?.()) ? null : d
        }
        if (typeof value?.seconds === 'number') {
          const secondsMs = value.seconds * 1000
          const nanosMs = (value.nanoseconds ?? 0) / 1e6
          const d = new Date(secondsMs + nanosMs)
          return Number.isNaN(d.getTime()) ? null : d
        }
        const d = new Date(value)
        return Number.isNaN(d.getTime()) ? null : d
      }

      const isBlobLike = value => value instanceof File || value instanceof Blob

      const getStorageRefFromPossibleImageValue = imageValue => {
        if (typeof imageValue !== 'string' || imageValue.length === 0) {
          return null
        }
        if (imageValue.startsWith('http')) {
          const match = imageValue.match(/\/o\/([^?]+)/)
          if (!match) {
            return null
          }
          const encodedPath = match[1]
          const decodedPath = decodeURIComponent(encodedPath.replace(/\+/g, '%20'))
          return ref(storage, decodedPath)
        }
        if (imageValue.includes('/')) {
          try {
            return ref(storage, imageValue)
          } catch {
            return null
          }
        }
        return null
      }

      try {
        const targetCollection = VITE_DRAFT_COLLECTION || 'drafts'
        const docRef = doc(db, targetCollection, docId)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          return { success: false, error: 'Draft not found.' }
        }

        const existingData = docSnap.data()
        const existingImages = Array.isArray(existingData.images) ? existingData.images : []

        const scheduleDateRaw = payload.scheduleDate === undefined ? (payload.scheduledAt ?? null) : payload.scheduleDate
        const isScheduled = !!scheduleDateRaw
        const scheduledAtRaw = isScheduled ? toFirestoreDate(scheduleDateRaw) : null
        const scheduledAt = scheduledAtRaw && Number.isNaN(scheduledAtRaw.getTime()) ? null : scheduledAtRaw

        const whenHappened = toFirestoreDate(payload.whenHappened)

        const imagesPayload = await Promise.all((payload.images || []).map(async imageObject => {
          const name = imageObject?.name || 'image'
          const thumbVal = imageObject?.thumb
          const fullVal = imageObject?.full

          const thumbIsFile = isBlobLike(thumbVal)
          const fullIsFile = isBlobLike(fullVal)

          if (typeof thumbVal === 'string' && typeof fullVal === 'string' && !thumbIsFile && !fullIsFile) {
            return { thumb: thumbVal, full: fullVal, name, isNew: false }
          }
          if (!thumbIsFile && !fullIsFile) {
            return null
          }

          let thumbUrl = typeof thumbVal === 'string' ? thumbVal : null
          let fullUrl = typeof fullVal === 'string' ? fullVal : null

          const timestamp = Date.now()
          const uploads = []

          if (thumbIsFile && thumbVal) {
            const thumbStorageRef = ref(storage, `posts/${docId}/${timestamp}_${name}_thumb`)
            uploads.push(
              uploadBytes(thumbStorageRef, thumbVal)
                .then(snapshot => getDownloadURL(snapshot.ref))
                .then(url => {
                  thumbUrl = url
                }),
            )
          }

          if (fullIsFile && fullVal) {
            const fullStorageRef = ref(storage, `posts/${docId}/${timestamp}_${name}_full`)
            uploads.push(
              uploadBytes(fullStorageRef, fullVal)
                .then(snapshot => getDownloadURL(snapshot.ref))
                .then(url => {
                  fullUrl = url
                }),
            )
          }

          await Promise.all(uploads)
          if (!thumbUrl || !fullUrl) {
            return null
          }
          return { thumb: thumbUrl, full: fullUrl, name, isNew: true }
        }))

        const normalizedImages = imagesPayload
          .filter(Boolean)
          .map((img, idx) => ({ ...img, __idx: idx }))
          .toSorted((a, b) => (b.isNew === a.isNew ? a.__idx - b.__idx : (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)))
          .map(({ ...rest }) => rest)

        const selectedCategories = Array.isArray(payload.selectedCategories)
          ? payload.selectedCategories
          : (payload.selectedCategories ? [payload.selectedCategories] : [])

        const getFieldsWithValues = obj => {
          if (!obj) {
            return null
          }
          const cleaned = Object.fromEntries(
            // eslint-disable-next-line
            Object.entries(obj).filter(([_, value]) => {
              if (typeof value === 'boolean') {
                return true
              }
              if (Array.isArray(value)) {
                return value.length > 0
              }
              if (typeof value === 'string') {
                const stripped = value.replace(/(<([^>]+)>)/gi, '').trim()
                if (!stripped) {
                  return false
                }
              }
              return value !== null && value !== undefined && value !== ''
            }),
          )
          return Object.keys(cleaned).length > 0 ? cleaned : null
        }

        const updatedData = {
          selectedCategories,
          title: payload.title,
          whatHappened: payload.whatHappened,
          whenHappened,
          whatWentWrong: payload.whatWentWrong,
          howDidItFeel: payload.howDidItFeel,
          emotionTags: payload.emotionTags,
          tags: payload.tags,
          images: normalizedImages,
          isAnonymous: payload.isAnonymous,
          visibility: payload.visibility,
          allowComments: payload.allowComments,
          enableTriggerWarning: payload.enableTriggerWarning,
          triggerTags: payload.enableTriggerWarning ? payload.triggerTags : [],

          ...(getFieldsWithValues(payload.lessonLearned) && { lessonLearned: getFieldsWithValues(payload.lessonLearned) }),

          status: 'draft',
          scheduledAt: isScheduled ? scheduledAt : null,
          publishedAt: null,

          uid: existingData.uid ?? authStore.user.uid,
          user: {
            displayName: payload.isAnonymous ? 'Anonymous' : authStore.user.displayName,
            photoURL: payload.isAnonymous ? noAvatar : authStore.user.photoURL,
            email: authStore.user.email,
          },
        }

        await updateDoc(docRef, updatedData)

        // Delete removed images from Storage.
        const keepThumbs = new Set(normalizedImages.map(i => i?.thumb).filter(Boolean))
        const keepFulls = new Set(normalizedImages.map(i => i?.full).filter(Boolean))

        const deleteRefs = []
        for (const oldImg of existingImages) {
          const oldThumb = oldImg?.thumb
          const oldFull = oldImg?.full

          if (oldThumb && !keepThumbs.has(oldThumb)) {
            const r = getStorageRefFromPossibleImageValue(oldThumb)
            if (r) {
              deleteRefs.push(r)
            }
          }
          if (oldFull && !keepFulls.has(oldFull)) {
            const r = getStorageRefFromPossibleImageValue(oldFull)
            if (r) {
              deleteRefs.push(r)
            }
          }
        }

        const deleteOps = deleteRefs.map(r => deleteObject(r).catch(error => {
          console.error('Failed deleting storage object:', error)
        }))
        await Promise.allSettled(deleteOps)

        return { success: true, postId: docId }
      } catch (error) {
        console.error('Error updating draft:', error)
        return { success: false, error: error.message }
      }
    },
  },
})
