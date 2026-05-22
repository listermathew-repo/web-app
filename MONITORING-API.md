# Stop Loss Monitoring API Documentation

## Overview
The monitoring API provides real-time stop loss checking for all trading instruments. These endpoints check current prices against configured stop loss levels and send URGENT alerts (Priority 5) to ntfy.sh when stops are breached.

**Base URL**: `https://your-vercel-domain.com/api/monitor`

---

## Endpoints

### 1. GET `/api/monitor/xauusd`
Monitor XAUUSD (Gold) stop loss level.

**Description**: 
- Checks current XAUUSD price against 4534.74 stop loss
- Logs status to database (alert_log table)
- Sends URGENT alert if price < 4534.74
- Returns comprehensive status report

**Request**:
```bash
curl -X GET "https://your-domain.com/api/monitor/xauusd"
```

**Response (200 - Price above stop loss)**:
```json
{
  "status": "monitoring",
  "timestamp": "2026-05-21T21:30:00.000Z",
  "response_time_ms": 45,
  "instrument": "XAUUSD",
  "currentPrice": 4516.35,
  "priceSource": "cached",
  "stopLoss": 4534.74,
  "breakout": 4570.895,
  "retap": 4555,
  "priceDistance": -18.39,
  "percentDifference": "-0.40",
  "isAboveStopLoss": false,
  "alert_triggered": true,
  "details": {
    "status_explanation": "STOP LOSS TRIGGERED: Price 4516.35 is below 4534.74",
    "action_required": "Close position immediately"
  }
}
```

**Response (503 - Stop loss triggered)**:
```json
{
  "status": "stop_loss_triggered",
  "timestamp": "2026-05-21T21:30:00.000Z",
  "response_time_ms": 42,
  "instrument": "XAUUSD",
  "currentPrice": 4516.35,
  "stopLoss": 4534.74,
  "alert_triggered": true
}
```

**Database Logging**:
- Logs to `alert_log` table with:
  - symbol: "XAUUSD"
  - level: "stop_loss_triggered" | "approaching_stop_loss" | "monitoring"
  - price: 4516.35
  - timestamp: current time

**Alert Sent** (when triggered):
- **To**: ntfy.sh/mgm-7k4x-live
- **Priority**: 5 (URGENT)
- **Title**: [ERROR] 21:30:00 ADL
- **Body**: 🔴 STOP LOSS TRIGGERED: XAUUSD @ 4516.35 (below 4534.74)

---

### 2. GET `/api/monitor/all`
Monitor all 4 instruments simultaneously.

**Description**:
- Checks EURUSD, XAUUSD, BTCUSD, AUDUSD in one call
- Compares each to their respective stop loss levels
- Sends URGENT alerts for any triggered stops
- Logs all results to database
- Returns comprehensive summary

**Instruments Monitored**:
| Symbol | Breakout | Retap | Stop Loss | Risk |
|--------|----------|-------|-----------|------|
| EURUSD | 1.16353 | 1.16260 | 1.1617 | $400 |
| XAUUSD | 4570.895 | 4555 | 4534.74 | $400 |
| BTCUSD | 78103 | 77950 | 77155 | $400 |
| AUDUSD | 0.7143 | 0.7130 | 0.7110 | $400 |

**Request**:
```bash
curl -X GET "https://your-domain.com/api/monitor/all"
```

**Response (200 - All instruments OK)**:
```json
{
  "status": "ok",
  "timestamp": "2026-05-21T21:30:00.000Z",
  "response_time_ms": 87,
  "instruments_checked": 4,
  "alerts_triggered": 1,
  "warnings": 0,
  "triggered_symbols": [
    "🔴 XAUUSD: 4516.35 (SL: 4534.74)"
  ],
  "warning_symbols": [],
  "results": {
    "EURUSD": {
      "symbol": "EURUSD",
      "displayName": "EUR/USD",
      "currentPrice": 1.1620,
      "stopLoss": 1.1617,
      "breakout": 1.16353,
      "retap": 1.16260,
      "priceDistance": 0.0003,
      "percentDifference": "0.03%",
      "isAboveStopLoss": true,
      "status": "monitoring",
      "actionRequired": "Continue monitoring"
    },
    "XAUUSD": {
      "symbol": "XAUUSD",
      "displayName": "Gold (XAU/USD)",
      "currentPrice": 4516.35,
      "stopLoss": 4534.74,
      "priceDistance": -18.39,
      "percentDifference": "-0.40%",
      "isAboveStopLoss": false,
      "status": "stop_loss_triggered",
      "actionRequired": "CLOSE POSITION IMMEDIATELY"
    },
    "BTCUSD": {
      "symbol": "BTCUSD",
      "displayName": "Bitcoin (BTC/USD)",
      "currentPrice": 77800,
      "stopLoss": 77155,
      "priceDistance": 645,
      "percentDifference": "0.84%",
      "isAboveStopLoss": true,
      "status": "monitoring",
      "actionRequired": "Continue monitoring"
    },
    "AUDUSD": {
      "symbol": "AUDUSD",
      "displayName": "AUD/USD",
      "currentPrice": 0.7115,
      "stopLoss": 0.7110,
      "priceDistance": 0.0005,
      "percentDifference": "0.07%",
      "isAboveStopLoss": true,
      "status": "monitoring",
      "actionRequired": "Continue monitoring"
    }
  },
  "summary": {
    "total_instruments": 4,
    "critical_alerts": 1,
    "warning_alerts": 0,
    "all_clear": false
  }
}
```

**Response (503 - Critical stop loss triggered)**:
```json
{
  "status": "error",
  "instruments_checked": 4,
  "alerts_triggered": 1,
  "summary": {
    "critical_alerts": 1,
    "all_clear": false
  }
}
```

**Database Logging**:
- Logs to `alert_log` table for each instrument
- Logs to `system_health` table with overall status

**Alerts Sent** (when any stop is triggered):
- **To**: ntfy.sh/mgm-7k4x-live
- **Priority**: 5 (URGENT)
- **Title**: 🔴 STOP LOSS ALERT SUMMARY
- **Body**: Lists all triggered symbols and prices

---

## Status Codes

| Code | Status | Meaning |
|------|--------|---------|
| 200 | OK | All instruments monitored, no critical alerts |
| 503 | Service Unavailable | Stop loss triggered on one or more instruments |
| 500 | Server Error | Internal error during monitoring |

---

## Alert Levels

### Status Values
- **monitoring** — Price is above stop loss, normal operation
- **approaching_stop_loss** — Price is within 0.2% of stop loss (warning)
- **stop_loss_triggered** — Price is below stop loss (critical)

### Alert Priority (ntfy.sh)
- **Priority 5 (URGENT)** — Stop loss triggered, immediate action required
- **Priority 4 (High)** — Approaching stop loss, close monitoring needed
- **Priority 3 (Normal)** — OK, routine monitoring

---

## Integration Examples

### 1. Manual Check (via cURL)
```bash
# Check single instrument
curl -X GET "https://your-domain.com/api/monitor/xauusd" \
  -H "Accept: application/json"

# Check all instruments
curl -X GET "https://your-domain.com/api/monitor/all" \
  -H "Accept: application/json"
```

### 2. Scheduled Monitoring (every 5 minutes)
Use a cron service or your app's scheduling system:
```javascript
// Example: Next.js API Route Scheduling
import cron from 'node-cron';

// Run every 5 minutes during trading hours (09:00-22:00 ADL)
cron.schedule('*/5 9-22 * * *', async () => {
  const response = await fetch('https://your-domain.com/api/monitor/all');
  const data = await response.json();
  console.log('Monitoring check:', data);
});
```

### 3. JavaScript Fetch
```javascript
// Check single instrument
async function checkXAUUSD() {
  try {
    const response = await fetch('/api/monitor/xauusd');
    const data = await response.json();
    
    if (data.alert_triggered) {
      console.log('🔴 STOP LOSS TRIGGERED:', data.details.status_explanation);
    } else {
      console.log('✅ OK:', data.details.status_explanation);
    }
    
    return data;
  } catch (error) {
    console.error('Monitoring error:', error);
  }
}

// Check all instruments
async function checkAllInstruments() {
  try {
    const response = await fetch('/api/monitor/all');
    const data = await response.json();
    
    if (data.alerts_triggered > 0) {
      console.log('🔴 CRITICAL ALERTS:', data.triggered_symbols);
    } else {
      console.log('✅ ALL CLEAR');
    }
    
    return data;
  } catch (error) {
    console.error('Monitoring error:', error);
  }
}
```

---

## Database Logging

### alert_log Table
Logs every monitoring check:
```sql
INSERT INTO alert_log (symbol, level, price, timestamp)
VALUES ('XAUUSD', 'stop_loss_triggered', 4516.35, CURRENT_TIMESTAMP);
```

### system_health Table
Logs overall monitoring health:
```sql
INSERT INTO system_health (component, status, message, last_check)
VALUES ('xauusd_monitor', 'error', 'XAUUSD @ 4516.35 (SL: 4534.74)', CURRENT_TIMESTAMP);
```

---

## Configuration

Edit configuration in the route files:

**For XAUUSD** (`src/app/api/monitor/xauusd/route.ts`):
```typescript
const XAUUSD_CONFIG = {
  symbol: 'XAUUSD',
  breakout: 4570.895,
  retap: 4555,
  stopLoss: 4534.74,  // ← Change this value
  risk: 400,
};
```

**For All Instruments** (`src/app/api/monitor/all/route.ts`):
```typescript
const INSTRUMENTS: Record<string, InstrumentConfig> = {
  EURUSD: { /* ... */ stopLoss: 1.1617 },
  XAUUSD: { /* ... */ stopLoss: 4534.74 },
  BTCUSD: { /* ... */ stopLoss: 77155 },
  AUDUSD: { /* ... */ stopLoss: 0.7110 },
};
```

---

## Notes

1. **Price Source**: Currently uses cached prices (mock data). Integrate Capital.com API for real-time prices.
2. **Timeout**: Default fetch timeout is 5 seconds. Adjust if needed.
3. **Alert Frequency**: Alerts are sent each time monitoring detects a triggered stop. Use ntfy filtering to avoid duplicates.
4. **Database**: All checks are logged to `alert_log` and `system_health` tables for audit trail.
5. **Paper Trading**: With `SIMULATE_TRADES=true` in `.env`, no real positions are at risk during testing.

---

## Troubleshooting

### Alert not sent
- Check ntfy.sh topic is correct: `mgm-7k4x-live`
- Verify `sendAlert` function is working in `src/lib/alerts.ts`
- Check network connectivity

### Price not updating
- Currently uses cached prices for demo
- Implement Capital.com API integration to get real-time prices
- See `Implement Capital.com client integration` in TODO list

### Database logging errors
- Verify `better-sqlite3` is installed: `npm list better-sqlite3`
- Check `.db/trading.db` file exists and is writable
- Verify schema is initialized (check `initializeDatabase()` in `src/lib/db.ts`)

---

## Next Steps

1. ✅ Create monitoring routes (`/api/monitor/xauusd`, `/api/monitor/all`)
2. ✅ Add database logging (alert_log, system_health)
3. ✅ Implement ntfy alerts
4. ⏳ Set up scheduled execution (every 5 minutes)
5. ⏳ Integrate Capital.com API for real-time prices
6. ⏳ Create dashboard UI to visualize monitoring status
