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
    const randomEmotionTags = getRandomSubset(emotionTags)
    const randomRecoveryTime = getRandomElement(recoveryTimeOptions)
    const randomCost = getRandomElement(costRange)

    const postData = {
      stepOne: { selectedCategories: [randomCategory] },
      stepTwo: {
        title: `Random Post Title #${Math.floor(Math.random() * 1000)}`,
        description: 'This is a randomly generated post description to test the feed and filtering functionality.',
        date: new Date(),
        images: [],
      },
      stepThree: {
        whatILearned: 'Many valuable lessons were learned.',
        keyTakeaways: 'Resilience is key.',
        whatIdDoDifferently: 'Approach the situation with more caution.',
        advice: 'Always have a backup plan.',
      },
      stepFour: {
        cost: randomCost,
        recoveryTime: randomRecoveryTime,
        emotionTags: randomEmotionTags,
        tags: ['random', 'generated', 'test'],
      },
      stepFive: {
        isAnonymous: Math.random() > 0.5,
        visibility: 'Public',
        allowComments: true,
        enableTriggerWarning: false,
        triggerTags: [],
        scheduleDate: null,
      },
      createdAt: serverTimestamp(),
      status: 'published',
      publishedAt: serverTimestamp(),
      uid: authStore.user.uid,
      user: {
        displayName: authStore.user.displayName,
        photoURL: authStore.user.photoURL || noAvatar,
      },
      likes: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 50),
      views: Math.floor(Math.random() * 1000),
      likedBy: [],
    }

    if (postData.stepFive.isAnonymous) {
      postData.user.displayName = 'Anonymous'
      postData.user.photoURL = noAvatar
    }

    await addDoc(collection(db, collection_db), postData)
    console.log('Random post generated successfully!')
  } catch (error) {
    console.error('Error generating random post:', error)
  }
}
