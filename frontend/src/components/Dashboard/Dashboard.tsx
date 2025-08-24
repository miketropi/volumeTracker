import React, { useState, useEffect } from 'react';
import CoinSearchInput from '../CoinSearch/CoinSearchInput';
import VolumeComparisonChart from '../VolumeComparison/VolumeComparisonChart';
import VolumeTrackingChart from '../VolumeTracking/VolumeTrackingChart';
import VolumeSpikesList from '../VolumeTracking/VolumeSpikesList';
import VolumeHeatmap from '../VolumeTracking/VolumeHeatmap';
import MarketOverview from './MarketOverview';
import apiService, { VolumeComparisonData } from '../../services/apiService';

const Dashboard: React.FC = () => {
  const [selectedCoinId, setSelectedCoinId] = useState<string>('bitcoin');
  const [volumeData, setVolumeData] = useState<VolumeComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'comparison' | 'tracking' | 'spikes' | 'heatmap'>('comparison');

  const fetchVolumeData = async (coinId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getVolumeComparison(coinId);
      setVolumeData(data);
    } catch (err) {
      setError('Failed to fetch volume data. Please try again.');
      console.error('Error fetching volume data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCoinId) {
      fetchVolumeData(selectedCoinId);
    }
  }, [selectedCoinId]);

  const handleCoinSelect = (coinId: string) => {
    setSelectedCoinId(coinId);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">
          Crypto Volume Tracker
        </h1>
        <p className="dashboard-subtitle">
          7-day vs 30-day volume analysis with real-time data
        </p>
        
        <div className="coin-search-container">
          <CoinSearchInput 
            onCoinSelect={handleCoinSelect}
            placeholder="Search cryptocurrencies..."
          />
        </div>

        <div className="dashboard-controls">
          {['bitcoin', 'ethereum', 'solana'].map((coinId) => (
            <button
              key={coinId}
              onClick={() => handleCoinSelect(coinId)}
              className={`btn ${selectedCoinId === coinId ? 'btn-primary' : 'btn-secondary'}`}
            >
              {coinId.charAt(0).toUpperCase() + coinId.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          marginTop: '1.5rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {[
            { key: 'comparison', label: 'Volume Comparison' },
            { key: 'tracking', label: 'Daily Tracking' },
            { key: 'spikes', label: 'Volume Spikes' },
            { key: 'heatmap', label: 'Activity Heatmap' }
          ].map((view) => (
            <button
              key={view.key}
              onClick={() => setActiveView(view.key as any)}
              className={`btn ${activeView === view.key ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.875rem' }}
            >
              {view.label}
            </button>
          ))}
        </div>
      </header>

      <div className="dashboard-content">
        {isLoading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading volume data...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <strong>Error</strong>
            <p>{error}</p>
          </div>
        )}

        {/* Volume Analysis Views */}
        {activeView === 'comparison' && volumeData && !isLoading && (
          <div style={{ marginBottom: '2rem' }}>
            <VolumeComparisonChart data={volumeData} />
          </div>
        )}

        {activeView === 'tracking' && (
          <div style={{ marginBottom: '2rem' }}>
            <VolumeTrackingChart coinId={selectedCoinId} />
          </div>
        )}

        {activeView === 'spikes' && (
          <div style={{ marginBottom: '2rem' }}>
            <VolumeSpikesList coinId={selectedCoinId} />
          </div>
        )}

        {activeView === 'heatmap' && (
          <div style={{ marginBottom: '2rem' }}>
            <VolumeHeatmap coinId={selectedCoinId} />
          </div>
        )}

        {/* Market Overview - Always show */}
        <MarketOverview />
      </div>
    </div>
  );
};

export default Dashboard;