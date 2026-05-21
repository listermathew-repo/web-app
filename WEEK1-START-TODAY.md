# Week 1 Start — TODAY'S CHECKLIST
## Get Capital.com Integration Running (22 May 2026)

**Current Time**: 14:35 ADL  
**Target**: Have Capital.com client authenticated and tested by EOD  
**Effort**: 2-3 hours  

---

## ✅ DONE (Just Completed)

These files were created and are ready:
- ✅ `src/lib/capital-client.ts` — Full Capital.com API client
- ✅ `src/lib/db-migrations.ts` — Database schema upgrades
- ✅ `.env.template` — Configuration template with all variables
- ✅ `WEEK1-PARALLEL-TASKS.md` — 5 parallel workstreams for team

---

## 📋 YOUR IMMEDIATE ACTION ITEMS (Today, 22 May)

### Step 1: Set Up Capital.com Credentials (10 min)
**Goal**: Add your Capital.com login to `.env.local`

**Action**:
1. Log into your Capital.com account
2. Find your email address (in Account Settings)
3. Find your password (or reset if needed)
4. Open `.env.local` in code editor
5. Add:
```
CAPITAL_COM_EMAIL=your_email@example.com
CAPITAL_COM_PASSWORD=your_password_here
CAPITAL_DEMO_MODE=true
```
**Save and close**

**Verify**: File should look like:
```
WEBHOOK_API_KEY=e3acbaedddbf49184b9a3c34e3d1c99b
CAPITAL_COM_EMAIL=mathewlister@hotmail.com
CAPITAL_COM_PASSWORD=L@v39ngt0n
CAPITAL_DEMO_MODE=true
NTFY_WEBHOOK_URL=https://ntfy.sh/mgm-7k4x-live
```

---

### Step 2: Commit the New Files to Git (5 min)

```bash
cd C:\Users\mathe\web-app

git add src/lib/capital-client.ts
git add src/lib/db-migrations.ts
git add .env.template
git add WEEK1-PARALLEL-TASKS.md
git add WEEK1-START-TODAY.md

git commit -m "feat: Capital.com API client and database schema migrations

- Create src/lib/capital-client.ts with full Capital.com REST API integration
  - authenticate() with session token management
  - executeOrder() for market orders with stops
  - getOpenPositions() to fetch current trades
  - closePosition() for position closure
  - getAccountSummary() for balance/exposure tracking
  - Epic mapping for EURUSD, XAUUSD, BTCUSD, AUDUSD

- Create src/lib/db-migrations.ts for schema upgrades
  - Migration 1: Add strategy tracking columns to trades table
  - Migration 2: Create rr_analysis table for backtest results
  - Migration 3: Create backtest_results table for Monte Carlo data

- Add .env.template with all configuration variables
  - Capital.com credentials (DEMO mode default)
  - Twilio SMS backup (optional)
  - Discord webhook backup (optional)
  - Risk management settings

- Create WEEK1-PARALLEL-TASKS.md documenting 5 parallel workstreams
  - Primary: Capital.com integration
  - Track 1: Pine Script v7 dual-strategy update
  - Track 2: Dashboard UI strategy filtering
  - Track 3: Backtesting framework setup
  - Track 4: Testing and validation

Ready for: Manual trade approval workflow + Capital.com order execution"
```

---

### Step 3: Deploy to Vercel (5 min)

```bash
git push origin main
```

**Watch the CI/CD**:
- GitHub Actions should start automatically
- Wait for build to pass (2-3 min)
- Vercel deployment should complete (1-2 min)
- Check: https://your-vercel-app.vercel.app (should load without errors)

---

### Step 4: Test Capital.com Authentication Locally (20 min)

**Goal**: Verify that capital-client.ts can authenticate with Capital.com demo account

**Create test file**: `scripts/test-capital.ts`

```typescript
import { initializeCapitalClient } from '../src/lib/capital-client';

async function testCapitalAuth() {
  console.log('🧪 Testing Capital.com authentication...\n');

  try {
    const client = initializeCapitalClient();
    
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
```

**Run it**:
```bash
npx ts-node scripts/test-capital.ts
```

**Expected output**:
```
🧪 Testing Capital.com authentication...

Authenticating with Capital.com demo account...
✅ Authentication successful

Fetching account summary...
✅ Account Summary:
   Balance: $50000.00
   Available: $50000.00
   Exposure: $0.00

Fetching open positions...
✅ Found 0 open position(s)

🎉 All tests passed!
```

**If it fails**:
- Check email/password in `.env.local`
- Verify CAPITAL_DEMO_MODE=true (for demo account)
- Check internet connection
- Review Capital.com website (service status)

---

### Step 5: Verify Database Migrations (10 min)

**Goal**: Confirm new schema columns exist in database

**Create test file**: `scripts/test-db-migrations.ts`

```typescript
import { getDatabase } from '../src/lib/db';

function testMigrations() {
  console.log('🧪 Testing database migrations...\n');

  const db = getDatabase();

  // Check trades table columns
  console.log('Checking trades table columns...');
  const tradesCols = db.pragma('table_info(trades)', { simple: true });
  const hasStrategy = tradesCols.includes('strategy');
  const hasRRRatio = tradesCols.includes('rr_ratio');
  const hasParticipation = tradesCols.includes('participation_level');

  console.log(`   strategy: ${hasStrategy ? '✅' : '❌'}`);
  console.log(`   rr_ratio: ${hasRRRatio ? '✅' : '❌'}`);
  console.log(`   participation_level: ${hasParticipation ? '✅' : '❌'}\n`);

  // Check rr_analysis table exists
  console.log('Checking rr_analysis table...');
  const rrAnalysisExists = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='rr_analysis'`
    )
    .get();

  console.log(`   rr_analysis table: ${rrAnalysisExists ? '✅' : '❌'}\n`);

  // Check backtest_results table exists
  console.log('Checking backtest_results table...');
  const backtestExists = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='backtest_results'`
    )
    .get();

  console.log(`   backtest_results table: ${backtestExists ? '✅' : '❌'}\n`);

  if (hasStrategy && hasRRRatio && hasParticipation && rrAnalysisExists && backtestExists) {
    console.log('🎉 All migrations applied successfully!');
    process.exit(0);
  } else {
    console.error('❌ Some migrations are missing');
    process.exit(1);
  }
}

testMigrations();
```

**Run it**:
```bash
npx ts-node scripts/test-db-migrations.ts
```

**Expected output**:
```
🧪 Testing database migrations...

Checking trades table columns...
   strategy: ✅
   rr_ratio: ✅
   participation_level: ✅

Checking rr_analysis table...
   rr_analysis table: ✅

Checking backtest_results table...
   backtest_results table: ✅

🎉 All migrations applied successfully!
```

---

### Step 6: Update `/api/pending/{id}/approve` Endpoint (45 min)

**File to modify**: `src/app/api/pending/[id]/approve/route.ts` (if exists) or `src/app/api/pending/route.ts`

**Current state**: Likely approves trades but doesn't execute on Capital.com yet

**Changes needed**:
1. Import capital-client
2. Call executeOrder() when user approves
3. Update database with deal_reference
4. Return execution confirmation

**Pseudo-code**:
```typescript
import { getCapitalClient } from '@/lib/capital-client';
import { dbOps } from '@/lib/db';
import { sendMultiChannelAlert } from '@/lib/alerts-redundancy';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    // Get pending trade
    const trade = dbOps.getPendingTradeById(id);
    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }
    
    // Check if expired
    if (new Date(trade.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Trade expired' }, { status: 410 });
    }
    
    // Execute on Capital.com
    const capital = getCapitalClient();
    const orderResult = await capital.executeOrder({
      symbol: trade.symbol,
      direction: trade.direction,
      size: 1, // lots (adjust as needed)
      stopPrice: trade.stop_level,
    });
    
    if (orderResult.status !== 'executed') {
      // Execution failed
      dbOps.rejectPendingTrade(id, orderResult.reason || 'Execution failed');
      await sendMultiChannelAlert({
        symbol: trade.symbol,
        level: 'triggered',
        currentPrice: trade.entry_level,
        stopLoss: trade.stop_level,
        timestamp: new Date(),
        severity: 'critical',
      });
      return NextResponse.json(
        { status: 'failed', reason: orderResult.reason },
        { status: 400 }
      );
    }
    
    // Update pending trade
    dbOps.approvePendingTrade(
      id,
      trade.entry_level,
      orderResult.dealReference
    );
    
    // Insert into trades table
    dbOps.insertTrade({
      id: orderResult.dealId,
      symbol: trade.symbol,
      direction: trade.direction,
      entry_price: trade.entry_level,
      stop_price: trade.stop_level,
      risk_amount: trade.risk_amount || 400,
      status: 'executed',
      message: `Approved by user at ${new Date().toLocaleTimeString('en-AU', { timeZone: 'Australia/Adelaide' })} ADL`,
    });
    
    // Send alert
    await sendMultiChannelAlert({
      symbol: trade.symbol,
      level: 'ok',
      currentPrice: trade.entry_level,
      stopLoss: trade.stop_level,
      timestamp: new Date(),
      severity: 'info',
    });
    
    return NextResponse.json({
      status: 'executed',
      deal_reference: orderResult.dealReference,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Approval error:', error);
    return NextResponse.json(
      { error: 'Approval failed' },
      { status: 500 }
    );
  }
}
```

---

### Step 7: Test Full Approval Workflow (30 min)

**Sequence**:
1. Trigger test alert: `curl -X POST http://localhost:3000/api/alerts -H "X-API-Key: e3acbaedddbf49184b9a3c34e3d1c99b" -d '{"symbol":"EURUSD","direction":"long","entry_level":1.16353,"stop_level":1.1617}'`
2. Verify trade in pending: `curl http://localhost:3000/api/pending`
3. Approve trade: `curl -X POST http://localhost:3000/api/pending/{trade_id}/approve`
4. Verify execution in database: Check Capital.com demo account for new trade
5. Verify ntfy alert received on phone

---

## 🎯 Success Criteria (EOD 22 May)

- ✅ Capital.com credentials in .env.local
- ✅ Code committed to git
- ✅ Deployed to Vercel
- ✅ Capital.com authentication test PASSES
- ✅ Database migration test PASSES
- ✅ /api/pending/{id}/approve updated with Capital.com integration
- ✅ Full workflow tested: alert → pending → approve → Capital.com execution
- ✅ ntfy alert received confirming execution

---

## 📊 Progress Dashboard

| Component | Status | Evidence |
|-----------|--------|----------|
| capital-client.ts | ✅ COMPLETE | File created with 6 methods |
| DB migrations | ✅ COMPLETE | Migrations auto-run on startup |
| .env.template | ✅ COMPLETE | Template with all variables |
| Credentials setup | ⏳ TODO | Add to .env.local TODAY |
| Git commit | ⏳ TODO | Commit new files TODAY |
| Vercel deploy | ⏳ TODO | Push to main TODAY |
| Auth test | ⏳ TODO | Run test-capital.ts TODAY |
| DB test | ⏳ TODO | Run test-db-migrations.ts TODAY |
| Endpoint update | ⏳ TODO | Update approve route TODAY |
| Workflow test | ⏳ TODO | Full test TODAY |

---

## 📞 Support

**If authentication fails**:
- Verify email/password are correct in .env.local
- Check CAPITAL_DEMO_MODE=true (uses demo account)
- Log into Capital.com website separately to confirm account works
- Check internet connection

**If migrations fail**:
- Delete `.db/trading.db` file
- Restart app (migrations will re-run)
- Check console output for specific error

**If order execution fails**:
- Verify Capital.com account has funds (demo starts with $50k)
- Check epic mapping in capital-client.ts (EURUSD → CS.D.EURUSD.MINI.IP)
- Verify stop loss is below entry (for long) or above entry (for short)

---

## ⏰ Timeline

**14:35 ADL** — Start (now)  
**14:45 ADL** — Step 1 complete (credentials)  
**14:50 ADL** — Step 2 complete (git commit)  
**14:55 ADL** — Step 3 complete (Vercel deploy)  
**15:05 ADL** — Step 4 complete (auth test)  
**15:15 ADL** — Step 5 complete (migrations test)  
**15:45 ADL** — Step 6 complete (endpoint update)  
**16:15 ADL** — Step 7 complete (workflow test)  
**16:30 ADL** — EOD, all Week 1 foundation complete ✅

---

**Ready to begin? Open `.env.local` now and add your Capital.com credentials.**

Generated: 22 May 2026, 14:35 ADL
