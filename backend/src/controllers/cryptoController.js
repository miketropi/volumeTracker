const coinGeckoService = require('../services/coinGeckoService');
const cacheService = require('../services/cacheService');
const { CACHE_KEYS } = require('../config/cache');

const getVolumeComparison = async (req, res, next) => {
  try {
    const { coinId } = req.params;
    const cacheKey = CACHE_KEYS.VOLUME_COMPARISON + `:${coinId}`;

    const data = await cacheService.getOrSet(
      cacheKey,
      async () => {
        const [coinData, historical7d, historical30d] = await Promise.all([
          coinGeckoService.getCoinData(coinId),
          coinGeckoService.getHistoricalData(coinId, 7),
          coinGeckoService.getHistoricalData(coinId, 30)
        ]);

        const volumes7d = historical7d.total_volumes || [];
        const volumes30d = historical30d.total_volumes || [];
        
        const volume7d = volumes7d.reduce((sum, [, volume]) => sum + volume, 0);
        const volume30d = volumes30d.reduce((sum, [, volume]) => sum + volume, 0);
        const volumeChange = volume30d > 0 ? ((volume7d - (volume30d / 4.28)) / (volume30d / 4.28)) * 100 : 0;

        // Calculate additional volume metrics
        const volume24h = coinData.market_data?.total_volume?.usd || 0;
        const marketCap = coinData.market_data?.market_cap?.usd || 0;
        const volumeToMcapRatio = marketCap > 0 ? (volume24h / marketCap) * 100 : 0;
        const liquidityScore = coinGeckoService.calculateLiquidityScore(volume24h, marketCap);
        
        // Calculate volume metrics for detailed analysis
        const volumeMetrics7d = coinGeckoService.calculateVolumeMetrics(volumes7d);
        const volumeMetrics30d = coinGeckoService.calculateVolumeMetrics(volumes30d);

        return {
          coin: {
            id: coinData.id,
            name: coinData.name,
            symbol: coinData.symbol,
            image: coinData.image?.large,
            current_price: coinData.market_data?.current_price?.usd,
            market_cap: marketCap,
            market_cap_rank: coinData.market_cap_rank,
            circulating_supply: coinData.market_data?.circulating_supply,
            total_supply: coinData.market_data?.total_supply,
            max_supply: coinData.market_data?.max_supply
          },
          volume_data: {
            volume_24h: volume24h,
            volume_7d_total: volume7d,
            volume_30d_total: volume30d,
            volume_change_percentage: volumeChange,
            volume_to_mcap_ratio: volumeToMcapRatio,
            liquidity_score: liquidityScore,
            volume_metrics_7d: volumeMetrics7d,
            volume_metrics_30d: volumeMetrics30d
          },
          price_changes: {
            price_change_1h: coinData.market_data?.price_change_percentage_1h,
            price_change_24h: coinData.market_data?.price_change_percentage_24h,
            price_change_7d: coinData.market_data?.price_change_percentage_7d,
            price_change_14d: coinData.market_data?.price_change_percentage_14d,
            price_change_30d: coinData.market_data?.price_change_percentage_30d,
            price_change_200d: coinData.market_data?.price_change_percentage_200d,
            price_change_1y: coinData.market_data?.price_change_percentage_1y
          },
          additional_metrics: {
            ath: coinData.market_data?.ath?.usd,
            ath_change_percentage: coinData.market_data?.ath_change_percentage?.usd,
            atl: coinData.market_data?.atl?.usd,
            atl_change_percentage: coinData.market_data?.atl_change_percentage?.usd,
            fully_diluted_valuation: coinData.market_data?.fully_diluted_valuation?.usd,
            last_updated: coinData.last_updated
          }
        };
      },
      'COIN_DATA'
    );

    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getTrendingCoins = async (req, res, next) => {
  try {
    console.log('Getting trending coins...');
    
    // First try without cache to isolate the issue
    const trending = await coinGeckoService.getTrendingCoins();
    console.log('Got trending coins:', trending.coins?.length || 0);
    
    const marketData = await coinGeckoService.getMarketData({ per_page: 50 });
    console.log('Got market data:', marketData?.length || 0);

    const trendingCoins = trending.coins.map(coin => coin.item);
    const volumeComparisons = coinGeckoService.calculateVolumeComparison(marketData);

    const trendingWithVolume = trendingCoins.map(trendingCoin => {
      const volumeData = volumeComparisons.find(v => v.id === trendingCoin.id);
      return {
        ...trendingCoin,
        volume_data: volumeData || null
      };
    });

    const data = {
      trending_coins: trendingWithVolume,
      top_volume_gainers: volumeComparisons
        .sort((a, b) => b.volume_change_7d_to_30d - a.volume_change_7d_to_30d)
        .slice(0, 10)
    };

    res.json(data);
  } catch (error) {
    console.error('Error in getTrendingCoins:', error.message);
    console.error('Error stack:', error.stack);
    next(error);
  }
};

const searchCoins = async (req, res, next) => {
  try {
    const { query } = req.params;
    const cacheKey = CACHE_KEYS.SEARCH_RESULTS(query);

    const data = await cacheService.getOrSet(
      cacheKey,
      async () => {
        const searchResults = await coinGeckoService.searchCoins(query);
        return {
          coins: searchResults.coins.slice(0, 20),
          query: query
        };
      },
      'SEARCH_RESULTS'
    );

    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getMarketOverview = async (req, res, next) => {
  try {
    const { page = 1, per_page = 50 } = req.query;
    const cacheKey = `${CACHE_KEYS.MARKET_DATA}:${page}:${per_page}`;

    const data = await cacheService.getOrSet(
      cacheKey,
      async () => {
        const marketData = await coinGeckoService.getMarketData({
          page: parseInt(page),
          per_page: parseInt(per_page)
        });

        const volumeComparisons = coinGeckoService.calculateVolumeComparison(marketData);
        
        return {
          coins: volumeComparisons,
          pagination: {
            page: parseInt(page),
            per_page: parseInt(per_page)
          }
        };
      },
      'MARKET_DATA'
    );

    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVolumeComparison,
  getTrendingCoins,
  searchCoins,
  getMarketOverview
};