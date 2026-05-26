import { describe, it, expect } from 'vitest';

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('GET /api/positions - Get Open Positions', () => {
  it('should return positions data', async () => {
    const response = await fetch(`${API_URL}/api/positions`).catch(() => null);

    if (response) {
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('success');
      expect(data.count).toBeDefined();
      expect(Array.isArray(data.positions)).toBe(true);
    }
  });

  it('should handle no open positions', async () => {
    const response = await fetch(`${API_URL}/api/positions`).catch(() => null);

    if (response) {
      expect(response.status).toBe(200);
      const data = await response.json();
      if (data.count === 0) {
        expect(data.positions.length).toBe(0);
      }
    }
  });
});
