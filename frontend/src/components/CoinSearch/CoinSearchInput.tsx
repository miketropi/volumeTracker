import React, { useState, useCallback, useEffect } from 'react';
import apiService from '../../services/apiService';

interface SearchResult {
  id: string;
  name: string;
  symbol: string;
  thumb?: string;
  market_cap_rank?: number;
}

interface CoinSearchInputProps {
  onCoinSelect: (coinId: string) => void;
  placeholder?: string;
}

const CoinSearchInput: React.FC<CoinSearchInputProps> = ({ 
  onCoinSelect, 
  placeholder = "Search cryptocurrencies..." 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchCoins = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.searchCoins(searchQuery);
      setResults(response.coins || []);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchCoins(query);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [query, searchCoins]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleCoinSelect = (coinId: string, coinName: string) => {
    setQuery(coinName);
    setShowResults(false);
    onCoinSelect(coinId);
  };

  const handleInputBlur = () => {
    setTimeout(() => setShowResults(false), 200);
  };

  return (
    <div className="coin-search-container" style={{ position: 'relative' }}>
      <div className="search-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder={placeholder}
          className="search-input"
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '16px',
            border: '2px solid #e1e5e9',
            borderRadius: '8px',
            outline: 'none',
            transition: 'border-color 0.2s ease'
          }}
        />
        {isLoading && (
          <div className="loading-spinner" style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}>
            ⏳
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="search-results" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #e1e5e9',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {results.slice(0, 8).map((coin) => (
            <div
              key={coin.id}
              onClick={() => handleCoinSelect(coin.id, coin.name)}
              className="search-result-item"
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid #f1f3f4',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {coin.thumb && (
                <img 
                  src={coin.thumb} 
                  alt={coin.name}
                  style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                />
              )}
              <div>
                <div style={{ fontWeight: '500', fontSize: '14px' }}>
                  {coin.name}
                </div>
                <div style={{ color: '#6c757d', fontSize: '12px' }}>
                  {coin.symbol.toUpperCase()}
                  {coin.market_cap_rank && ` • Rank #${coin.market_cap_rank}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoinSearchInput;