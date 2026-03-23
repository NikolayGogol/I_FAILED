const express = require('express')
const { queryPostsFeed } = require('../controllers/queryPosts')

const router = express.Router()

// Feed endpoint used by the frontend to load posts with filters.
// Intentionally implemented to avoid Firestore composite index explosion:
// we sort by a single field, page, and filter in memory.
router.post('/posts/feed', queryPostsFeed)

module.exports = router
