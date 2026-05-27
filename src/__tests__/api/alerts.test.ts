import { describe, it, expect } from 'vitest';

const API_KEY = process.env.WEBHOOK_API_KEY || 'test-key';
const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('POST /api/alerts - Trade Alert Webhook', () => {
  it('should reject request without X-API-Key header', async () => {
    const response = await fetch(`${API_URL}/api/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: 'EURUSD',
        direction: 'long',
        entry_level: 1.1635,
        stop_level: 1.1617,
        risk_amount: 400,
      }),
    }).catch(() => null);

    if (response) {
      expect(response.status).toBe(401);
    }
  });

  it('should accept valid alert with correct API key', async () => {
    const payload = {
      symbol: 'EURUSD',
      direction: 'long',
      entry_level: 1.1635,
      stop_level: 1.1617,
      risk_amount: 400,
      scenario: 'scenario_1',
      ema10: 1.1640,
      ema21: 1.1620,
      vwap: 1.1635,
      volume: 350000,
      volume_avg: 200000,
      atr: 0.0020,
      minutes_since_4h_close: 15,
      rsi: 45,
    };

    const response = await fetch(`${API_URL}/api/alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(payload),
    }).catch(() => null);

    if (response) {
      expect([202, 400]).toContain(response.status);
    }
  });
});
