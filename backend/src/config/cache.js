const CACHE_CONFIG = {
  COIN_DATA: { ttl: 300 },
  MARKET_DATA: { ttl: 900 },
  HISTORICAL_DATA: { ttl: 3600 },
  SEARCH_RESULTS: { ttl: 1800 },
  TRENDING_DATA: { ttl: 600 },
  VOLUME_TRACKING: { ttl: 1800 }
};

const CACHE_KEYS = {
  MARKET_DATA: 'market_data',
  COIN_DATA: (coinId) => `coin_data:${coinId}`,
  HISTORICAL_DATA: (coinId, days) => `historical:${coinId}:${days}`,
  SEARCH_RESULTS: (query) => `search:${query}`,
  TRENDING_DATA: 'trending_data',
  VOLUME_COMPARISON: 'volume_comparison',
  VOLUME_TRACKING: 'volume_tracking'
};

module.exports = {
  CACHE_CONFIG,
  CACHE_KEYS
};