import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, Area, AreaChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import apiService, { VolumeTrackingData } from '../../services/apiService';

interface VolumeTrackingChartProps {
  coinId: string;
  days?: number;
}

type ChartType = 'line' | 'bar' | 'area' | 'spikes';

const VolumeTrackingChart: React.FC<VolumeTrackingChartProps> = ({ coinId, days = 30 }) => {
  const [data, setData] = useState<VolumeTrackingData | null>(null);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(days);

  const fetchVolumeTracking = async (coinId: string, days: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const volumeData = await apiService.getDailyVolumeTracking(coinId, days);
      setData(volumeData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch volume tracking data');
      console.error('Error fetching volume tracking:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVolumeTracking(coinId, selectedPeriod);
  }, [coinId, selectedPeriod]);

  const formatVolume = (value: number): string => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const getChartData = () => {
    if (!data) return [];

    return data.daily_volumes.map(day => {
      const spike = data.volume_spikes.find(s => s.date === day.date);
      return {
        date: day.formatted_date,
        fullDate: day.date,
        volume: day.volume,
        isSpike: !!spike,
        spikeIntensity: spike?.spike_intensity || 'normal',
        zScore: spike?.z_score || 0,
        percentageChange: spike?.percentage_change_from_previous || 0
      };
    });
  };

  const getSpikeColor = (intensity: string) => {
    switch (intensity) {
      case 'extreme': return '#dc2626'; // red
      case 'high': return '#ea580c'; // orange
      case 'moderate': return '#ca8a04'; // yellow
      default: return 'var(--primary-color)';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    return (
      <div style={{
        backgroundColor: 'var(--background)',
        padding: '12px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.875rem'
      }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{data.fullDate}</p>
        <p style={{ margin: '4px 0', color: 'var(--text-primary)' }}>
          Volume: {formatVolume(data.volume)}
        </p>
        {data.isSpike && (
          <>
            <p style={{ margin: '4px 0', color: getSpikeColor(data.spikeIntensity) }}>
              Spike Intensity: {data.spikeIntensity.toUpperCase()}
            </p>
            <p style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>
              Z-Score: {data.zScore.toFixed(2)}
            </p>
            <p style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>
              Change: {data.percentageChange > 0 ? '+' : ''}{data.percentageChange.toFixed(1)}%
            </p>
          </>
        )}
      </div>
    );
  };

  const renderChart = () => {
    const chartData = getChartData();
    const meanVolume = data?.statistics?.mean || 0;
    
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis 
                dataKey="date"
                tick={{ fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                tickLine={{ stroke: 'var(--border)' }}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis 
                tickFormatter={formatVolume}
                tick={{ fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                tickLine={{ stroke: 'var(--border)' }}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={meanVolume} 
                stroke="var(--neutral-color)" 
                strokeDasharray="5 5"
                label={{ value: "Mean", position: "top" }}
              />
              <Line 
                dataKey="volume" 
                stroke="var(--primary-color)" 
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.isSpike) {
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={getSpikeColor(payload.spikeIntensity)}
                        stroke={getSpikeColor(payload.spikeIntensity)}
                        strokeWidth={2}
                      />
                    );
                  }
                  return <circle cx={cx} cy={cy} r={2} fill="var(--primary-color)" />;
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis 
                dataKey="date"
                tick={{ fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                tickLine={{ stroke: 'var(--border)' }}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis 
                tickFormatter={formatVolume}
                tick={{ fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                tickLine={{ stroke: 'var(--border)' }}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={meanVolume} 
                stroke="var(--neutral-color)" 
                strokeDasharray="5 5"
                label={{ value: "Mean", position: "top" }}
              />
              <Area 
                dataKey="volume" 
                stroke="var(--primary-color)" 
                fill="var(--primary-light)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis 
                dataKey="date"
                tick={{ fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                tickLine={{ stroke: 'var(--border)' }}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis 
                tickFormatter={formatVolume}
                tick={{ fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                tickLine={{ stroke: 'var(--border)' }}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={meanVolume} 
                stroke="var(--neutral-color)" 
                strokeDasharray="5 5"
                label={{ value: "Mean", position: "top" }}
              />
              <Bar 
                dataKey="volume" 
                fill="var(--primary-color)"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'spikes':
        const spikeData = chartData.filter(d => d.isSpike);
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={spikeData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis 
                dataKey="date"
                tick={{ fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                tickLine={{ stroke: 'var(--border)' }}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis 
                tickFormatter={formatVolume}
                tick={{ fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                tickLine={{ stroke: 'var(--border)' }}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="volume" 
                fill="var(--danger-color)"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading volume tracking data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <strong>Error</strong>
        <p>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="volume-comparison-chart">
      <div className="chart-header">
        <div className="chart-title">
          Daily Volume Tracking - {data.coin_id}
        </div>
        
        <div className="chart-controls">
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
              Period:
            </label>
            {[7, 14, 30, 90].map((period) => (
              <button
                key={period}
                className={`btn ${selectedPeriod === period ? 'active' : ''}`}
                onClick={() => setSelectedPeriod(period)}
                style={{ fontSize: '0.75rem', padding: '0.5rem' }}
              >
                {period}d
              </button>
            ))}
          </div>
          
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
              Chart:
            </label>
            {(['line', 'area', 'bar', 'spikes'] as ChartType[]).map((type) => (
              <button
                key={type}
                className={`btn ${chartType === type ? 'active' : ''}`}
                onClick={() => setChartType(type)}
                style={{ fontSize: '0.75rem', padding: '0.5rem' }}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="chart-container">
        {renderChart()}
      </div>

      <div className="volume-stats">
        <div className="stat-item">
          <span className="stat-label">Mean Volume</span>
          <span className="stat-value">{formatVolume(data.statistics.mean)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Volatility</span>
          <span className="stat-value">{data.statistics.volatility_percentage.toFixed(1)}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Volume Spikes</span>
          <span className="stat-value">{data.volume_spikes.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Trend</span>
          <span className={`stat-value ${
            data.statistics.trend.includes('increasing') ? 'positive' : 
            data.statistics.trend.includes('decreasing') ? 'negative' : ''
          }`}>
            {data.statistics.trend.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {data.volume_spikes.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h4 style={{ 
            fontFamily: 'var(--font-mono)', 
            color: 'var(--text-primary)', 
            marginBottom: '1rem',
            fontSize: '1rem'
          }}>
            Top Volume Spikes
          </h4>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {data.volume_spikes.slice(0, 3).map((spike) => (
              <div key={spike.date} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--surface)'
              }}>
                <div>
                  <span style={{ fontWeight: 'var(--font-weight-bold)', fontSize: '0.875rem' }}>
                    {spike.formatted_date}
                  </span>
                  <span style={{ 
                    color: getSpikeColor(spike.spike_intensity), 
                    marginLeft: '0.5rem',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    fontWeight: 'var(--font-weight-bold)'
                  }}>
                    {spike.spike_intensity}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'var(--font-weight-bold)' }}>
                    {formatVolume(spike.volume)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    +{spike.percentage_change_from_previous.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VolumeTrackingChart;