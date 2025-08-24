# Crypto Volume Tracker

A web application that tracks and compares cryptocurrency trading volumes over 7-day and 30-day periods using the CoinGecko API.

## Features

- **Volume Comparison**: Compare 7-day vs 30-day trading volumes
- **Real-time Data**: Live cryptocurrency market data via CoinGecko API
- **Smart Caching**: Redis-based caching system to minimize API calls
- **Search Functionality**: Search and select from thousands of cryptocurrencies
- **Interactive Charts**: Visual volume comparison with Recharts
- **Responsive Design**: Mobile-friendly interface

## Tech Stack

- **Backend**: Node.js, Express.js, Redis
- **Frontend**: React, TypeScript, Recharts
- **API**: CoinGecko API v3
- **Caching**: Redis with intelligent TTL management

## Getting Started

### Prerequisites

- Node.js 16+ 
- Redis server
- CoinGecko API key (optional, for higher rate limits)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd volumeTracker
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm start
```

4. **Start Redis** (if not already running)
```bash
redis-server
```

### Environment Variables

Create a `.env` file in the backend directory:

```bash
COINGECKO_API_KEY=your_api_key_here  # Optional
REDIS_URL=redis://localhost:6379
PORT=3000
NODE_ENV=development
```

## API Endpoints

### Crypto Endpoints
- `GET /api/crypto/volume-comparison/:coinId` - Get volume comparison data
- `GET /api/crypto/trending` - Get trending coins with volume data
- `GET /api/crypto/search/:query` - Search cryptocurrencies
- `GET /api/crypto/market` - Get market overview with pagination

### Analytics Endpoints
- `GET /api/analytics/volume-leaders` - Get volume gainers/losers
- `GET /api/analytics/volume-analytics` - Get market volume analytics

## Architecture

The application uses a 3-tier caching strategy:
- **Level 1**: Individual coin data (5-minute TTL)
- **Level 2**: Market overview data (15-minute TTL)  
- **Level 3**: Historical data (1-hour TTL)

## Development

### Running in Development Mode

```bash
# Backend (starts on port 3000)
cd backend && npm run dev

# Frontend (starts on port 3000)
cd frontend && npm start
```

### Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests  
cd frontend && npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.