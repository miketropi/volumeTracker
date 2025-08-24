const coinGeckoService = require('../services/coinGeckoService');
const cacheService = require('../services/cacheService');
const { CACHE_KEYS } = require('../config/cache');

const getVolumeLeaders = async (req, res, next) => {
  try {
    const { type = 'gainers', limit = 10 } = req.query;
    const cacheKey = `volume_leaders:${type}:${limit}`;

    const data = await cacheService.getOrSet(
      cacheKey,
      async () => {
        const marketData = await coinGeckoService.getMarketData({ per_page: 250 });
        const volumeComparisons = coinGeckoService.calculateVolumeComparison(marketData);

        const sortedData = volumeComparisons.sort((a, b) => {
          if (type === 'gainers') {
            return b.volume_change_7d_to_30d - a.volume_change_7d_to_30d;
          } else {
            return a.volume_change_7d_to_30d - b.volume_change_7d_to_30d;
          }
        });

        return {
          type: type,
          coins: sortedData.slice(0, parseInt(limit)),
          generated_at: new Date().toISOString()
        };
      },
      'MARKET_DATA'
    );

    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getVolumeAnalytics = async (req, res, next) => {
  try {
    const cacheKey = 'volume_analytics_overview';

    const data = await cacheService.getOrSet(
      cacheKey,
      async () => {
        const marketData = await coinGeckoService.getMarketData({ per_page: 250 });
        const volumeComparisons = coinGeckoService.calculateVolumeComparison(marketData);

        const totalVolume24h = volumeComparisons.reduce((sum, coin) => sum + coin.volume_24h, 0);
        const totalVolume7d = volumeComparisons.reduce((sum, coin) => sum + coin.estimated_volume_7d, 0);
        const totalVolume30d = volumeComparisons.reduce((sum, coin) => sum + coin.estimated_volume_30d, 0);
        const totalMarketCap = volumeComparisons.reduce((sum, coin) => sum + coin.market_cap, 0);

        const avgVolumeChange = volumeComparisons.reduce((sum, coin) => sum + coin.volume_change_7d_to_30d, 0) / volumeComparisons.length;
        const avgVolumeToMcapRatio = volumeComparisons.reduce((sum, coin) => sum + coin.volume_to_mcap_ratio, 0) / volumeComparisons.length;

        const volumeDistribution = {
          ultra_high_volume: volumeComparisons.filter(coin => coin.volume_24h > 10000000000).length,
          very_high_volume: volumeComparisons.filter(coin => coin.volume_24h > 1000000000 && coin.volume_24h <= 10000000000).length,
          high_volume: volumeComparisons.filter(coin => coin.volume_24h > 100000000 && coin.volume_24h <= 1000000000).length,
          medium_volume: volumeComparisons.filter(coin => coin.volume_24h > 10000000 && coin.volume_24h <= 100000000).length,
          low_volume: volumeComparisons.filter(coin => coin.volume_24h > 1000000 && coin.volume_24h <= 10000000).length,
          very_low_volume: volumeComparisons.filter(coin => coin.volume_24h <= 1000000).length
        };

        const liquidityDistribution = {
          excellent: volumeComparisons.filter(coin => coin.liquidity_score >= 9).length,
          very_good: volumeComparisons.filter(coin => coin.liquidity_score >= 7 && coin.liquidity_score < 9).length,
          good: volumeComparisons.filter(coin => coin.liquidity_score >= 5 && coin.liquidity_score < 7).length,
          fair: volumeComparisons.filter(coin => coin.liquidity_score >= 3 && coin.liquidity_score < 5).length,
          poor: volumeComparisons.filter(coin => coin.liquidity_score < 3).length
        };

        return {
          market_summary: {
            total_volume_24h: totalVolume24h,
            estimated_total_volume_7d: totalVolume7d,
            estimated_total_volume_30d: totalVolume30d,
            total_market_cap: totalMarketCap,
            volume_to_mcap_ratio: totalMarketCap > 0 ? (totalVolume24h / totalMarketCap) * 100 : 0,
            average_volume_change: avgVolumeChange,
            average_volume_to_mcap_ratio: avgVolumeToMcapRatio,
            coins_analyzed: volumeComparisons.length
          },
          volume_distribution: volumeDistribution,
          liquidity_distribution: liquidityDistribution,
          top_volume_gainers: volumeComparisons
            .filter(coin => coin.volume_change_7d_to_30d > 0)
            .sort((a, b) => b.volume_change_7d_to_30d - a.volume_change_7d_to_30d)
            .slice(0, 10),
          top_volume_losers: volumeComparisons
            .filter(coin => coin.volume_change_7d_to_30d < 0)
            .sort((a, b) => a.volume_change_7d_to_30d - b.volume_change_7d_to_30d)
            .slice(0, 10),
          highest_liquidity: volumeComparisons
            .sort((a, b) => b.liquidity_score - a.liquidity_score)
            .slice(0, 10),
          lowest_liquidity: volumeComparisons
            .sort((a, b) => a.liquidity_score - b.liquidity_score)
            .slice(0, 10),
          highest_volume_24h: volumeComparisons
            .sort((a, b) => b.volume_24h - a.volume_24h)
            .slice(0, 10)
        };
      },
      'MARKET_DATA'
    );

    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getDetailedVolumeAnalysis = async (req, res, next) => {
  try {
    const { coinIds } = req.query;
    
    if (!coinIds) {
      return res.status(400).json({ error: 'coinIds parameter is required' });
    }

    const coinIdArray = coinIds.split(',').slice(0, 10); // Limit to 10 coins
    const cacheKey = `detailed_volume_analysis:${coinIds}`;

    const data = await cacheService.getOrSet(
      cacheKey,
      async () => {
        const detailedData = await coinGeckoService.getDetailedVolumeData(coinIdArray);
        return {
          coins: detailedData,
          analysis_timestamp: new Date().toISOString(),
          coin_count: detailedData.length
        };
      },
      'COIN_DATA'
    );

    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVolumeLeaders,
  getVolumeAnalytics,
  getDetailedVolumeAnalysis
};