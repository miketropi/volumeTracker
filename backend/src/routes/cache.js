const express = require('express');
const {
  getCacheStatus,
  flushCache,
  getCacheKeys,
  deleteCache,
  testCache
} = require('../controllers/cacheController');

const router = express.Router();

// Get cache status and health info
router.get('/status', getCacheStatus);

// Test cache functionality
router.get('/test', testCache);

// Get cache keys (with optional pattern filter)
// GET /api/cache/keys?pattern=volume_*
router.get('/keys', getCacheKeys);

// Flush all cache (use with caution)
router.delete('/flush', flushCache);

// Delete specific cache key
router.delete('/key/:key', deleteCache);

module.exports = router;