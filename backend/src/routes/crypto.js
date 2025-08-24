const express = require('express');
const {
  getVolumeComparison,
  getTrendingCoins,
  searchCoins,
  getMarketOverview
} = require('../controllers/cryptoController');

const router = express.Router();

router.get('/volume-comparison/:coinId', getVolumeComparison);
router.get('/trending', getTrendingCoins);
router.get('/search/:query', searchCoins);
router.get('/market', getMarketOverview);

module.exports = router;