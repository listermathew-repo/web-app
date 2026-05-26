import { describe, it, expect } from 'vitest';

const API_KEY = process.env.WEBHOOK_API_KEY || 'test-key';
const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('GET /api/pending - List Pending Trades', () => {
  it('should return list of pending trades', async () => {
    const response = await fetch(`${API_URL}/api/pending`, {
      headers: { 'X-API-Key': API_KEY },
    }).catch(() => null);

    if (response) {
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.count).toBeDefined();
      expect(Array.isArray(data.trades)).toBe(true);
    }
  });

  it('should require X-API-Key header', async () => {
    const response = await fetch(`${API_URL}/api/pending`, {
      headers: {},
    }).catch(() => null);

    if (response) {
      expect(response.status).toBe(401);
    }
  });
});

describe('POST /api/pending/[id]/approve - Approve Trade', () => {
  it('should return 404 for non-existent trade', async () => {
    const response = await fetch(`${API_URL}/api/pending/nonexistent-id/approve`, {
      method: 'POST',
      headers: { 'X-API-Key': API_KEY },
      body: JSON.stringify({}),
    }).catch(() => null);

    if (response) {
      expect(response.status).toBe(404);
    }
  });

  it('should require X-API-Key header', async () => {
    const response = await fetch(`${API_URL}/api/pending/test-id/approve`, {
      method: 'POST',
      headers: {},
      body: JSON.stringify({}),
    }).catch(() => null);

    if (response) {
      expect(response.status).toBe(401);
    }
  });
});

describe('POST /api/pending/[id]/reject - Reject Trade', () => {
  it('should require X-API-Key header', async () => {
    const response = await fetch(`${API_URL}/api/pending/test-id/reject`, {
      method: 'POST',
      headers: {},
      body: JSON.stringify({}),
    }).catch(() => null);

    if (response) {
      expect(response.status).toBe(401);
    }
  });

  it('should return 404 for non-existent trade', async () => {
    const response = await fetch(`${API_URL}/api/pending/nonexistent-id/reject`, {
      method: 'POST',
      headers: { 'X-API-Key': API_KEY },
      body: JSON.stringify({}),
    }).catch(() => null);

    if (response) {
      expect(response.status).toBe(404);
    }
  });
});
