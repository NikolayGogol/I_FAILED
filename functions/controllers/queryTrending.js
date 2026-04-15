const admin = require('firebase-admin')

const db = admin.firestore()

function normalizeString (v) {
  if (v === undefined || v === null) {
    return ''
  }
  return String(v).trim().toLowerCase()
}

function parseCost (v) {
  if (v === undefined || v === null || v === '') {
    return null
  }
  if (typeof v === 'number' && !Number.isNaN(v)) {
    return v
  }
  const direct = Number(v)
  if (!Number.isNaN(direct)) {
    return direct
  }
  const cleaned = String(v).replace(/[^0-9.]/g, '')
  if (!cleaned) {
    return null
  }
  const parsed = Number(cleaned)
  return Number.isNaN(parsed) ? null : parsed
}

function buildCostPredicate (costRange) {
  const ranges = Array.isArray(costRange) ? costRange : []
  return costNum => {
    if (costNum === null) {
      return false
    }

    return ranges.some(range => {
      const r = normalizeString(range?.value ?? range)
      if (r === 'free') {
        return costNum <= 0
      }
      if (r === '<100') {
        return costNum > 0 && costNum < 100
      }
      if (r === '100-1000') {
        return costNum >= 100 && costNum <= 1000
      }
      if (r === '1000-5000') {
        return costNum >= 1000 && costNum <= 5000
      }
      if (r === '>5000') {
        return costNum > 5000
      }
      return false
    })
  }
}

// eslint-disable-next-line complexity
function matchesFilters (postData, filters) {
  const f = filters || {}

  const categories = Array.isArray(f.categories) ? f.categories : []
  const emojiTags = Array.isArray(f.emojiTags) ? f.emojiTags : []
  const recoveryTime = Array.isArray(f.recoveryTime) ? f.recoveryTime : []
  const costRange = Array.isArray(f.costRange) ? f.costRange : []
  const postedBy = f.postedBy || null
  const searchText = normalizeString(f.searchText)

  // Search Text
  if (searchText) {
    const searchableText = [
      postData?.title,
      postData?.lessonLearned?.story,
    ].map(element => normalizeString(element)).join(' ')

    if (!searchableText.includes(searchText)) {
      return false
    }
  }

  // 1) postedBy
  if (postedBy) {
    if (postedBy === 'anonymous') {
      if (!postData?.isAnonymous) {
        return false
      }
    } else if (postedBy === 'public') {
      if (postData?.isAnonymous) {
        return false
      }
    } else {
      if (normalizeString(postData?.uid) !== normalizeString(postedBy)) {
        return false
      }
    }
  }

  // 2) categories
  if (categories.length > 0) {
    const postCats = Array.isArray(postData?.selectedCategories) ? postData.selectedCategories : []
    let matched = false

    for (const filterCat of categories) {
      const filterId = normalizeString(filterCat?.id ?? filterCat)
      const filterLabel = normalizeString(filterCat?.label ?? '')

      if (!filterId && !filterLabel) {
        continue
      }

      for (const pc of postCats) {
        if (typeof pc === 'string') {
          const p = normalizeString(pc)
          if (p === filterId || p === filterLabel) {
            matched = true
            break
          }
        } else {
          const postId = normalizeString(pc?.id ?? pc?.categoryId ?? pc?.value)
          const postLabel = normalizeString(pc?.label ?? pc?.categoryLabel)
          if (postId === filterId || postLabel === filterLabel) {
            matched = true
            break
          }
        }
      }
      if (matched) {
        break
      }
    }

    if (!matched) {
      return false
    }
  }

  // 3) emojiTags
  if (emojiTags.length > 0) {
    const postEmotionValues = new Set((Array.isArray(postData?.emotionTags) ? postData.emotionTags : [])
      .map(t => (typeof t === 'string' ? t : (t?.value ?? t?.label ?? '')))
      .map(element => normalizeString(element)))

    const match = emojiTags.some(tag => postEmotionValues.has(normalizeString(tag?.value ?? tag)))
    if (!match) {
      return false
    }
  }

  // 4) recoveryTime
  if (recoveryTime.length > 0) {
    const postRecovery = postData?.lessonLearned?.recoveryTime
    const postRecoveryVal = typeof postRecovery === 'string'
      ? postRecovery
      : (postRecovery?.value ?? postRecovery?.title ?? '')

    const match = recoveryTime.some(rt => normalizeString(rt?.value ?? rt) === normalizeString(postRecoveryVal))
    if (!match) {
      return false
    }
  }

  // 5) costRange
  if (costRange.length > 0) {
    const costNum = parseCost(postData?.lessonLearned?.cost)
    const costPred = buildCostPredicate(costRange)
    if (!costPred(costNum)) {
      return false
    }
  }

  return true
}

exports.queryPostsExplore = async (req, res) => {
  try {
    const { pageSize, cursor, filters } = req.body || {}
    const effectivePageSize = Math.max(1, Number(pageSize) || 3)
    const page = Number(cursor) || 1

    const POST_COLLECTION = process.env.POST_COLLECTION
    const postsRef = db.collection(POST_COLLECTION)

    // Fetch a pool of potential trending candidates, ordered by views as a baseline
    const batchLimit = 100
    const maxBatches = 10
    const candidates = []
    let lastDocSnap = null

    for (let i = 0; i < maxBatches; i++) {
      let query = postsRef.orderBy('views', 'desc').limit(batchLimit)
      if (lastDocSnap) {
        query = query.startAfter(lastDocSnap)
      }

      const snapshot = await query.get()
      if (snapshot.empty) {
        break
      }

      const twentyFourHoursAgoMillis = Date.now() - 24 * 60 * 60 * 1000
      for (const doc of snapshot.docs) {
        const data = doc.data()
        const postTimestamp = data.createdAt
        const isRecent = postTimestamp && postTimestamp.toMillis() >= twentyFourHoursAgoMillis

        if (isRecent && matchesFilters(data, filters)) {
          candidates.push({ id: doc.id, ...data })
        }
      }

      lastDocSnap = snapshot.docs.at(-1)
      if (snapshot.size < batchLimit) {
        break
      }
    }

    // Sort candidates by score (views + bookmarks)
    candidates.sort((a, b) => {
      const scoreA = (a.views || 0) + (a.bookmarks || 0)
      const scoreB = (b.views || 0) + (b.bookmarks || 0)
      return scoreB - scoreA
    })

    // Paginate the sorted results
    const startIndex = (page - 1) * effectivePageSize
    const results = candidates.slice(startIndex, startIndex + effectivePageSize)
    const hasMore = (startIndex + effectivePageSize) < candidates.length
    const nextCursor = hasMore ? String(page + 1) : null

    res.status(200).json({
      posts: results,
      nextCursorDocId: nextCursor,
      hasMore,
    })
  } catch (error) {
    console.error('queryPostsExplore error:', error)
    res.status(500).json({
      posts: [],
      nextCursorDocId: null,
      hasMore: false,
      error: error?.message || String(error),
    })
  }
}
