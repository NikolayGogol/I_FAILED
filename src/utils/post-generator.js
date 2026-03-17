import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import { categories, visibilityList } from '@/models/categories'
import { noAvatar } from '@/models/no-data'
import { useAuthStore } from '@/stores/auth'

const collection_db = import.meta.env.VITE_POST_COLLECTION

// Helper to get a random element from an array
const getRandomElement = arr => arr[Math.floor(Math.random() * arr.length)]

export async function generateRandomPost () {
  const authStore = useAuthStore()
  if (!authStore.user) {
    console.error('User is not authenticated.')
    return
  }

  try {
    const randomCategory = getRandomElement(categories)
    const isAnonymous = Math.random() > 0.5

    const postData = {
      selectedCategories: [randomCategory],
      title: `Random Post Title #${Math.floor(Math.random() * 1000)}`,
      whatHappened: 'This is a randomly generated post description about what happened.',
      whenHappened: new Date().toISOString(),
      whatWentWrong: 'This went wrong.',
      howDidItFeel: 'It felt bad.',
      emotionTags: [],
      tags: [],
      images: [],
      isAnonymous,
      visibility: visibilityList[0],
      allowComments: true,
      enableTriggerWarning: false,
      triggerTags: [],
      createdAt: serverTimestamp(),
      status: 'published',
      scheduledAt: null,
      publishedAt: serverTimestamp(),
      uid: authStore.user.uid,
      user: {
        displayName: isAnonymous ? 'Anonymous' : authStore.user.displayName,
        photoURL: isAnonymous ? noAvatar : authStore.user.photoURL || noAvatar,
      },
      likes: 0,
      comments: 0,
      views: 0,
      likedBy: [],
    }

    await addDoc(collection(db, collection_db), postData)
    console.log('Random post generated successfully!')
  } catch (error) {
    console.error('Error generating random post:', error)
  }
}
