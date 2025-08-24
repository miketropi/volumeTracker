import React, { useState, useEffect } from 'react';
import apiService, { Coin } from '../../services/apiService';

const MarketOverview: React.FC = () => {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.getMarketOverview(page, 25);
      setCoins(response.coins);
    } catch (err) {
      setError('Failed to fetch market data');
      console.error('Error fetching market data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData(currentPage);
  }, [currentPage]);

  const formatNumber = (num: number, isCurrency: boolean = false) => {
    if (num >= 1e12) return `${isCurrency ? '$' : ''}${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${isCurrency ? '$' : ''}${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${isCurrency ? '$' : ''}${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${isCurrency ? '$' : ''}${(num / 1e3).toFixed(2)}K`;
    return `${isCurrency ? '$' : ''}${num.toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading market overview...</p>
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

  return (
    <div className="market-overview card">
      <div className="card-header">
        <h2 className="card-title">Market Overview - Volume Analysis</h2>
        <p className="card-subtitle">Real-time cryptocurrency volume comparison data</p>
      </div>

      <div className="card-body" style={{ padding: 0 }}>
        <table className="market-overview">
          <thead>
            <tr>
              <th>Cryptocurrency</th>
              <th style={{ textAlign: 'right' }}>Price</th>
              <th style={{ textAlign: 'right' }}>24h Volume</th>
              <th style={{ textAlign: 'right' }}>7d Est.</th>
              <th style={{ textAlign: 'right' }}>30d Est.</th>
              <th style={{ textAlign: 'right' }}>Vol Change</th>
              <th style={{ textAlign: 'right' }}>7d Price</th>
            </tr>
          </thead>
          <tbody>
            {coins.map((coin, index) => (
              <tr key={coin.id}>
                <td>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem'
                  }}>
                    <img 
                      src={coin.image} 
                      alt={coin.name}
                      style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%',
                        border: '1px solid var(--border)'
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 'var(--font-weight-bold)' }}>
                        {coin.name}
                      </div>
                      <div style={{ 
                        color: 'var(--text-secondary)', 
                        fontSize: '0.75rem',
                        textTransform: 'uppercase'
                      }}>
                        {coin.symbol}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {formatNumber(coin.current_price, true)}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {formatNumber(coin.volume_24h, true)}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {formatNumber(coin.estimated_volume_7d, true)}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {formatNumber(coin.estimated_volume_30d, true)}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className={coin.volume_change_7d_to_30d >= 0 ? 'positive' : 'negative'}>
                    {formatPercentage(coin.volume_change_7d_to_30d)}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className={coin.price_change_7d >= 0 ? 'positive' : 'negative'}>
                    {formatPercentage(coin.price_change_7d)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ 
          padding: '1.5rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-mono)'
          }}>
            Showing {coins.length} cryptocurrencies • Page {currentPage}
          </div>
          
          <div style={{ 
            display: 'flex',
            gap: '0.5rem'
          }}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary"
              style={{
                opacity: currentPage === 1 ? 0.5 : 1,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className="btn btn-primary"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;