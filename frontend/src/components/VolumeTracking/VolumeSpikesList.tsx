import React, { useState, useEffect } from 'react';
import apiService, { VolumeSpikesData, VolumeSpike } from '../../services/apiService';

interface VolumeSpikesListProps {
  coinId: string;
  days?: number;
}

const VolumeSpikesList: React.FC<VolumeSpikesListProps> = ({ coinId, days = 30 }) => {
  const [data, setData] = useState<VolumeSpikesData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intensityFilter, setIntensityFilter] = useState<string>('moderate');

  const fetchVolumeSpikes = async (coinId: string, days: number, intensity: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const spikesData = await apiService.getVolumeSpikes(coinId, days, intensity);
      setData(spikesData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch volume spikes');
      console.error('Error fetching volume spikes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVolumeSpikes(coinId, days, intensityFilter);
  }, [coinId, days, intensityFilter]);

  const formatVolume = (value: number): string => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const getSpikeColor = (intensity: string): string => {
    switch (intensity) {
      case 'extreme': return 'var(--danger-color)';
      case 'high': return 'var(--warning-color)';
      case 'moderate': return 'var(--success-color)';
      default: return 'var(--neutral-color)';
    }
  };

  const getSpikeIcon = (intensity: string): string => {
    switch (intensity) {
      case 'extreme': return '🚀';
      case 'high': return '⚡';
      case 'moderate': return '📈';
      default: return '📊';
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading volume spikes...</p>
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
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Volume Spikes Analysis</h3>
        <p className="card-subtitle">
          Detecting unusual trading volume patterns for {coinId}
        </p>
        
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          marginTop: '1rem',
          flexWrap: 'wrap'
        }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
            Intensity Filter:
          </label>
          {['moderate', 'high', 'extreme'].map((intensity) => (
            <button
              key={intensity}
              className={`btn ${intensityFilter === intensity ? 'active' : ''}`}
              onClick={() => setIntensityFilter(intensity)}
              style={{ fontSize: '0.75rem', padding: '0.5rem' }}
            >
              {intensity.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="card-body">
        {/* Summary Statistics */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ 
            padding: '1rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--danger-color)' }}>
              {data.summary.extreme_spikes}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              EXTREME
            </div>
          </div>
          <div style={{ 
            padding: '1rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--warning-color)' }}>
              {data.summary.high_spikes}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              HIGH
            </div>
          </div>
          <div style={{ 
            padding: '1rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--success-color)' }}>
              {data.summary.moderate_spikes}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              MODERATE
            </div>
          </div>
          <div style={{ 
            padding: '1rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--primary-color)' }}>
              {data.summary.avg_spike_intensity.toFixed(1)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              AVG Z-SCORE
            </div>
          </div>
        </div>

        {/* Spikes List */}
        {data.spikes.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem',
            color: 'var(--text-secondary)'
          }}>
            No volume spikes found for the selected criteria
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {data.spikes.map((spike: VolumeSpike) => (
              <div key={spike.date} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--surface)',
                borderLeft: `4px solid ${getSpikeColor(spike.spike_intensity)}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '1.5rem' }}>
                    {getSpikeIcon(spike.spike_intensity)}
                  </div>
                  <div>
                    <div style={{ 
                      fontWeight: 'var(--font-weight-bold)', 
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {spike.formatted_date}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--text-secondary)',
                      marginTop: '0.25rem'
                    }}>
                      {spike.date}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontWeight: 'var(--font-weight-bold)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {formatVolume(spike.volume)}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: spike.percentage_change_from_previous >= 0 ? 'var(--success-color)' : 'var(--danger-color)'
                    }}>
                      {spike.percentage_change_from_previous >= 0 ? '+' : ''}{spike.percentage_change_from_previous.toFixed(1)}%
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontWeight: 'var(--font-weight-bold)',
                      color: getSpikeColor(spike.spike_intensity),
                      fontSize: '0.875rem'
                    }}>
                      {spike.spike_intensity.toUpperCase()}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--text-secondary)'
                    }}>
                      Z: {spike.z_score.toFixed(2)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {spike.deviation_from_mean >= 0 ? '+' : ''}{spike.deviation_from_mean.toFixed(1)}%
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--text-secondary)'
                    }}>
                      from mean
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div style={{ 
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: 'var(--surface-2)',
          borderRadius: 'var(--radius)',
          fontSize: '0.75rem'
        }}>
          <h4 style={{ 
            margin: '0 0 0.5rem 0',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem'
          }}>
            Spike Intensity Legend:
          </h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ color: 'var(--success-color)' }}>
              📈 MODERATE: 2+ std deviations
            </div>
            <div style={{ color: 'var(--warning-color)' }}>
              ⚡ HIGH: 2.5+ std deviations
            </div>
            <div style={{ color: 'var(--danger-color)' }}>
              🚀 EXTREME: 3+ std deviations
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolumeSpikesList;