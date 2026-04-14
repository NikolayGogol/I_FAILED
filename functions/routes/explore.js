const express = require('express')
const { queryPostsExplore } = require('../controllers/queryExplore')

const router = express.Router()

// Feed endpoint used by the frontend to load posts with filters.
// Intentionally implemented to avoid Firestore composite index explosion:
// we sort by a single field, page, and filter in memory.
router.post('/posts/explore', queryPostsExplore)

module.exports = router
