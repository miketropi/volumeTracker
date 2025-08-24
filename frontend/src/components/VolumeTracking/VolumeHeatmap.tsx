import React, { useState, useEffect } from 'react';
import apiService, { VolumeHeatmapData } from '../../services/apiService';

interface VolumeHeatmapProps {
  coinId: string;
  days?: number;
}

const VolumeHeatmap: React.FC<VolumeHeatmapProps> = ({ coinId, days = 30 }) => {
  const [data, setData] = useState<VolumeHeatmapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<any>(null);

  const fetchVolumeHeatmap = async (coinId: string, days: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const heatmapData = await apiService.getVolumeHeatmap(coinId, days);
      setData(heatmapData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch volume heatmap');
      console.error('Error fetching volume heatmap:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVolumeHeatmap(coinId, days);
  }, [coinId, days]);

  const formatVolume = (value: number): string => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const getIntensityColor = (intensity: number): string => {
    switch (intensity) {
      case 4: return '#dc2626'; // extreme - red
      case 3: return '#ea580c'; // high - orange  
      case 2: return '#ca8a04'; // moderate - yellow
      case 1: return '#16a34a'; // low spike - green
      default: return '#e5e7eb'; // normal - light gray
    }
  };

  const getIntensityOpacity = (intensity: number): number => {
    switch (intensity) {
      case 4: return 1.0;
      case 3: return 0.8;
      case 2: return 0.6;
      case 1: return 0.4;
      default: return 0.1;
    }
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayOfWeek];
  };

  const getMonthName = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short' });
  };

  const organizeDataByWeeks = () => {
    if (!data) return [];
    
    const weeks: { [key: string]: any[] } = {};
    
    data.heatmap_data.forEach(day => {
      const date = new Date(day.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = Array(7).fill(null);
      }
      weeks[weekKey][day.day_of_week] = day;
    });

    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekStart, days]) => ({ weekStart, days }));
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading volume heatmap...</p>
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

  const weeks = organizeDataByWeeks();

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Volume Activity Heatmap</h3>
        <p className="card-subtitle">
          Daily volume intensity calendar for {coinId}
        </p>
      </div>

      <div className="card-body">
        {/* Calendar Heatmap */}
        <div style={{ 
          overflowX: 'auto',
          marginBottom: '1.5rem'
        }}>
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            minWidth: `${Math.max(weeks.length * 20, 400)}px`,
            gap: '2px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem'
          }}>
            {/* Day labels */}
            <div style={{ display: 'flex', marginBottom: '0.5rem' }}>
              <div style={{ width: '30px' }}></div>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div key={index} style={{ 
                  width: '16px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '0.7rem'
                }}>
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            {weeks.map(({ weekStart, days }, weekIndex) => (
              <div key={weekStart} style={{ display: 'flex', alignItems: 'center' }}>
                {/* Week label */}
                {weekIndex % 2 === 0 && (
                  <div style={{ 
                    width: '30px',
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)',
                    textAlign: 'right',
                    paddingRight: '4px'
                  }}>
                    {getMonthName(weekStart)}
                  </div>
                )}
                {weekIndex % 2 !== 0 && <div style={{ width: '30px' }}></div>}
                
                {/* Days */}
                {days.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    style={{
                      width: '14px',
                      height: '14px',
                      margin: '1px',
                      borderRadius: '2px',
                      backgroundColor: day ? getIntensityColor(day.intensity) : '#f3f4f6',
                      opacity: day ? getIntensityOpacity(day.intensity) : 0.3,
                      cursor: day ? 'pointer' : 'default',
                      border: selectedDay?.date === day?.date ? '2px solid var(--primary-color)' : 'none'
                    }}
                    onClick={() => day && setSelectedDay(day)}
                    title={day ? `${day.date}: ${formatVolume(day.volume)}` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)'
        }}>
          <span>Less</span>
          {[0, 1, 2, 3, 4].map(intensity => (
            <div
              key={intensity}
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: getIntensityColor(intensity),
                opacity: getIntensityOpacity(intensity),
                borderRadius: '2px'
              }}
            />
          ))}
          <span>More</span>
        </div>

        {/* Intensity Legend */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          fontSize: '0.75rem'
        }}>
          {Object.entries(data.intensity_legend).map(([intensity, label]) => (
            <div key={intensity} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem' 
            }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: getIntensityColor(parseInt(intensity)),
                  opacity: getIntensityOpacity(parseInt(intensity)),
                  borderRadius: '2px'
                }}
              />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Selected Day Details */}
        {selectedDay && (
          <div style={{
            padding: '1rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--surface)',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ 
              margin: '0 0 0.5rem 0',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem'
            }}>
              {selectedDay.formatted_date} ({selectedDay.date})
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Volume</div>
                <div style={{ fontWeight: 'var(--font-weight-bold)' }}>
                  {formatVolume(selectedDay.volume)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Intensity</div>
                <div style={{ 
                  fontWeight: 'var(--font-weight-bold)',
                  color: getIntensityColor(selectedDay.intensity)
                }}>
                  {data.intensity_legend[selectedDay.intensity]}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Day of Week</div>
                <div style={{ fontWeight: 'var(--font-weight-bold)' }}>
                  {getDayName(selectedDay.day_of_week)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Spike Status</div>
                <div style={{ 
                  fontWeight: 'var(--font-weight-bold)',
                  color: selectedDay.is_spike ? 'var(--success-color)' : 'var(--text-secondary)'
                }}>
                  {selectedDay.is_spike ? 'Volume Spike' : 'Normal'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Summary */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: '1rem' 
        }}>
          <div style={{ 
            padding: '0.75rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'var(--font-weight-bold)' }}>
              {data.statistics.total_days}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Total Days
            </div>
          </div>
          <div style={{ 
            padding: '0.75rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--success-color)' }}>
              {data.statistics.spike_days}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Spike Days
            </div>
          </div>
          <div style={{ 
            padding: '0.75rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'var(--font-weight-bold)' }}>
              {formatVolume(data.statistics.mean)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Avg Volume
            </div>
          </div>
          <div style={{ 
            padding: '0.75rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'var(--font-weight-bold)' }}>
              {data.statistics.volatility_percentage.toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Volatility
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolumeHeatmap;