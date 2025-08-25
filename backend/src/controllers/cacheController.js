const cacheService = require('../services/cacheService');

const getCacheStatus = async (req, res) => {
  try {
    const status = {
      isHealthy: cacheService.isHealthy(),
      isConnected: cacheService.isConnected,
      timestamp: new Date().toISOString()
    };

    if (cacheService.client) {
      // Get Redis info if available
      try {
        const info = await cacheService.client.info();
        const memory = await cacheService.client.info('memory');
        status.redis_info = {
          connected_clients: info.match(/connected_clients:(\d+)/)?.[1] || 'unknown',
          used_memory_human: memory.match(/used_memory_human:([^\r\n]+)/)?.[1] || 'unknown',
          keyspace: info.match(/db0:keys=(\d+),expires=(\d+),avg_ttl=(\d+)/)?.[0] || 'no keys'
        };
      } catch (infoError) {
        status.redis_info = { error: 'Could not retrieve Redis info' };
      }
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get cache status',
      message: error.message,
      isHealthy: false
    });
  }
};

const flushCache = async (req, res) => {
  try {
    const result = await cacheService.flush();
    res.json({
      success: result,
      message: result ? 'Cache cleared successfully' : 'Failed to clear cache',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to flush cache',
      message: error.message
    });
  }
};

const getCacheKeys = async (req, res) => {
  try {
    if (!cacheService.isHealthy()) {
      return res.status(503).json({ error: 'Cache service not available' });
    }

    const pattern = req.query.pattern || '*';
    const keys = await cacheService.client.keys(pattern);
    
    const keyDetails = await Promise.all(
      keys.slice(0, 50).map(async (key) => {
        try {
          const ttl = await cacheService.client.ttl(key);
          const type = await cacheService.client.type(key);
          return { key, ttl, type };
        } catch (error) {
          return { key, error: error.message };
        }
      })
    );

    res.json({
      total_keys: keys.length,
      showing: Math.min(keys.length, 50),
      keys: keyDetails,
      pattern: pattern
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get cache keys',
      message: error.message
    });
  }
};

const deleteCache = async (req, res) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      return res.status(400).json({ error: 'Cache key is required' });
    }

    const result = await cacheService.del(key);
    res.json({
      success: result,
      key: key,
      message: result ? 'Key deleted successfully' : 'Key not found or failed to delete'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete cache key',
      message: error.message
    });
  }
};

const testCache = async (req, res) => {
  try {
    const testKey = `cache_test_${Date.now()}`;
    const testValue = { message: 'Cache test', timestamp: new Date().toISOString() };

    // Test set
    const setResult = await cacheService.set(testKey, testValue, 'COIN_DATA');
    
    // Test get
    const getValue = await cacheService.get(testKey);
    
    // Test exists
    const exists = await cacheService.exists(testKey);
    
    // Clean up
    await cacheService.del(testKey);

    res.json({
      success: true,
      tests: {
        set: setResult,
        get: !!getValue,
        exists: exists,
        data_integrity: JSON.stringify(getValue) === JSON.stringify(testValue)
      },
      message: 'Cache test completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Cache test failed',
      message: error.message
    });
  }
};

module.exports = {
  getCacheStatus,
  flushCache,
  getCacheKeys,
  deleteCache,
  testCache
};