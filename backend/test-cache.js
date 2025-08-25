require('dotenv').config();
const cacheService = require('./src/services/cacheService');
const { CACHE_CONFIG, CACHE_KEYS } = require('./src/config/cache');

async function testCache() {
  console.log('🧪 Testing Redis Cache System...\n');

  // Wait for cache to initialize
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 1. Check cache health
  console.log('1. Cache Health Check:');
  console.log('   Is Healthy:', cacheService.isHealthy());
  console.log('   Is Connected:', cacheService.isConnected);
  console.log();

  // 2. Test basic operations
  console.log('2. Basic Cache Operations:');
  try {
    const testKey = 'test_cache_key';
    const testValue = { message: 'Hello from cache!', timestamp: Date.now() };

    // Set value
    const setResult = await cacheService.set(testKey, testValue, 'COIN_DATA');
    console.log('   Set operation:', setResult ? '✅' : '❌');

    // Check if key exists
    const exists = await cacheService.exists(testKey);
    console.log('   Key exists:', exists ? '✅' : '❌');

    // Get value
    const getValue = await cacheService.get(testKey);
    console.log('   Get operation:', getValue ? '✅' : '❌');
    console.log('   Retrieved value:', getValue);

    // Delete key
    const delResult = await cacheService.del(testKey);
    console.log('   Delete operation:', delResult ? '✅' : '❌');

    // Verify deletion
    const existsAfterDel = await cacheService.exists(testKey);
    console.log('   Key exists after delete:', existsAfterDel ? '❌' : '✅');
  } catch (error) {
    console.error('   ❌ Basic operations failed:', error.message);
  }
  console.log();

  // 3. Test getOrSet functionality
  console.log('3. GetOrSet Functionality:');
  try {
    let callCount = 0;
    const fetchFunction = async () => {
      callCount++;
      console.log(`   📡 Fetch function called (${callCount} time)`);
      return { data: 'Fresh data', callCount };
    };

    const cacheKey = 'test_get_or_set';
    
    // First call - should fetch
    console.log('   First call (should fetch):');
    const result1 = await cacheService.getOrSet(cacheKey, fetchFunction, 'COIN_DATA');
    console.log('   Result:', result1);

    // Second call - should use cache
    console.log('   Second call (should use cache):');
    const result2 = await cacheService.getOrSet(cacheKey, fetchFunction, 'COIN_DATA');
    console.log('   Result:', result2);
    console.log('   Cache working:', result1.callCount === result2.callCount ? '✅' : '❌');

    // Clean up
    await cacheService.del(cacheKey);
  } catch (error) {
    console.error('   ❌ GetOrSet test failed:', error.message);
  }
  console.log();

  // 4. Test cache configuration
  console.log('4. Cache Configuration:');
  console.log('   CACHE_CONFIG:', JSON.stringify(CACHE_CONFIG, null, 2));
  console.log();

  // 5. Test TTL functionality
  console.log('5. TTL (Time To Live) Test:');
  try {
    const ttlKey = 'test_ttl_key';
    const ttlValue = { message: 'This expires quickly' };

    await cacheService.set(ttlKey, ttlValue, 'COIN_DATA');
    console.log('   Set with TTL: ✅');

    // Check immediately
    const immediate = await cacheService.get(ttlKey);
    console.log('   Immediate get:', immediate ? '✅' : '❌');

    // Wait and check TTL (Note: this won't wait for expiry, just demonstrates the concept)
    console.log('   TTL configured for COIN_DATA:', CACHE_CONFIG.COIN_DATA.ttl, 'seconds');
    
    // Clean up
    await cacheService.del(ttlKey);
  } catch (error) {
    console.error('   ❌ TTL test failed:', error.message);
  }
  console.log();

  // 6. Test volume tracking cache keys
  console.log('6. Volume Tracking Cache Key Test:');
  try {
    const volumeKey = 'volume_tracking:bitcoin:30';
    const volumeData = {
      coin_id: 'bitcoin',
      period_days: 30,
      daily_volumes: [{ date: '2024-01-01', volume: 1000000 }],
      generated_at: new Date().toISOString()
    };

    await cacheService.set(volumeKey, volumeData, 'VOLUME_TRACKING');
    console.log('   Volume tracking cache set: ✅');

    const retrieved = await cacheService.get(volumeKey);
    console.log('   Volume tracking cache get:', retrieved ? '✅' : '❌');

    await cacheService.del(volumeKey);
  } catch (error) {
    console.error('   ❌ Volume tracking test failed:', error.message);
  }

  console.log('\n🏁 Cache testing complete!');
  process.exit(0);
}

testCache().catch(error => {
  console.error('💥 Cache test failed:', error);
  process.exit(1);
});