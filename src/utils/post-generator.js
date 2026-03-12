import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import { categories, costRange, emotionTags, recoveryTimeOptions } from '@/models/categories'
import { noAvatar } from '@/models/no-data'
import { useAuthStore } from '@/stores/auth'

const collection_db = import.meta.env.VITE_POST_COLLECTION

// Helper to get a random element from an array
const getRandomElement = arr => arr[Math.floor(Math.random() * arr.length)]

// Helper to get a random subset of an array
function getRandomSubset (arr, max = 3) {
  const shuffled = [...arr].toSorted(() => 0.5 - Math.random())
  const size = Math.floor(Math.random() * (max + 1))
  return shuffled.slice(0, size)
}

export async function generateRandomPost () {
  const authStore = useAuthStore()
  if (!authStore.user) {
    console.error('User is not authenticated.')
    return
  }

  try {
    const randomCategory = getRandomElement(categories)
    const randomEmotionTags = getRandomSubset(emotionTags) // Now returns max 3 full objects
    const randomRecoveryTime = getRandomElement(recoveryTimeOptions)
    const randomCost = getRandomElement(costRange)

    const postData = {
      stepOne: {
        selectedCategories: [{ id: randomCategory.id, label: randomCategory.label }],
      },
      stepTwo: {
        title: `Random Post Title #${Math.floor(Math.random() * 1000)}`,
        description: 'This is a randomly generated post description to test the feed and filtering functionality.',
        date: new Date(),
        whatWentWrong: 'A series of unfortunate events occurred.',
        howDidItFeel: 'It was a rollercoaster of emotions.',
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
        scheduleDate: null,
        triggerTags: [],
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
