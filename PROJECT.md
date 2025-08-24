# Crypto Volume Tracker - 7 Days vs 30 Days Analysis

## Project Overview
A web application that tracks and compares cryptocurrency trading volumes over 7-day and 30-day periods using the CoinGecko API. The app provides visual analytics and comparison tools to help users analyze volume trends.

## Tech Stack
- **Backend**: Node.js with Express.js
- **Frontend**: React
- **API**: CoinGecko API
- **Database**: Redis (for caching) + PostgreSQL/MongoDB (for data persistence)
- **Deployment**: Docker containers

## Core Features

### 1. Volume Comparison Dashboard
- Side-by-side comparison of 7-day vs 30-day volume data
- Percentage change calculations
- Visual charts and graphs (Chart.js or D3.js)
- Top gainers/losers by volume change

### 2. Cryptocurrency Search & Selection
- Search functionality for cryptocurrencies
- Favorite/watchlist management
- Popular coins quick-select
- Market cap and price integration

### 3. Data Visualization
- Interactive charts showing volume trends
- Heatmaps for volume comparison
- Historical volume data overlay
- Export data to CSV/JSON

### 4. Caching Strategy
- **Redis Cache**: Store API responses with TTL
- **Cache Layers**:
  - Level 1: Individual coin data (5-minute TTL)
  - Level 2: Market overview data (15-minute TTL)
  - Level 3: Historical data (1-hour TTL)
- **Rate Limiting**: Smart request batching to stay within API limits

## Architecture

### Backend Structure
```
backend/
├── src/
│ ├── controllers/
│ │ ├── cryptoController.js
│ │ └── cacheController.js
│ ├── services/
│ │ ├── coinGeckoService.js
│ │ ├── cacheService.js
│ │ └── dataProcessor.js
│ ├── middleware/
│ │ ├── rateLimiter.js
│ │ └── errorHandler.js
│ ├── routes/
│ │ ├── crypto.js
│ │ └── analytics.js
│ ├── config/
│ │ ├── database.js
│ │ └── cache.js
│ └── app.js
├── package.json
└── Dockerfile
```

### Frontend Structure
```
frontend/
├── src/
│ ├── components/
│ │ ├── Dashboard/
│ │ ├── VolumeComparison/
│ │ ├── CoinSearch/
│ │ └── Charts/
│ ├── services/
│ │ ├── apiService.js
│ │ └── dataUtils.js
│ ├── hooks/
│ │ ├── useCryptoData.js
│ │ └── useCache.js
│ ├── pages/
│ │ ├── Home.js
│ │ ├── Analytics.js
│ │ └── Watchlist.js
│ └── App.js
├── package.json
└── Dockerfile
```

## API Endpoints

### Backend API Routes
- `GET /api/crypto/volume-comparison/:coinId` - Get 7d vs 30d volume data
- `GET /api/crypto/trending` - Get trending coins by volume change
- `GET /api/crypto/search/:query` - Search cryptocurrencies
- `GET /api/crypto/watchlist` - Get user watchlist
- `POST /api/crypto/watchlist` - Add to watchlist
- `GET /api/analytics/volume-leaders` - Top volume gainers/losers

### CoinGecko API Integration
- `/coins/markets` - Market data with volume
- `/coins/{id}/market_chart` - Historical volume data
- `/coins/{id}` - Detailed coin information
- `/search` - Coin search functionality

## Caching Implementation

### Cache Strategy
```javascript
// Cache hierarchy with different TTL values
const CACHE_CONFIG = {
  COIN_DATA: { ttl: 300 }, // 5 minutes
  MARKET_DATA: { ttl: 900 }, // 15 minutes
  HISTORICAL_DATA: { ttl: 3600 }, // 1 hour
  SEARCH_RESULTS: { ttl: 1800 } // 30 minutes
};
```

### Rate Limiting Solution
- Request queue with priority system
- Batch API calls where possible
- Intelligent cache warming
- Fallback to cached data when rate limited

## Database Schema

### PostgreSQL Tables
```sql
-- Coins table
CREATE TABLE coins (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100),
  symbol VARCHAR(10),
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Volume data table
CREATE TABLE volume_data (
  id SERIAL PRIMARY KEY,
  coin_id VARCHAR(50) REFERENCES coins(id),
  volume_24h DECIMAL,
  volume_7d DECIMAL,
  volume_30d DECIMAL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- User watchlists
CREATE TABLE watchlists (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50),
  coin_id VARCHAR(50) REFERENCES coins(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Development Phases

### Phase 1: Backend Foundation (Week 1-2)
- Set up Express.js server
- Implement CoinGecko API integration
- Create caching layer with Redis
- Build core API endpoints

### Phase 2: Frontend Development (Week 2-3)
- Set up React application
- Create volume comparison components
- Implement search and watchlist features
- Build responsive UI

### Phase 3: Data Visualization (Week 3-4)
- Integrate charting library
- Create comparison dashboards
- Add interactive features
- Implement data export

### Phase 4: Optimization & Deployment (Week 4-5)
- Performance optimization
- Error handling and logging
- Docker containerization
- Production deployment

## Environment Variables
```bash
# Backend
COINGECKO_API_KEY=your_api_key
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@localhost/volumetracker
PORT=3000

# Frontend
REACT_APP_API_URL=http://localhost:3000/api
```

## Performance Considerations
- Implement pagination for large datasets
- Use React.memo for expensive components
- Lazy loading for charts and heavy components
- CDN for static assets
- Gzip compression for API responses

## Monitoring & Analytics
- API response time tracking
- Cache hit/miss ratios
- Rate limiting metrics
- User engagement analytics
- Error logging and alerting

## Future Enhancements
- Real-time WebSocket updates
- Mobile app version
- Advanced technical indicators
- Portfolio tracking integration
- Social trading features
- Premium subscription tier

## Getting Started
1. Clone the repository
2. Install dependencies: `npm install` (both frontend and backend)
3. Set up Redis and PostgreSQL
4. Configure environment variables
5. Run: `npm run dev` (starts both frontend and backend)

## API Rate Limits
- CoinGecko Free: 10-50 requests/minute
- Implement smart caching to maximize efficiency
- Use batch requests where possible
- Monitor usage with built-in analytics