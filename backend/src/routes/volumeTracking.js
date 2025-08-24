const express = require('express');
const {
  getDailyVolumeTracking,
  getVolumeSpikes,
  getMultipleCoinVolumeTracking,
  getVolumeHeatmap
} = require('../controllers/volumeTrackingController');

const router = express.Router();

// Get daily volume tracking for a specific coin
// GET /api/volume-tracking/:coinId?days=30
router.get('/:coinId', getDailyVolumeTracking);

// Get volume spikes for a specific coin
// GET /api/volume-tracking/:coinId/spikes?days=30&intensity=moderate
router.get('/:coinId/spikes', getVolumeSpikes);

// Get volume heatmap for calendar visualization
// GET /api/volume-tracking/:coinId/heatmap?days=30
router.get('/:coinId/heatmap', getVolumeHeatmap);

// Get volume tracking for multiple coins
// GET /api/volume-tracking/multi/coins?coinIds=bitcoin,ethereum&days=7
router.get('/multi/coins', getMultipleCoinVolumeTracking);

module.exports = router;