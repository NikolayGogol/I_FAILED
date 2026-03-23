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

    return ranges.some(rv => {
      const r = normalizeString(rv)
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

  // 1) postedBy
  if (postedBy) {
    // In the UI, `postedBy` values are:
    // - 'anonymous' => only anonymous posts
    // - 'public' => only non-anonymous posts
    if (postedBy === 'anonymous') {
      if (!postData?.isAnonymous) {
        return false
      }
    } else if (postedBy === 'public') {
      if (postData?.isAnonymous) {
        return false
      }
    } else {
      // Fallback: if someone passes a uid, match by uid.
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

    const match = emojiTags.some(tagVal => postEmotionValues.has(normalizeString(tagVal)))
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

    const match = recoveryTime.some(rv => normalizeString(rv) === normalizeString(postRecoveryVal))
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

exports.queryPostsFeed = async (req, res) => {
  try {
    const {
      tab,
      pageSize,
      cursor,
      filters,
    } = req.body || {}

    const effectivePageSize = Math.max(1, Number(pageSize) || 10)
    const activeTab = tab || 'latest'

    const POST_COLLECTION = process.env.POST_COLLECTION
    const postsRef = db.collection(POST_COLLECTION)

    // We only sort by a single field here to avoid Firestore's composite index requirements.
    // All other filter types are evaluated in memory.
    const orderField = activeTab === 'popular' ? 'views' : 'createdAt'
    const orderDirection = 'desc'

    // How many documents we pull per Firestore request.
    // We fetch more than `effectivePageSize` because many candidates may not match filters.
    const batchLimit = Math.min(100, Math.max(30, effectivePageSize * 5))

    // Cap the scan to prevent very expensive calls when filters are restrictive.
    const maxBatches = 10

    // Cursor is the last document id from the previous page.
    // We implement the cursor via `startAfter(cursorDocSnap)` (not by result count).
    let cursorDocSnap = null
    if (cursor) {
      const cursorDoc = await postsRef.doc(cursor).get()
      cursorDocSnap = cursorDoc.exists ? cursorDoc : null
    }

    // Final filtered results returned to the client.
    const results = []
    let lastDocId = null

    // Indicates if there might be more matches after the returned page.
    let hasMore = false

    // We keep scanning subsequent pages from Firestore until we collect enough matches,
    // or until we determine the Firestore feed is exhausted.
    for (let batches = 0; batches < maxBatches; batches++) {
      let q = postsRef.orderBy(orderField, orderDirection).limit(batchLimit)
      if (cursorDocSnap) {
        q = q.startAfter(cursorDocSnap)
      }

      const snapshot = await q.get()
      if (snapshot.empty) {
        break
      }

      // We must track the last DOCUMENT we actually processed.
      // Otherwise we can skip candidate documents and the next page becomes "empty".
      for (let i = 0; i < snapshot.docs.length; i++) {
        const docSnap = snapshot.docs[i]
        const data = docSnap.data() || {}
        if (matchesFilters(data, filters)) {
          results.push({ id: docSnap.id, ...data })
          lastDocId = docSnap.id
          // We only stop scanning once we have enough matches.
          // Cursor will point to the last analyzed docSnap, not to the last doc in snapshot.
          if (results.length >= effectivePageSize) {
            // If we still have docs left after the cursor in this same Firestore batch,
            // there could be more matches, so we keep `hasMore=true`.
            const moreDocsAfterCursorInThisBatch = i < snapshot.docs.length - 1
            hasMore = moreDocsAfterCursorInThisBatch || snapshot.size === batchLimit
            break
          }
        } else {
          lastDocId = docSnap.id
        }
      }

      if (results.length >= effectivePageSize) {
        break
      }

      // Prepare cursor for the next batch scan.
      // Cursor points to the last doc in the batch, not only the last matching doc.
      // This lets the next request resume correctly in the Firestore ordering.
      cursorDocSnap = snapshot.docs.at(-1) || null

      // If the snapshot isn't full, Firestore likely reached the end of the feed.
      hasMore = snapshot.size === batchLimit
      if (!hasMore) {
        break
      }
    }

    res.status(200).json({
      posts: results,
      nextCursorDocId: lastDocId,
      hasMore,
    })
  } catch (error) {
    console.error('queryPostsFeed error:', error)
    res.status(500).json({
      posts: [],
      nextCursorDocId: null,
      hasMore: false,
      error: error?.message || String(error),
    })
  }
}
