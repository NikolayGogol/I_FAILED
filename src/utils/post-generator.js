import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import { categories, recoveryTimeOptions, emotionTags, costRange } from '@/models/categories'
import { useAuthStore } from '@/stores/auth'
import { noAvatar } from '@/models/no-data'

const collection_db = import.meta.env.VITE_POST_COLLECTION

// Helper to get a random element from an array
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)]

// Helper to get a random subset of an array
const getRandomSubset = (arr, max = 3) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  const size = Math.floor(Math.random() * (max + 1))
  return shuffled.slice(0, size)
}

export const generateRandomPost = async () => {
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
      description: 'This is a randomly generated post description to test the feed and filtering functionality.',
      date: new Date(),
      images: [],
      isAnonymous,
      visibility: 'Public',
      allowComments: true,
      enableTriggerWarning: false,
      triggerTags: [],
      createdAt: serverTimestamp(),
      status: 'published',
      publishedAt: serverTimestamp(),
      uid: authStore.user.uid,
      user: {
        displayName: isAnonymous ? 'Anonymous' : authStore.user.displayName,
        photoURL: isAnonymous ? noAvatar : authStore.user.photoURL || noAvatar,
      },
    }

    await addDoc(collection(db, collection_db), postData)
    console.log('Random post generated successfully!')
  } catch (error) {
    console.error('Error generating random post:', error)
  }
}
