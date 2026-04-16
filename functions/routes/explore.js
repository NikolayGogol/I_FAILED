const express = require('express')
const { filterPosts } = require('../controllers/exploreController')
// Correctly import the 'queryPostsExplore' function that contains the trending logic
const { queryPostsExplore } = require('../controllers/queryTrending')

const router = express.Router()

// Feed endpoint used by the frontend to load posts with filters.
// It now correctly points to the queryPostsExplore controller function.
router.post('/explore/trending', queryPostsExplore)
router.post('/explore/search', filterPosts)

module.exports = router
