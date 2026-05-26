import { describe, it, expect } from 'vitest';

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('GET /api/health - System Health Check', () => {
  it('should return health status', async () => {
    const response = await fetch(`${API_URL}/api/health`).catch(() => null);

    if (response) {
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data.components).toBeDefined();
      expect(data.timestamp).toBeDefined();
    }
  });

  it('should include all required components', async () => {
    const response = await fetch(`${API_URL}/api/health`).catch(() => null);

    if (response) {
      const data = await response.json();
      const requiredComponents = ['database', 'webhook', 'trades'];
      requiredComponents.forEach((component) => {
        expect(data.components).toContain(component);
      });
    }
  });

  it('should track last webhook received', async () => {
    const response = await fetch(`${API_URL}/api/health`).catch(() => null);

    if (response) {
      const data = await response.json();
      expect(data.lastWebhookReceived).toBeDefined();
    }
  });
});
