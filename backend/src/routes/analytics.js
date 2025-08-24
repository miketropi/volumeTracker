const express = require('express');
const {
  getVolumeLeaders,
  getVolumeAnalytics,
  getDetailedVolumeAnalysis
} = require('../controllers/analyticsController');

const router = express.Router();

router.get('/volume-leaders', getVolumeLeaders);
router.get('/volume-analytics', getVolumeAnalytics);
router.get('/detailed-volume-analysis', getDetailedVolumeAnalysis);

module.exports = router;