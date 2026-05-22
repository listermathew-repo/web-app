import { getCapitalClient } from '../src/lib/capital-client';

async function testCapitalAuth() {
  console.log('🧪 Testing Capital.com authentication...\n');

  try {
    const client = getCapitalClient();

    console.log('Authenticating with Capital.com demo account...');
    const authSuccess = await client.authenticate();

    if (!authSuccess) {
      console.error('❌ Authentication FAILED');
      console.error('Check CAPITAL_COM_EMAIL and CAPITAL_COM_PASSWORD in .env.local');
      process.exit(1);
    }

    console.log('✅ Authentication successful\n');

    // Test account summary
    console.log('Fetching account summary...');
    const summary = await client.getAccountSummary();

    if (summary) {
      console.log('✅ Account Summary:');
      console.log(`   Balance: $${summary.balance.toFixed(2)}`);
      console.log(`   Available: $${summary.available.toFixed(2)}`);
      console.log(`   Exposure: $${summary.exposure.toFixed(2)}\n`);
    } else {
      console.log('⚠️  Could not fetch account summary\n');
    }

    // Test open positions
    console.log('Fetching open positions...');
    const positions = await client.getOpenPositions();
    console.log(`✅ Found ${positions.length} open position(s)\n`);

    if (positions.length > 0) {
      positions.forEach(p => {
        console.log(`   ${p.symbol} ${p.direction.toUpperCase()}`);
        console.log(`   Entry: $${p.entryPrice.toFixed(2)}`);
        console.log(`   Current: $${p.currentPrice.toFixed(2)}`);
        console.log(`   P&L: $${p.profitLoss.toFixed(2)} (${p.profitLossPercent.toFixed(2)}%)\n`);
      });
    }

    console.log('🎉 All tests passed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testCapitalAuth();
