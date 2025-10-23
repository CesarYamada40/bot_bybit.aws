// Simple API test script for Render deployment verification
// Run with: node test-api.js [base-url]
// Example: node test-api.js https://your-app.onrender.com

const baseUrl = process.argv[2] || 'http://localhost:10000';

async function testEndpoint(path, description) {
  console.log(`\n📝 Testing: ${description}`);
  console.log(`   URL: ${baseUrl}${path}`);
  
  try {
    const response = await fetch(`${baseUrl}${path}`);
    const status = response.status;
    const data = await response.json();
    
    console.log(`   ✅ Status: ${status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2).split('\n').map(line => `      ${line}`).join('\n').trimStart());
    
    return { success: true, status, data };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing API endpoints on Render');
  console.log(`   Base URL: ${baseUrl}`);
  console.log('='.repeat(60));
  
  const results = [];
  
  // Test 1: Health check
  results.push(await testEndpoint('/health', 'Health Check'));
  
  // Test 2: Bybit public API proxy
  results.push(await testEndpoint('/api/bybit-proxy?symbol=BTCUSDT', 'Bybit Public Market Data (BTCUSDT)'));
  
  // Test 3: Bybit auth debug endpoint
  results.push(await testEndpoint('/bybit-auth-debug', 'Bybit Auth Debug (requires BYBIT_KEY/SECRET env vars)'));
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary:');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`   ✅ Successful: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  if (successful === results.length) {
    console.log('\n🎉 All tests passed! API is ready for Render deployment.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
  
  console.log('\n💡 Notes:');
  console.log('   - /health should always return {"status":"ok"}');
  console.log('   - /api/bybit-proxy may fail if network is restricted');
  console.log('   - /bybit-auth-debug requires BYBIT_KEY and BYBIT_SECRET env vars');
  console.log('   - Set these secrets in Render dashboard before testing auth');
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
