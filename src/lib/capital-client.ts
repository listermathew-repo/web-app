/**
 * Capital.com API Client
 * Handles authentication, order execution, position tracking, and order closure
 * Uses REST API with email/password authentication
 */

interface AuthResponse {
  token: string;
  accountId: string;
}

interface OrderRequest {
  symbol: string;
  direction: 'long' | 'short';
  size: number;
  stopPrice: number;
  takeProfitPrice?: number;
}

interface OrderResponse {
  dealReference: string;
  dealId: string;
  reason?: string;
  status: string;
}

interface Position {
  dealId: string;
  epic: string;
  symbol: string;
  direction: string;
  size: number;
  entryPrice: number;
  currentPrice: number;
  stopPrice: number;
  profitLoss: number;
  profitLossPercent: number;
}

// Epic mappings for Capital.com instruments
const EPIC_MAPPING: Record<string, string> = {
  EURUSD: 'CS.D.EURUSD.MINI.IP',
  XAUUSD: 'CS.D.GOLD.TODAY.IP',
  BTCUSD: 'CS.D.BTCUSD.IP',
  AUDUSD: 'CS.D.AUDUSD.MINI.IP',
};

class CapitalClient {
  private baseUrl = 'https://api-capital.backend-capital.com/api/v1';
  private email: string;
  private password: string;
  private apiToken: string | null = null;
  private accountId: string | null = null;
  private lastAuthTime: number = 0;
  private authTokenTTL = 3600000; // 1 hour in ms
  private demoMode: boolean;

  constructor(email: string, password: string, demoMode: boolean = false) {
    this.email = email;
    this.password = password;
    this.demoMode = demoMode;
    console.log(`CapitalClient initialized${demoMode ? ' (DEMO MODE)' : ''}`);
  }

  /**
   * Authenticate and get session token
   * Tokens expire after 1 hour, re-authenticate as needed
   */
  async authenticate(): Promise<boolean> {
    try {
      // Check if token is still valid (refresh if > 50 min old)
      if (this.apiToken && Date.now() - this.lastAuthTime < 50 * 60 * 1000) {
        console.log('Using cached auth token');
        return true;
      }

      const endpoint = this.demoMode ? '/session/demo' : '/session';
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: this.email,
          password: this.password,
          encryptionVersion: 1,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Authentication failed:', error);
        return false;
      }

      const data = (await response.json()) as AuthResponse;
      this.apiToken = data.token;
      this.accountId = data.accountId;
      this.lastAuthTime = Date.now();

      console.log(`✅ Capital.com authenticated (Account: ${this.accountId})`);
      return true;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  /**
   * Execute a market order
   */
  async executeOrder(order: OrderRequest): Promise<OrderResponse> {
    try {
      // Ensure authenticated
      if (!this.apiToken) {
        const authSuccess = await this.authenticate();
        if (!authSuccess) {
          throw new Error('Failed to authenticate with Capital.com');
        }
      }

      const epic = EPIC_MAPPING[order.symbol];
      if (!epic) {
        throw new Error(`Unknown symbol: ${order.symbol}`);
      }

      // Build order payload
      const payload = {
        epic: epic,
        orderType: 'MARKET',
        direction: order.direction === 'long' ? 'BUY' : 'SELL',
        size: order.size,
        limitDistance: undefined,
        stopDistance: Math.abs(order.stopPrice - order.size), // Stop distance in pips
        guaranteedStop: false,
        timeInForce: 'FILL_OR_KILL',
        currencyCode: 'USD',
      };

      const response = await fetch(`${this.baseUrl}/positions/otc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SECURITY-TOKEN': this.apiToken!,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Order execution failed:', error);
        return {
          dealReference: '',
          dealId: '',
          reason: error.errorCode || 'Unknown error',
          status: 'failed',
        };
      }

      const data = (await response.json()) as OrderResponse;
      console.log(`✅ Order executed: ${data.dealReference}`);

      return {
        ...data,
        status: 'executed',
      };
    } catch (error) {
      console.error('Order execution error:', error);
      return {
        dealReference: '',
        dealId: '',
        reason: String(error),
        status: 'error',
      };
    }
  }

  /**
   * Get current open positions
   */
  async getOpenPositions(): Promise<Position[]> {
    try {
      if (!this.apiToken) {
        const authSuccess = await this.authenticate();
        if (!authSuccess) {
          throw new Error('Failed to authenticate');
        }
      }

      const response = await fetch(`${this.baseUrl}/positions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-SECURITY-TOKEN': this.apiToken!,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch positions');
        return [];
      }

      const data = (await response.json()) as { positions: any[] };
      const positions: Position[] = data.positions
        .filter(
          (p: any) =>
            EPIC_MAPPING[p.symbol] || p.epic in Object.values(EPIC_MAPPING)
        )
        .map((p: any) => ({
          dealId: p.dealId,
          epic: p.epic,
          symbol: Object.entries(EPIC_MAPPING).find(
            ([_, epic]) => epic === p.epic
          )?.[0] || p.symbol,
          direction: p.direction === 'BUY' ? 'long' : 'short',
          size: p.size,
          entryPrice: p.entryPrice,
          currentPrice: p.currentPrice,
          stopPrice: p.stopPrice,
          profitLoss: p.profitLoss,
          profitLossPercent: p.profitLossPercent,
        }));

      console.log(`📊 Open positions: ${positions.length}`);
      return positions;
    } catch (error) {
      console.error('Position fetch error:', error);
      return [];
    }
  }

  /**
   * Close a specific position
   */
  async closePosition(dealId: string): Promise<boolean> {
    try {
      if (!this.apiToken) {
        const authSuccess = await this.authenticate();
        if (!authSuccess) {
          throw new Error('Failed to authenticate');
        }
      }

      const response = await fetch(
        `${this.baseUrl}/positions/otc/${dealId}`,
        {
          method: 'DELETE',
          headers: {
            'X-SECURITY-TOKEN': this.apiToken!,
          },
        }
      );

      if (!response.ok) {
        console.error('Failed to close position');
        return false;
      }

      console.log(`✅ Position closed: ${dealId}`);
      return true;
    } catch (error) {
      console.error('Position closure error:', error);
      return false;
    }
  }

  /**
   * Get account summary
   */
  async getAccountSummary(): Promise<{
    balance: number;
    available: number;
    exposure: number;
  } | null> {
    try {
      if (!this.apiToken) {
        const authSuccess = await this.authenticate();
        if (!authSuccess) {
          throw new Error('Failed to authenticate');
        }
      }

      const response = await fetch(`${this.baseUrl}/accounts`, {
        method: 'GET',
        headers: {
          'X-SECURITY-TOKEN': this.apiToken!,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch account summary');
        return null;
      }

      const data = (await response.json()) as {
        accounts: any[];
      };
      const account = data.accounts.find((a: any) => a.accountId === this.accountId);

      if (!account) {
        return null;
      }

      return {
        balance: account.balance,
        available: account.availableFunds,
        exposure: account.exposure,
      };
    } catch (error) {
      console.error('Account summary error:', error);
      return null;
    }
  }
}

// Export singleton instance
let capitalClientInstance: CapitalClient | null = null;

export function initializeCapitalClient(): CapitalClient {
  const email = process.env.CAPITAL_COM_EMAIL;
  const password = process.env.CAPITAL_COM_PASSWORD;
  const demoMode = process.env.CAPITAL_DEMO_MODE === 'true';

  if (!email || !password) {
    throw new Error(
      'CAPITAL_COM_EMAIL and CAPITAL_COM_PASSWORD env vars required'
    );
  }

  if (!capitalClientInstance) {
    capitalClientInstance = new CapitalClient(email, password, demoMode);
  }

  return capitalClientInstance;
}

export function getCapitalClient(): CapitalClient {
  if (!capitalClientInstance) {
    return initializeCapitalClient();
  }
  return capitalClientInstance;
}

export default CapitalClient;
