import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export interface Coin {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  market_cap: number;
  volume_24h: number;
  estimated_volume_7d: number;
  estimated_volume_30d: number;
  volume_change_7d_to_30d: number;
  price_change_7d: number;
  price_change_30d: number;
}

export interface VolumeComparisonData {
  coin: {
    id: string;
    name: string;
    symbol: string;
    image: string;
    current_price: number;
    market_cap: number;
  };
  volume_data: {
    volume_7d: number;
    volume_30d: number;
    volume_24h: number;
    volume_change_percentage: number;
  };
  price_changes: {
    price_change_7d: number;
    price_change_30d: number;
  };
}

export interface DailyVolume {
  date: string;
  timestamp: number;
  volume: number;
  formatted_date: string;
}

export interface VolumeSpike {
  date: string;
  timestamp: number;
  volume: number;
  formatted_date: string;
  z_score: number;
  is_spike: boolean;
  is_significant_spike: boolean;
  spike_intensity: 'moderate' | 'high' | 'extreme';
  percentage_change_from_previous: number;
  deviation_from_mean: number;
}

export interface VolumeStatistics {
  mean: number;
  median: number;
  max: number;
  min: number;
  standard_deviation: number;
  volatility_percentage: number;
  weekly_averages: Array<{
    week_start: string;
    average_volume: number;
    total_days: number;
  }>;
  trend: 'strongly_increasing' | 'increasing' | 'stable' | 'decreasing' | 'strongly_decreasing' | 'insufficient_data';
  total_days: number;
  spike_days: number;
}

export interface VolumeTrackingData {
  coin_id: string;
  period_days: number;
  daily_volumes: DailyVolume[];
  volume_spikes: VolumeSpike[];
  statistics: VolumeStatistics;
  generated_at: string;
}

export interface VolumeSpikesData {
  coin_id: string;
  period_days: number;
  intensity_filter: string;
  total_spikes: number;
  spikes: VolumeSpike[];
  summary: {
    extreme_spikes: number;
    high_spikes: number;
    moderate_spikes: number;
    avg_spike_intensity: number;
  };
  generated_at: string;
}

export interface VolumeHeatmapData {
  coin_id: string;
  period_days: number;
  heatmap_data: Array<{
    date: string;
    formatted_date: string;
    volume: number;
    intensity: number;
    is_spike: boolean;
    day_of_week: number;
    week_of_year: number;
  }>;
  weekly_data: { [key: string]: any[] };
  intensity_legend: { [key: number]: string };
  statistics: VolumeStatistics;
  generated_at: string;
}

export interface MarketOverviewResponse {
  coins: Coin[];
  pagination: {
    page: number;
    per_page: number;
  };
}

class ApiService {
  async getVolumeComparison(coinId: string): Promise<VolumeComparisonData> {
    const response = await apiClient.get(`/crypto/volume-comparison/${coinId}`);
    return response.data;
  }

  async getTrendingCoins(): Promise<any> {
    const response = await apiClient.get('/crypto/trending');
    return response.data;
  }

  async searchCoins(query: string): Promise<any> {
    const response = await apiClient.get(`/crypto/search/${query}`);
    return response.data;
  }

  async getMarketOverview(page: number = 1, perPage: number = 50): Promise<MarketOverviewResponse> {
    const response = await apiClient.get('/crypto/market', {
      params: { page, per_page: perPage }
    });
    return response.data;
  }

  async getVolumeLeaders(type: 'gainers' | 'losers' = 'gainers', limit: number = 10): Promise<any> {
    const response = await apiClient.get('/analytics/volume-leaders', {
      params: { type, limit }
    });
    return response.data;
  }

  async getVolumeAnalytics(): Promise<any> {
    const response = await apiClient.get('/analytics/volume-analytics');
    return response.data;
  }

  async getDailyVolumeTracking(coinId: string, days: number = 30): Promise<VolumeTrackingData> {
    const response = await apiClient.get(`/volume-tracking/${coinId}`, {
      params: { days }
    });
    return response.data;
  }

  async getVolumeSpikes(coinId: string, days: number = 30, intensity: string = 'moderate'): Promise<VolumeSpikesData> {
    const response = await apiClient.get(`/volume-tracking/${coinId}/spikes`, {
      params: { days, intensity }
    });
    return response.data;
  }

  async getVolumeHeatmap(coinId: string, days: number = 30): Promise<VolumeHeatmapData> {
    const response = await apiClient.get(`/volume-tracking/${coinId}/heatmap`, {
      params: { days }
    });
    return response.data;
  }

  async getMultipleCoinVolumeTracking(coinIds: string[], days: number = 7): Promise<any> {
    const response = await apiClient.get('/volume-tracking/multi/coins', {
      params: { 
        coinIds: coinIds.join(','), 
        days 
      }
    });
    return response.data;
  }
}

export default new ApiService();