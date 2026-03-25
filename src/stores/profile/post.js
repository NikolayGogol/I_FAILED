import { deleteDoc, doc, getDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db, storage, ref } from '@/firebase.js'
import { deleteObject } from 'firebase/storage'

export const usePostStore = defineStore('post', {
  actions: {
    async deletePost (postId) {
      try {
        const postRef = doc(db, 'posts', postId)
        const postSnap = await getDoc(postRef)
        const data = postSnap.exists() ? postSnap.data() : null

        // URL shape: https://.../o/<encodedPath>?alt=media&token=...
        const getStorageRefFromDownloadURL = (downloadURL) => {
          if (typeof downloadURL !== 'string') return null
          const match = downloadURL.match(/\/o\/([^?]+)/)
          if (!match) return null
          const encodedPath = match[1]
          const decodedPath = decodeURIComponent(encodedPath.replace(/\+/g, '%20'))
          return ref(storage, decodedPath)
        }

        // Delete images from Storage (thumb/full) if present in Firestore.
        const images = Array.isArray(data?.images) ? data.images : []
        const urls = new Set()
        for (const img of images) {
          if (!img) continue
          if (typeof img.thumb === 'string') urls.add(img.thumb)
          if (typeof img.full === 'string') urls.add(img.full)
        }

        const deleteOps = Array.from(urls).map(url => {
          if (typeof url !== 'string' || url.length === 0) return Promise.resolve()
          try {
            if (url.startsWith('http')) {
              const storageRef = getStorageRefFromDownloadURL(url)
              return storageRef ? deleteObject(storageRef) : Promise.resolve()
            }

            // Fallback: treat as storage path.
            return deleteObject(ref(storage, url))
          } catch {
            return Promise.resolve()
          }
        })

        await Promise.allSettled(deleteOps)

        await deleteDoc(postRef)
        return true
      } catch (error) {
        console.error('Error deleting post:', error)
        return false
      }
    },
  },
})
