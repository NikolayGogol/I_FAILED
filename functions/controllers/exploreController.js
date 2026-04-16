const admin = require('firebase-admin')

exports.filterPosts = async (req, res) => {
  try {
    const { categories, emojiTags, recoveryTime, costRange, postedBy, searchText } = req.body
    let postsRef = admin.firestore().collection('posts')

    // Apply filters based on the request body
    if (categories && categories.length > 0) {
      const categoryIds = categories.map(cat => cat.id)
      postsRef = postsRef.where('category.id', 'in', categoryIds)
    }

    if (emojiTags && emojiTags.length > 0) {
      const emojiTagValues = emojiTags.map(tag => tag.value)
      postsRef = postsRef.where('emojiTags', 'array-contains-any', emojiTagValues)
    }

    if (recoveryTime && recoveryTime.length > 0) {
      // Assuming recoveryTime has a 'days' property for range filtering
      // This will need more complex logic if it's a range, for now, let's assume exact match or a single value
      // For a range, you'd need to query twice or structure your data differently
      // For simplicity, let's assume we are looking for posts with recoveryTime matching one of the provided values
      const recoveryTimeValues = recoveryTime.map(rt => rt.value)
      postsRef = postsRef.where('recoveryTime.value', 'in', recoveryTimeValues)
    }

    if (costRange && costRange.length > 0) {
      // This is also complex for Firestore as range queries can only be on a single field.
      // For now, let's assume we are looking for posts with costRange matching one of the provided values
      const costRangeValues = costRange.map(cr => cr.value)
      postsRef = postsRef.where('costRange.value', 'in', costRangeValues)
    }

    if (postedBy && postedBy !== 'all') {
      postsRef = postsRef.where('postedBy', '==', postedBy)
    }

    // For searchText, Firestore doesn't support full-text search directly.
    // You would typically use a third-party search service like Algolia or ElasticSearch.
    // For a basic implementation, you might fetch all results and filter in memory,
    // but this is not scalable for large datasets.
    // For now, I'll omit searchText filtering in Firestore query.
    // If you need full-text search, consider integrating a dedicated search solution.

    const snapshot = await postsRef.get()
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // If searchText is provided, filter in memory (not scalable for large datasets)
    let filteredPosts = posts
    if (searchText) {
      const lowerCaseSearchText = searchText.toLowerCase()
      filteredPosts = posts.filter(post => {
        const titleMatches = post.title && post.title.toLowerCase().includes(lowerCaseSearchText)
        const descriptionMatches = post.description && post.description.toLowerCase().includes(lowerCaseSearchText)
        return titleMatches || descriptionMatches
      })
    }

    res.status(200).json(filteredPosts)
  } catch (error) {
    console.error('Error filtering posts:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
