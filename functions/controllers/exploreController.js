const admin = require('firebase-admin')

exports.filterPosts = async (req, res) => {
  try {
    const { categories, emojiTags, recoveryTime, costRange, postedBy, searchText } = req.body

    let filteredPosts = []
    let filteredUsers = []

    // --- User Search ---
    if (searchText) {
      const lowerCaseSearchText = searchText.toLowerCase()
      const usersSnapshot = await admin.firestore().collection('users').get()
      filteredUsers = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user =>
          (user.displayName && user.displayName.toLowerCase().includes(lowerCaseSearchText))
          || (user.username && user.username.toLowerCase().includes(lowerCaseSearchText)),
        )
    }

    // --- Post Search & Filtering ---
    const hasComplexFilters = (categories && categories.length > 0)
      || (emojiTags && emojiTags.length > 0)
      || (costRange && costRange.length > 0)
      || searchText // searchText also forces in-memory filtering

    if (hasComplexFilters) {
      // Fetch all posts and filter in memory for complex filters or searchText
      const allPostsSnapshot = await admin.firestore().collection('posts').get()
      const allPosts = allPostsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      filteredPosts = allPosts.filter(post => {
        // 1. SearchText match (if present)
        if (searchText) {
          const lowerCaseSearchText = searchText.toLowerCase()
          const textMatch = (post.title && post.title.toLowerCase().includes(lowerCaseSearchText))
            || (post.whatHappened && post.whatHappened.toLowerCase().includes(lowerCaseSearchText))
          if (!textMatch) {
            return false
          }
        }

        // 2. Categories filter (post.selectedCategories is an array of objects)
        if (categories && categories.length > 0) {
          const categoryIds = new Set(categories.map(cat => cat.id))
          if (!post.selectedCategories || !post.selectedCategories.some(sc => categoryIds.has(sc.id))) {
            return false
          }
        }

        // 3. EmojiTags filter (maps to post.tags, which is an array of strings)
        if (emojiTags && emojiTags.length > 0) {
          const emojiTagValues = new Set(emojiTags.map(tag => tag.value))
          if (!post.tags || !post.tags.some(postTag => emojiTagValues.has(postTag))) {
            return false
          }
        }

        // 4. RecoveryTime filter (post.recoveryTime is an object with a 'value' field)
        if (recoveryTime && recoveryTime.length > 0) {
          const recoveryTimeValues = recoveryTime.map(rt => rt.value)
          if (!post.recoveryTime || !recoveryTimeValues.includes(post.recoveryTime.value)) {
            return false
          }
        }

        // 5. CostRange filter (post.lessonLearned.cost is a number)
        if (costRange && costRange.length > 0) {
          const postCost = post.lessonLearned && post.lessonLearned.cost
          if (typeof postCost !== 'number') {
            return false
          } // Post must have a numeric cost

          let costMatches = false
          for (const rangeFilter of costRange) {
            const rangeValue = rangeFilter.value // e.g., "100-1000", "1k-5k"
            const parts = rangeValue.split('-')

            const parseValue = val => {
              if (typeof val !== 'string') {
                return Number.parseFloat(val)
              }
              if (val.toLowerCase().endsWith('k')) {
                return Number.parseFloat(val.slice(0, -1)) * 1000
              } else if (val.toLowerCase().endsWith('m')) {
                return Number.parseFloat(val.slice(0, -1)) * 1_000_000
              }
              return Number.parseFloat(val)
            }

            const min = parseValue(parts[0])
            const max = parts[1] ? parseValue(parts[1]) : Infinity // Handle "100-" or "100-infinity"

            if (postCost >= min && postCost <= max) {
              costMatches = true
              break
            }
          }
          if (!costMatches) {
            return false
          }
        }

        // 6. PostedBy filter (maps to post.uid)
        if (postedBy && postedBy !== 'all' && post.uid !== postedBy) {
          return false
        }

        return true // Passed all checks
      })
    } else {
      // No complex filters or searchText, use Firestore queries for simple filters
      let postsRef = admin.firestore().collection('posts')

      if (recoveryTime && recoveryTime.length > 0) {
        postsRef = postsRef.where('recoveryTime.value', 'in', recoveryTime.map(rt => rt.value))
      }
      if (postedBy && postedBy !== 'all') {
        postsRef = postsRef.where('uid', '==', postedBy) // Assuming postedBy refers to uid
      }

      const snapshot = await postsRef.get()
      filteredPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }

    res.status(200).json({ posts: filteredPosts, users: filteredUsers })
  } catch (error) {
    console.error('Error filtering posts:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
