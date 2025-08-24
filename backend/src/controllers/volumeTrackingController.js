const coinGeckoService = require('../services/coinGeckoService');
const cacheService = require('../services/cacheService');
const { CACHE_KEYS } = require('../config/cache');

const getDailyVolumeTracking = async (req, res, next) => {
  try {
    const { coinId } = req.params;
    const { days = 30 } = req.query;
    
    const validDays = Math.min(Math.max(parseInt(days), 7), 365); // Limit between 7 and 365 days
    const cacheKey = `${CACHE_KEYS.VOLUME_TRACKING || 'volume_tracking'}:${coinId}:${validDays}`;

    const data = await cacheService.getOrSet(
      cacheKey,
      async () => {
        const volumeTracking = await coinGeckoService.getDailyVolumeTracking(coinId, validDays);
        return volumeTracking;
      },
      'COIN_DATA' // 30 minute cache
    );

    res.json(data);
  } catch (error) {
    console.error('Error in getDailyVolumeTracking:', error.message);
    next(error);
  }
};

const getVolumeSpikes = async (req, res, next) => {
  try {
    const { coinId } = req.params;
    const { days = 30, intensity = 'moderate' } = req.query;
    
    const validDays = Math.min(Math.max(parseInt(days), 7), 365);
    const cacheKey = `volume_spikes:${coinId}:${validDays}:${intensity}`;

    const data = await cacheService.getOrSet(
      cacheKey,
      async () => {
        const volumeTracking = await coinGeckoService.getDailyVolumeTracking(coinId, validDays);
        
        let filteredSpikes = volumeTracking.volume_spikes;
        
        // Filter by spike intensity
        if (intensity === 'high') {
          filteredSpikes = filteredSpikes.filter(spike => 
            ['high', 'extreme'].includes(spike.spike_intensity)
          );
        } else if (intensity === 'extreme') {
          filteredSpikes = filteredSpikes.filter(spike => 
            spike.spike_intensity === 'extreme'
          );
        }

        return {
          coin_id: coinId,
          period_days: validDays,
          intensity_filter: intensity,
          total_spikes: filteredSpikes.length,
          spikes: filteredSpikes,
          summary: {
            extreme_spikes: filteredSpikes.filter(s => s.spike_intensity === 'extreme').length,
            high_spikes: filteredSpikes.filter(s => s.spike_intensity === 'high').length,
            moderate_spikes: filteredSpikes.filter(s => s.spike_intensity === 'moderate').length,
            avg_spike_intensity: filteredSpikes.length > 0 ? 
              filteredSpikes.reduce((sum, s) => sum + s.z_score, 0) / filteredSpikes.length : 0
          },
          generated_at: new Date().toISOString()
        };
      },
      'COIN_DATA'
    );

    res.json(data);
  } catch (error) {
    console.error('Error in getVolumeSpikes:', error.message);
    next(error);
  }
};

const getMultipleCoinVolumeTracking = async (req, res, next) => {
  try {
    const { coinIds } = req.query;
    const { days = 7 } = req.query;
    
    if (!coinIds) {
      return res.status(400).json({ 
        error: 'coinIds parameter is required (comma-separated list)' 
      });
    }

    const coinIdArray = coinIds.split(',').slice(0, 10); // Limit to 10 coins
    const validDays = Math.min(Math.max(parseInt(days), 7), 30); // Limit for multiple coins
    
    const cacheKey = `multi_volume_tracking:${coinIds}:${validDays}`;

    const data = await cacheService.getOrSet(
      cacheKey,
      async () => {
        const promises = coinIdArray.map(async (coinId) => {
          try {
            const volumeTracking = await coinGeckoService.getDailyVolumeTracking(coinId.trim(), validDays);
            return {
              success: true,
              ...volumeTracking
            };
          } catch (error) {
            console.error(`Error tracking volume for ${coinId}:`, error.message);
            return {
              success: false,
              coin_id: coinId.trim(),
              error: error.message
            };
          }
        });

        const results = await Promise.all(promises);
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        return {
          period_days: validDays,
          total_coins_requested: coinIdArray.length,
          successful_coins: successful.length,
          failed_coins: failed.length,
          coins: successful,
          errors: failed,
          generated_at: new Date().toISOString()
        };
      },
      'COIN_DATA'
    );

    res.json(data);
  } catch (error) {
    console.error('Error in getMultipleCoinVolumeTracking:', error.message);
    next(error);
  }
};

const getVolumeHeatmap = async (req, res, next) => {
  try {
    const { coinId } = req.params;
    const { days = 30 } = req.query;
    
    const validDays = Math.min(Math.max(parseInt(days), 7), 365);
    const cacheKey = `volume_heatmap:${coinId}:${validDays}`;

    const data = await cacheService.getOrSet(
      cacheKey,
      async () => {
        const volumeTracking = await coinGeckoService.getDailyVolumeTracking(coinId, validDays);
        
        // Create heatmap data with volume intensity
        const heatmapData = volumeTracking.daily_volumes.map(day => {
          const volumeSpike = volumeTracking.volume_spikes.find(spike => 
            spike.date === day.date
          );
          
          let intensity = 0;
          if (volumeSpike) {
            if (volumeSpike.spike_intensity === 'extreme') intensity = 4;
            else if (volumeSpike.spike_intensity === 'high') intensity = 3;
            else if (volumeSpike.spike_intensity === 'moderate') intensity = 2;
            else intensity = 1;
          }

          return {
            date: day.date,
            formatted_date: day.formatted_date,
            volume: day.volume,
            intensity: intensity,
            is_spike: !!volumeSpike,
            day_of_week: new Date(day.timestamp).getDay(),
            week_of_year: Math.ceil(
              (new Date(day.timestamp) - new Date(new Date(day.timestamp).getFullYear(), 0, 1)) / 
              (7 * 24 * 60 * 60 * 1000)
            )
          };
        });

        // Group by week for calendar view
        const weeklyData = {};
        heatmapData.forEach(day => {
          const weekKey = `${new Date(day.date).getFullYear()}-W${day.week_of_year}`;
          if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = [];
          }
          weeklyData[weekKey].push(day);
        });

        return {
          coin_id: coinId,
          period_days: validDays,
          heatmap_data: heatmapData,
          weekly_data: weeklyData,
          intensity_legend: {
            0: 'Normal',
            1: 'Low Spike',
            2: 'Moderate Spike', 
            3: 'High Spike',
            4: 'Extreme Spike'
          },
          statistics: volumeTracking.statistics,
          generated_at: new Date().toISOString()
        };
      },
      'COIN_DATA'
    );

    res.json(data);
  } catch (error) {
    console.error('Error in getVolumeHeatmap:', error.message);
    next(error);
  }
};

module.exports = {
  getDailyVolumeTracking,
  getVolumeSpikes,
  getMultipleCoinVolumeTracking,
  getVolumeHeatmap
};