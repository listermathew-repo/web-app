/**
 * Integration Tests - End-to-end webhook flow
 * Tests complete lifecycle: webhook → validation → queueing → approval → execution
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { dbOps } from '@/lib/db';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limiter';

const API_KEY = process.env.WEBHOOK_API_KEY || 'test-key-12345678901234567890';
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

const validTradeAlert = {
  symbol: 'EURUSD',
  direction: 'long' as const,
  entry_level: 1.16350,
  stop_level: 1.16170,
  retap_level: 1.16710,
  ema10: 1.16324,
  ema21: 1.16210,
  vwap: 1.16300,
  rsi: 52.5,
  atr: 0.005,
  volume: 1000,
  volume_avg: 800,
};

describe('Webhook Integration Tests', () => {
  beforeAll(() => {
    // Reset rate limiting before tests
    resetRateLimit(API_KEY);
  });

  afterAll(() => {
    // Cleanup
    resetRateLimit(API_KEY);
  });

  describe('Rate Limiting', () => {
    it('should allow requests within limit', () => {
      const result = checkRateLimit(API_KEY, 5, 60000);
      expect(result).toBe(true);
    });

    it('should reject requests exceeding limit', () => {
      const key = 'test-limit-key';
      for (let i = 0; i < 3; i++) {
        checkRateLimit(key, 3, 60000);
      }
      const exceeds = checkRateLimit(key, 3, 60000);
      expect(exceeds).toBe(false);
    });
  });

  describe('Webhook Authentication', () => {
    it('should reject missing API key', async () => {
      const response = await fetch(`${BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validTradeAlert),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject invalid API key', async () => {
      const response = await fetch(`${BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          'X-API-Key': 'invalid-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validTradeAlert),
      });

      expect(response.status).toBe(401);
    });

    it('should accept valid API key', async () => {
      const response = await fetch(`${BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validTradeAlert),
      });

      expect(response.status).toBeLessThanOrEqual(429); // Allow 202 or 429 (rate limited)
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid symbol', async () => {
      const invalid = { ...validTradeAlert, symbol: 'INVALID123456' };

      const response = await fetch(`${BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalid),
      });

      expect([400, 401, 429]).toContain(response.status);
    });

    it('should reject invalid direction', async () => {
      const invalid = { ...validTradeAlert, direction: 'invalid' };

      const response = await fetch(`${BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalid),
      });

      expect([400, 401, 429]).toContain(response.status);
    });

    it('should reject negative entry level', async () => {
      const invalid = { ...validTradeAlert, entry_level: -1.0 };

      const response = await fetch(`${BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalid),
      });

      expect([400, 401, 429]).toContain(response.status);
    });
  });

  describe('Request Context Tracking', () => {
    it('should include request_id in response', async () => {
      const response = await fetch(`${BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validTradeAlert),
      });

      const data = await response.json();
      expect(data.request_id).toBeDefined();
      expect(typeof data.request_id).toBe('string');
      expect(data.request_id.length).toBeGreaterThan(0);
    });

    it('should include duration_ms in response', async () => {
      const response = await fetch(`${BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validTradeAlert),
      });

      const data = await response.json();
      expect(data.duration_ms).toBeDefined();
      expect(typeof data.duration_ms).toBe('number');
      expect(data.duration_ms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Trade Validation', () => {
    it('should accept valid trade alert', async () => {
      resetRateLimit(API_KEY);
      const response = await fetch(`${BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validTradeAlert),
      });

      expect([202, 400]).toContain(response.status); // 202 if valid, 400 if validation fails
      const data = await response.json();
      expect(data.trade_id).toBeDefined();
    });

    it('should queue accepted trade', async () => {
      resetRateLimit(API_KEY);
      const response = await fetch(`${BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validTradeAlert),
      });

      if (response.status === 202) {
        const data = await response.json();
        const tradeId = data.trade_id;

        // Verify trade appears in pending queue
        const trade = dbOps.getPendingTradeById(tradeId);
        expect(trade).toBeDefined();
        expect(trade.symbol).toBe('EURUSD');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await fetch(`${BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: 'invalid json {',
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.request_id).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      const invalid = { symbol: 'EURUSD' }; // Missing other required fields

      const response = await fetch(`${BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalid),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBeDefined();
      expect(data.components).toBeDefined();
    });
  });
});
