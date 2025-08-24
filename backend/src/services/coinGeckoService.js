const axios = require('axios');

class CoinGeckoService {
  constructor() {
    this.baseURL = 'https://api.coingecko.com/api/v3';
    this.apiKey = process.env.COINGECKO_API_KEY;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: this.apiKey && this.apiKey !== 'your_api_key_here' ? {
        'X-CG-Demo-API-Key': this.apiKey
      } : {}
    });
  }

  async getMarketData(params = {}) {
    const defaultParams = {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: 100,
      page: 1,
      sparkline: false,
      price_change_percentage: '1h,24h,7d,14d,30d,200d,1y'
    };

    const response = await this.client.get('/coins/markets', {
      params: { ...defaultParams, ...params }
    });

    return response.data;
  }

  async getDailyVolumeTracking(coinId, days = 30) {
    try {
      const historical = await this.getHistoricalData(coinId, days);
      const volumes = historical.total_volumes || [];
      
      if (volumes.length === 0) {
        throw new Error('No volume data available');
      }

      const dailyVolumes = volumes.map(([timestamp, volume]) => ({
        date: new Date(timestamp).toISOString().split('T')[0],
        timestamp,
        volume,
        formatted_date: new Date(timestamp).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        })
      }));

      const volumeSpikes = this.detectVolumeSpikes(dailyVolumes);

      const stats = this.calculateVolumeStats(dailyVolumes);

      return {
        coin_id: coinId,
        period_days: days,
        daily_volumes: dailyVolumes,
        volume_spikes: volumeSpikes,
        statistics: stats,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error getting daily volume tracking for ${coinId}:`, error);
      throw error;
    }
  }

  detectVolumeSpikes(dailyVolumes) {
    if (dailyVolumes.length < 3) return [];

    const volumes = dailyVolumes.map(d => d.volume);
    const mean = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const stdDev = Math.sqrt(
      volumes.reduce((sum, vol) => sum + Math.pow(vol - mean, 2), 0) / volumes.length
    );

    const spikes = dailyVolumes.map((day, index) => {
      const zScore = (day.volume - mean) / stdDev;
      const isSpike = zScore > 2; // Volume is 2+ standard deviations above mean
      const isSignificantSpike = zScore > 3; // Volume is 3+ standard deviations above mean
      
      let spikeIntensity = 'normal';
      if (zScore > 3) spikeIntensity = 'extreme';
      else if (zScore > 2.5) spikeIntensity = 'high';
      else if (zScore > 2) spikeIntensity = 'moderate';

      const previousVolume = index > 0 ? dailyVolumes[index - 1].volume : day.volume;
      const percentageChange = previousVolume > 0 ? ((day.volume - previousVolume) / previousVolume) * 100 : 0;

      return {
        ...day,
        z_score: parseFloat(zScore.toFixed(2)),
        is_spike: isSpike,
        is_significant_spike: isSignificantSpike,
        spike_intensity: spikeIntensity,
        percentage_change_from_previous: parseFloat(percentageChange.toFixed(2)),
        deviation_from_mean: parseFloat(((day.volume - mean) / mean * 100).toFixed(2))
      };
    }).filter(day => day.is_spike);

    return spikes.sort((a, b) => b.z_score - a.z_score);
  }

  calculateVolumeStats(dailyVolumes) {
    const volumes = dailyVolumes.map(d => d.volume);
    const mean = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const median = this.calculateMedian(volumes);
    const max = Math.max(...volumes);
    const min = Math.min(...volumes);
    
    const stdDev = Math.sqrt(
      volumes.reduce((sum, vol) => sum + Math.pow(vol - mean, 2), 0) / volumes.length
    );

    const volatility = (stdDev / mean) * 100;

    const weeklyAverage = this.calculateWeeklyAverages(dailyVolumes);
    const trend = this.calculateVolumeTrend(dailyVolumes);

    return {
      mean: parseFloat(mean.toFixed(2)),
      median: parseFloat(median.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      min: parseFloat(min.toFixed(2)),
      standard_deviation: parseFloat(stdDev.toFixed(2)),
      volatility_percentage: parseFloat(volatility.toFixed(2)),
      weekly_averages: weeklyAverage,
      trend: trend,
      total_days: dailyVolumes.length,
      spike_days: dailyVolumes.filter(d => d.z_score && d.z_score > 2).length
    };
  }

  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[middle - 1] + sorted[middle]) / 2 
      : sorted[middle];
  }

  calculateWeeklyAverages(dailyVolumes) {
    const weeks = {};
    dailyVolumes.forEach(day => {
      const date = new Date(day.timestamp);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = { volumes: [], week_start: weekKey };
      }
      weeks[weekKey].volumes.push(day.volume);
    });

    return Object.values(weeks).map(week => ({
      week_start: week.week_start,
      average_volume: week.volumes.reduce((sum, vol) => sum + vol, 0) / week.volumes.length,
      total_days: week.volumes.length
    }));
  }

  calculateVolumeTrend(dailyVolumes) {
    if (dailyVolumes.length < 2) return 'insufficient_data';
    
    const recentDays = dailyVolumes.slice(-7);
    const olderDays = dailyVolumes.slice(0, 7);
    
    const recentAvg = recentDays.reduce((sum, d) => sum + d.volume, 0) / recentDays.length;
    const olderAvg = olderDays.reduce((sum, d) => sum + d.volume, 0) / olderDays.length;
    
    const change = (recentAvg - olderAvg) / olderAvg * 100;
    
    if (change > 20) return 'strongly_increasing';
    if (change > 5) return 'increasing';
    if (change < -20) return 'strongly_decreasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }

  async getDetailedVolumeData(coinIds) {
    const promises = coinIds.map(async (coinId) => {
      try {
        const [coinData, historical24h, historical7d] = await Promise.all([
          this.getCoinData(coinId),
          this.getHistoricalData(coinId, 1),
          this.getHistoricalData(coinId, 7)
        ]);

        const volumes24h = historical24h.total_volumes || [];
        const volumes7d = historical7d.total_volumes || [];

        const volume24hTotal = volumes24h.length > 0 ? volumes24h[volumes24h.length - 1][1] : 0;
        const volume24hPrevious = volumes24h.length > 1 ? volumes24h[volumes24h.length - 2][1] : volume24hTotal;
        const volume24hChange = volume24hPrevious > 0 ? ((volume24hTotal - volume24hPrevious) / volume24hPrevious) * 100 : 0;

        const avgVolume7d = volumes7d.length > 0 
          ? volumes7d.reduce((sum, [, volume]) => sum + volume, 0) / volumes7d.length 
          : 0;

        const volumeRank = coinData.market_cap_rank || 999;
        const volumeToMarketCapRatio = coinData.market_data?.market_cap?.usd > 0 
          ? (volume24hTotal / coinData.market_data.market_cap.usd) * 100 
          : 0;

        return {
          id: coinId,
          volume_24h_current: volume24hTotal,
          volume_24h_previous: volume24hPrevious,
          volume_24h_change_percentage: volume24hChange,
          volume_7d_average: avgVolume7d,
          volume_rank: volumeRank,
          volume_to_mcap_ratio: volumeToMarketCapRatio,
          liquidity_score: this.calculateLiquidityScore(volume24hTotal, coinData.market_data?.market_cap?.usd || 0)
        };
      } catch (error) {
        console.error(`Error fetching volume data for ${coinId}:`, error.message);
        return null;
      }
    });

    const results = await Promise.all(promises);
    return results.filter(result => result !== null);
  }

  async getCoinData(coinId) {
    const response = await this.client.get(`/coins/${coinId}`, {
      params: {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false
      }
    });

    return response.data;
  }

  async getHistoricalData(coinId, days = 30) {
    const params = {
      vs_currency: 'usd',
      days: days
    };
    
    // Only add interval for longer periods and if we have an enterprise key
    if (days > 90) {
      params.interval = 'daily';
    }

    const response = await this.client.get(`/coins/${coinId}/market_chart`, {
      params: params
    });

    return response.data;
  }

  async searchCoins(query) {
    const response = await this.client.get('/search', {
      params: { query }
    });

    return response.data;
  }

  async getTrendingCoins() {
    const response = await this.client.get('/search/trending');
    return response.data;
  }

  calculateLiquidityScore(volume24h, marketCap) {
    if (marketCap === 0) return 0;
    
    const volumeToMcapRatio = (volume24h / marketCap) * 100;
    
    if (volumeToMcapRatio > 50) return 10; // Excellent liquidity
    if (volumeToMcapRatio > 25) return 8;  // Very good liquidity
    if (volumeToMcapRatio > 15) return 6;  // Good liquidity
    if (volumeToMcapRatio > 5) return 4;   // Fair liquidity
    if (volumeToMcapRatio > 1) return 2;   // Poor liquidity
    return 1; // Very poor liquidity
  }

  calculateVolumeMetrics(volumes) {
    if (!volumes || volumes.length === 0) return null;
    
    const volumeValues = volumes.map(([, volume]) => volume);
    const sum = volumeValues.reduce((acc, vol) => acc + vol, 0);
    const average = sum / volumeValues.length;
    
    const sortedVolumes = [...volumeValues].sort((a, b) => a - b);
    const median = sortedVolumes.length % 2 === 0
      ? (sortedVolumes[sortedVolumes.length / 2 - 1] + sortedVolumes[sortedVolumes.length / 2]) / 2
      : sortedVolumes[Math.floor(sortedVolumes.length / 2)];
    
    const max = Math.max(...volumeValues);
    const min = Math.min(...volumeValues);
    
    const variance = volumeValues.reduce((acc, vol) => acc + Math.pow(vol - average, 2), 0) / volumeValues.length;
    const standardDeviation = Math.sqrt(variance);
    const volatility = (standardDeviation / average) * 100;
    
    return {
      total: sum,
      average,
      median,
      max,
      min,
      volatility,
      data_points: volumeValues.length
    };
  }

  calculateVolumeComparison(marketData) {
    return marketData.map(coin => {
      const volume24h = coin.total_volume || 0;
      const priceChange1h = coin.price_change_percentage_1h_in_currency || 0;
      const priceChange24h = coin.price_change_percentage_24h || 0;
      const priceChange7d = coin.price_change_percentage_7d || 0;
      const priceChange14d = coin.price_change_percentage_14d || 0;
      const priceChange30d = coin.price_change_percentage_30d || 0;
      const priceChange200d = coin.price_change_percentage_200d || 0;
      const priceChange1y = coin.price_change_percentage_1y || 0;
      
      const estimatedVolume7d = volume24h * 7;
      const estimatedVolume30d = volume24h * 30;
      
      const volumeChange7dTo30d = estimatedVolume30d > 0 
        ? ((estimatedVolume7d - (estimatedVolume30d / 4.28)) / (estimatedVolume30d / 4.28)) * 100 
        : 0;

      const volumeToMcapRatio = coin.market_cap > 0 ? (volume24h / coin.market_cap) * 100 : 0;
      const liquidityScore = this.calculateLiquidityScore(volume24h, coin.market_cap);

      return {
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        image: coin.image,
        current_price: coin.current_price,
        market_cap: coin.market_cap,
        market_cap_rank: coin.market_cap_rank,
        
        // Enhanced volume data
        volume_24h: volume24h,
        estimated_volume_7d: estimatedVolume7d,
        estimated_volume_30d: estimatedVolume30d,
        volume_change_7d_to_30d: volumeChange7dTo30d,
        volume_to_mcap_ratio: volumeToMcapRatio,
        liquidity_score: liquidityScore,
        
        // Enhanced price data
        price_change_1h: priceChange1h,
        price_change_24h: priceChange24h,
        price_change_7d: priceChange7d,
        price_change_14d: priceChange14d,
        price_change_30d: priceChange30d,
        price_change_200d: priceChange200d,
        price_change_1y: priceChange1y,
        
        // Additional metrics
        ath: coin.ath,
        ath_change_percentage: coin.ath_change_percentage,
        atl: coin.atl,
        atl_change_percentage: coin.atl_change_percentage,
        circulating_supply: coin.circulating_supply,
        total_supply: coin.total_supply,
        max_supply: coin.max_supply,
        fully_diluted_valuation: coin.fully_diluted_valuation,
        last_updated: coin.last_updated
      };
    });
  }
}

module.exports = new CoinGeckoService();