import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { db } from '@/firebase'

const POSTS_COLLECTION = import.meta.env.VITE_POST_COLLECTION
const DEFAULT_LIMIT = 80

function normalize (value) {
  if (value === undefined || value === null) {
    return ''
  }
  return String(value).trim().toLowerCase()
}

function parseCost (value) {
  if (value === undefined || value === null || value === '') {
    return null
  }
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value
  }
  const parsed = Number(String(value).replace(/[^0-9.]/g, ''))
  return Number.isNaN(parsed) ? null : parsed
}

function toDate (value) {
  if (!value) {
    return null
  }
  if (value.toDate && typeof value.toDate === 'function') {
    return value.toDate()
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function postToSearchText (post) {
  const categories = Array.isArray(post.selectedCategories)
    ? post.selectedCategories.map(cat => typeof cat === 'string' ? cat : (cat?.label || cat?.id || cat?.value || ''))
    : []
  const tags = Array.isArray(post.tags) ? post.tags : []
  const userName = post.user?.displayName || ''
  const recovery = typeof post.lessonLearned?.recoveryTime === 'string'
    ? post.lessonLearned?.recoveryTime
    : (post.lessonLearned?.recoveryTime?.title || post.lessonLearned?.recoveryTime?.value || '')
  const cost = post.lessonLearned?.cost ?? ''
  const postDate = toDate(post.createdAt)
  const dateText = postDate ? postDate.toISOString().slice(0, 10) : ''

  return normalize([
    post.title,
    post.whatHappened,
    post.whatWentWrong,
    post.howDidItFeel,
    post.lessonLearned?.whatILearned,
    post.lessonLearned?.keyTakeaways,
    post.lessonLearned?.whatIdDoDifferently,
    post.lessonLearned?.advice,
    ...categories,
    ...tags,
    userName,
    post.uid,
    recovery,
    cost,
    dateText,
  ].join(' '))
}

function parseSearchQuery (queryText) {
  const text = normalize(queryText)
  const tokens = text.split(/\s+/).filter(Boolean)
  const parsed = {
    terms: [],
    category: [],
    tags: [],
    user: [],
    recovery: [],
    dateFrom: null,
    dateTo: null,
    costMin: null,
    costMax: null,
  }

  for (const token of tokens) {
    if (token.startsWith('cat:') || token.startsWith('category:')) {
      parsed.category.push(token.split(':').slice(1).join(':'))
      continue
    }
    if (token.startsWith('tag:') || token.startsWith('tags:')) {
      parsed.tags.push(token.split(':').slice(1).join(':'))
      continue
    }
    if (token.startsWith('user:')) {
      parsed.user.push(token.split(':').slice(1).join(':'))
      continue
    }
    if (token.startsWith('recovery:')) {
      parsed.recovery.push(token.split(':').slice(1).join(':'))
      continue
    }
    if (token.startsWith('date:')) {
      const raw = token.split(':').slice(1).join(':')
      const [from, to] = raw.split('..')
      parsed.dateFrom = from || null
      parsed.dateTo = to || from || null
      continue
    }
    if (token.startsWith('cost:')) {
      const raw = token.split(':').slice(1).join(':')
      if (raw.includes('..')) {
        const [min, max] = raw.split('..')
        parsed.costMin = parseCost(min)
        parsed.costMax = parseCost(max)
      } else if (raw.startsWith('>=')) {
        parsed.costMin = parseCost(raw.slice(2))
      } else if (raw.startsWith('>')) {
        parsed.costMin = parseCost(raw.slice(1))
      } else if (raw.startsWith('<=')) {
        parsed.costMax = parseCost(raw.slice(2))
      } else if (raw.startsWith('<')) {
        parsed.costMax = parseCost(raw.slice(1))
      } else {
        const exactCost = parseCost(raw)
        parsed.costMin = exactCost
        parsed.costMax = exactCost
      }
      continue
    }
    parsed.terms.push(token)
  }

  return parsed
}

export const useSearchStore = defineStore('search', () => {
  const search = ref('')
  const results = ref([])
  const loading = ref(false)
  const opened = ref(false)
  const error = ref('')

  const hasSearchParams = computed(() => {
    return normalize(search.value) !== ''
  })

  function resetResults () {
    results.value = []
    error.value = ''
  }

  function setOpened (value) {
    opened.value = !!value
  }

  async function searchPosts () {
    if (!hasSearchParams.value) {
      resetResults()
      return
    }

    loading.value = true
    error.value = ''

    const parsed = parseSearchQuery(search.value)

    try {
      const constraints = [orderBy('createdAt', 'desc'), limit(DEFAULT_LIMIT)]
      if (parsed.user.length === 1) {
        constraints.push(where('uid', '==', parsed.user[0]))
      }
      if (parsed.tags.length > 0 && parsed.tags.length <= 10) {
        constraints.push(where('tags', 'array-contains-any', parsed.tags))
      }
      if (parsed.costMin !== null) {
        constraints.push(where('lessonLearned.cost', '>=', parsed.costMin))
      }
      if (parsed.costMax !== null) {
        constraints.push(where('lessonLearned.cost', '<=', parsed.costMax))
      }

      let snap
      try {
        snap = await getDocs(query(collection(db, POSTS_COLLECTION), ...constraints))
      } catch {
        // Fallback for missing composite index in Firestore.
        snap = await getDocs(query(
          collection(db, POSTS_COLLECTION),
          orderBy('createdAt', 'desc'),
          limit(DEFAULT_LIMIT * 2),
        ))
      }

      const list = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))

      results.value = list.filter(post => {
        const fullText = postToSearchText(post)
        const termsMatch = parsed.terms.every(term => fullText.includes(term))
        const categoryMatch = parsed.category.every(cat => fullText.includes(normalize(cat)))
        const tagsMatch = parsed.tags.every(tag => fullText.includes(normalize(tag)))
        const userMatch = parsed.user.every(userToken => fullText.includes(normalize(userToken)))
        const recoveryMatch = parsed.recovery.every(rt => fullText.includes(normalize(rt)))

        const postCost = parseCost(post.lessonLearned?.cost)
        const costMinMatch = parsed.costMin === null || (postCost !== null && postCost >= parsed.costMin)
        const costMaxMatch = parsed.costMax === null || (postCost !== null && postCost <= parsed.costMax)
        const postCreatedAt = toDate(post.createdAt)
        const fromDate = parsed.dateFrom ? new Date(parsed.dateFrom) : null
        const toDateValue = parsed.dateTo ? new Date(parsed.dateTo) : null
        const dateFromMatch = !fromDate || (postCreatedAt && postCreatedAt >= fromDate)
        const dateToMatch = !toDateValue || (postCreatedAt && postCreatedAt <= toDateValue)

        return termsMatch
          && categoryMatch
          && tagsMatch
          && dateFromMatch
          && dateToMatch
          && userMatch
          && recoveryMatch
          && costMinMatch
          && costMaxMatch
      })
    } catch (error_) {
      console.error('Search failed:', error_)
      error.value = 'Failed to search posts'
      results.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    search,
    results,
    loading,
    opened,
    error,
    hasSearchParams,
    resetResults,
    setOpened,
    searchPosts,
  }
})
