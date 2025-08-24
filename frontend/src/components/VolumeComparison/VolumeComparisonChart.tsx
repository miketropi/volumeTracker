import React, { useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { VolumeComparisonData } from '../../services/apiService';

interface VolumeComparisonChartProps {
  data: VolumeComparisonData;
}

type ChartType = 'bar' | 'line' | 'area';
type ComparisonMode = 'volume' | 'price' | 'combined';

const VolumeComparisonChart: React.FC<VolumeComparisonChartProps> = ({ data }) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('volume');
  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getChartData = () => {
    switch (comparisonMode) {
      case 'volume':
        return [
          {
            period: '24h',
            value: data.volume_data?.volume_24h || 0,
            label: '24h Volume'
          },
          {
            period: '7d',
            value: data.volume_data?.volume_7d || 0,
            label: '7d Total Volume'
          },
          {
            period: '30d',
            value: data.volume_data?.volume_30d || 0,
            label: '30d Total Volume'
          }
        ];
      case 'price':
        return [
          {
            period: '7d',
            value: data.price_changes?.price_change_7d || 0,
            label: '7d Price Change %'
          },
          {
            period: '30d',
            value: data.price_changes?.price_change_30d || 0,
            label: '30d Price Change %'
          }
        ];
      case 'combined':
        return [
          {
            period: '7d',
            volume: data.volume_data?.volume_7d || 0,
            price_change: data.price_changes?.price_change_7d || 0,
            label: '7 Days'
          },
          {
            period: '30d',
            volume: data.volume_data?.volume_30d || 0,
            price_change: data.price_changes?.price_change_30d || 0,
            label: '30 Days'
          }
        ];
      default:
        return [];
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div style={{
        backgroundColor: 'var(--background)',
        padding: '12px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.875rem'
      }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ margin: '4px 0', color: entry.color }}>
            {entry.dataKey === 'value' && comparisonMode === 'volume' ? 
              `Volume: ${formatCurrency(entry.value)}` :
              entry.dataKey === 'value' && comparisonMode === 'price' ?
              `Change: ${formatPercentage(entry.value)}` :
              entry.dataKey === 'volume' ?
              `Volume: ${formatCurrency(entry.value)}` :
              entry.dataKey === 'price_change' ?
              `Price: ${formatPercentage(entry.value)}` :
              `${entry.dataKey}: ${entry.value}`
            }
          </p>
        ))}
      </div>
    );
  };

  const renderChart = () => {
    const chartData = getChartData();
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 20, left: 20, bottom: 20 }
    };

    if (comparisonMode === 'combined') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis 
              dataKey="period" 
              tick={{ fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 12 }}
              tickLine={{ stroke: 'var(--border)' }}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis 
              yAxisId="volume"
              orientation="left"
              tickFormatter={formatCurrency}
              tick={{ fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
              tickLine={{ stroke: 'var(--border)' }}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis 
              yAxisId="price"
              orientation="right"
              tickFormatter={(value) => `${value}%`}
              tick={{ fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
              tickLine={{ stroke: 'var(--border)' }}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar yAxisId="volume" dataKey="volume" fill="var(--primary-color)" />
            <Line yAxisId="price" dataKey="price_change" stroke="var(--success-color)" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis 
                dataKey="period" 
                tick={{ fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                tickLine={{ stroke: 'var(--border)' }}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis 
                tickFormatter={comparisonMode === 'volume' ? formatCurrency : (v) => `${v}%`}
                tick={{ fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                tickLine={{ stroke: 'var(--border)' }}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                dataKey="value" 
                stroke="var(--primary-color)" 
                strokeWidth={3}
                dot={{ fill: 'var(--primary-color)', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis 
                dataKey="period" 
                tick={{ fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                tickLine={{ stroke: 'var(--border)' }}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis 
                tickFormatter={comparisonMode === 'volume' ? formatCurrency : (v) => `${v}%`}
                tick={{ fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                tickLine={{ stroke: 'var(--border)' }}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                dataKey="value" 
                stroke="var(--primary-color)" 
                fill="var(--primary-light)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis 
                dataKey="period" 
                tick={{ fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                tickLine={{ stroke: 'var(--border)' }}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis 
                tickFormatter={comparisonMode === 'volume' ? formatCurrency : (v) => `${v}%`}
                tick={{ fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                tickLine={{ stroke: 'var(--border)' }}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                fill="var(--primary-color)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  const statsData = [
    {
      label: 'Volume 24h',
      value: formatCurrency(data.volume_data?.volume_24h || 0),
      change: null
    },
    {
      label: 'Volume Change',
      value: formatPercentage(data.volume_data?.volume_change_percentage || 0),
      change: data.volume_data?.volume_change_percentage || 0
    },
    {
      label: '7d vs 30d Ratio',
      value: data.volume_data?.volume_7d && data.volume_data?.volume_30d ? 
        `${((data.volume_data.volume_7d / data.volume_data.volume_30d) * 100).toFixed(2)}%` : 
        '0%',
      change: null
    },
    {
      label: 'Market Cap',
      value: formatCurrency(data.coin?.market_cap || 0),
      change: null
    }
  ];

  return (
    <div className="volume-comparison-chart">
      <div className="chart-header">
        <div className="chart-title">
          Volume Analysis
        </div>
        <div className="coin-info">
          <img 
            src={data.coin?.image} 
            alt={data.coin?.name}
            className="coin-image"
          />
          <div className="coin-details">
            <h3>{data.coin?.name}</h3>
            <p>{data.coin?.symbol?.toUpperCase()} • {formatCurrency(data.coin?.current_price || 0)}</p>
          </div>
        </div>
        
        <div className="chart-controls">
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
              Chart Type:
            </label>
            {(['bar', 'line', 'area'] as ChartType[]).map((type) => (
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
          
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
              Compare:
            </label>
            {(['volume', 'price', 'combined'] as ComparisonMode[]).map((mode) => (
              <button
                key={mode}
                className={`btn ${comparisonMode === mode ? 'active' : ''}`}
                onClick={() => setComparisonMode(mode)}
                style={{ fontSize: '0.75rem', padding: '0.5rem' }}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="chart-container">
        {renderChart()}
      </div>

      <div className="volume-stats">
        {statsData.map((stat, index) => (
          <div key={index} className="stat-item">
            <span className="stat-label">
              {stat.label}
            </span>
            <span className={`stat-value ${
              stat.change !== null 
                ? stat.change >= 0 
                  ? 'positive' 
                  : 'negative'
                : ''
            }`}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VolumeComparisonChart;