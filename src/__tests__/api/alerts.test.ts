import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { POST, GET, OPTIONS } from '@/app/api/alerts/route';
import { NextRequest } from 'next/server';

// Mock the database and alerts modules
vi.mock('@/lib/db');
vi.mock('@/lib/alerts');

describe('POST /api/alerts - Trade Alert Webhook', () => {
  it('should reject requests without X-API-Key header (401)', async () => {
    const request = new NextRequest('http://localhost:3000/api/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symbol: 'EURUSD',
        direction: 'long',
        entry_level: 1.1635,
        stop_level: 1.1617,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should reject requests with invalid X-API-Key (401)', async () => {
    const request = new NextRequest('http://localhost:3000/api/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'wrong-key-12345',
      },
      body: JSON.stringify({
        symbol: 'EURUSD',
        direction: 'long',
        entry_level: 1.1635,
        stop_level: 1.1617,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should accept valid trade alert with correct API key (202)', async () => {
    const validKey = process.env.WEBHOOK_API_KEY || 'test-key';
    const request = new NextRequest('http://localhost:3000/api/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': validKey,
      },
      body: JSON.stringify({
        symbol: 'EURUSD',
        direction: 'long',
        entry_level: 1.16353,
        stop_level: 1.1617,
        retap_level: 1.16260,
        risk_amount: 400,
        scenario: 'Breakout Entry',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(202);
    const data = await response.json();
    expect(data.status).toBe('accepted');
    expect(data.trade_id).toBeDefined();
  });

  it('should reject malformed JSON (400)', async () => {
    const validKey = process.env.WEBHOOK_API_KEY || 'test-key';
    const request = new NextRequest('http://localhost:3000/api/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': validKey,
      },
      body: 'invalid-json{',
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should validate schema (missing required fields)', async () => {
    const validKey = process.env.WEBHOOK_API_KEY || 'test-key';
    const request = new NextRequest('http://localhost:3000/api/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': validKey,
      },
      body: JSON.stringify({
        symbol: 'EURUSD',
        // missing direction, entry_level, stop_level
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

describe('GET /api/alerts - Fetch Alert Levels', () => {
  it('should return alert levels', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.eurusd).toBeDefined();
    expect(data.xauusd).toBeDefined();
    expect(data.btcusd).toBeDefined();
  });

  it('should have CORS headers', async () => {
    const response = await GET();
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });
});

describe('OPTIONS /api/alerts - CORS Preflight', () => {
  it('should return 200 with CORS headers', async () => {
    const response = await OPTIONS();
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('X-API-Key');
  });
});
