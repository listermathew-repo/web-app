/**
 * ntfy.sh alert utility with error codes
 * Sends notifications to https://ntfy.sh/mgm-7k4x-live
 */

export type AlertType = 'success' | 'error' | 'warning' | 'info';

// Error codes for structured error tracking
export const ERROR_CODES = {
  // Authentication errors (4xx)
  UNAUTHORIZED: { code: 'ERR_401', status: 401, message: 'Unauthorized - Invalid or missing API key' },
  INVALID_API_KEY: { code: 'ERR_401_1', status: 401, message: 'Invalid API key provided' },

  // Validation errors (4xx)
  INVALID_SCHEMA: { code: 'ERR_400_1', status: 400, message: 'Request body fails validation schema' },
  INVALID_SYMBOL: { code: 'ERR_400_2', status: 400, message: 'Invalid symbol format' },
  INVALID_DIRECTION: { code: 'ERR_400_3', status: 400, message: 'Invalid direction (must be long/short)' },
  INVALID_ENTRY_LEVEL: { code: 'ERR_400_4', status: 400, message: 'Entry level invalid (must be positive)' },
  MALFORMED_JSON: { code: 'ERR_400_5', status: 400, message: 'Malformed JSON in request body' },

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED: { code: 'ERR_429_1', status: 429, message: 'Too many requests - rate limit exceeded' },
  DUPLICATE_TRADE: { code: 'ERR_429_2', status: 429, message: 'Duplicate trade detected within 30 seconds' },

  // Database errors (500)
  DATABASE_ERROR: { code: 'ERR_500_1', status: 500, message: 'Database operation failed' },
  DUPLICATE_CHECK_FAILED: { code: 'ERR_500_2', status: 500, message: 'Failed to check for duplicates' },
  INSERT_FAILED: { code: 'ERR_500_3', status: 500, message: 'Failed to insert trade into database' },

  // Trade validation errors (4xx)
  TRADE_VALIDATION_FAILED: { code: 'ERR_400_6', status: 400, message: 'Trade failed validation against rules' },
  VALIDATION_ERROR: { code: 'ERR_500_4', status: 500, message: 'Unexpected error during validation' },

  // System errors (500)
  INTERNAL_SERVER_ERROR: { code: 'ERR_500_5', status: 500, message: 'Internal server error' },
  UNEXPECTED_ERROR: { code: 'ERR_500_6', status: 500, message: 'Unexpected error' },

  // Capital.com errors (5xx)
  CAPITAL_API_ERROR: { code: 'ERR_503_1', status: 503, message: 'Capital.com API unavailable' },
  CAPITAL_AUTH_ERROR: { code: 'ERR_503_2', status: 503, message: 'Capital.com authentication failed' },

  // Health check errors (5xx)
  HEALTH_CHECK_FAILED: { code: 'ERR_503_3', status: 503, message: 'Health check failed' },
};

interface AlertOptions {
  type: AlertType;
  message: string;
  errorCode?: string;
  title?: string;
  details?: Record<string, any>;
  timestamp?: boolean;
  requestId?: string;
}

const NTFY_URL = 'https://ntfy.sh/mgm-7k4x-live';

// Priority mapping for ntfy
const PRIORITY_MAP: Record<AlertType, number> = {
  success: 3, // Normal
  info: 3, // Normal
  warning: 4, // High
  error: 5, // URGENT
};

// Emoji for alert type
const EMOJI_MAP: Record<AlertType, string> = {
  success: '✅',
  error: '🔴',
  warning: '⚠️',
  info: 'ℹ️',
};

/**
 * Send alert to ntfy.sh with full context
 */
export async function sendAlert(
  type: AlertType,
  message: string,
  options?: {
    details?: Record<string, any>;
    errorCode?: string;
    requestId?: string;
    timestamp?: boolean;
  }
) {
  try {
    const priority = PRIORITY_MAP[type];
    const emoji = EMOJI_MAP[type];
    const adlTime = new Date().toLocaleTimeString('en-AU', { timeZone: 'Australia/Adelaide' });

    // Format the title with error code if present
    let title = `[${type.toUpperCase()}] ${adlTime} ADL`;
    if (options?.errorCode) {
      title = `${emoji} ${options.errorCode} - ${adlTime} ADL`;
    }

    // Build the body with structured context
    let body = message;

    // Add request ID if present
    if (options?.requestId) {
      body += `\nRequest ID: ${options.requestId}`;
    }

    // Add details if present
    if (options?.details && Object.keys(options.details).length > 0) {
      body += '\n\n--- Context ---\n';
      body += Object.entries(options.details)
        .filter(([, value]) => value !== null && value !== undefined)
        .map(([key, value]) => {
          const v = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
          return `${key}: ${v}`;
        })
        .join('\n');
    }

    // Add system info for errors
    if (type === 'error') {
      const memUsage = process.memoryUsage();
      body += '\n\n--- System ---\n';
      body += `Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB/${Math.round(memUsage.heapTotal / 1024 / 1024)}MB\n`;
      body += `Uptime: ${Math.round(process.uptime())}s`;
    }

    // Send to ntfy
    const response = await fetch(NTFY_URL, {
      method: 'POST',
      headers: {
        'Title': title,
        'Priority': priority.toString(),
        'Content-Type': 'text/plain; charset=utf-8',
        'Tags': options?.errorCode ? 'error,alert' : 'info',
      },
      body: body,
    });

    if (!response.ok) {
      console.error(`[ALERT] Failed to send (${response.status}): ${message}`);
      return false;
    }

    console.log(`[ALERT] Sent (${type}${options?.errorCode ? ` ${options.errorCode}` : ''}): ${message.substring(0, 80)}`);
    return true;
  } catch (error) {
    console.error('[ALERT] Send error:', error);
    return false;
  }
}

/**
 * Send trade alert
 */
export async function sendTradeAlert(
  type: 'queued' | 'approved' | 'executed' | 'rejected' | 'failed',
  symbol: string,
  direction: string,
  price: number,
  details?: Record<string, any>
) {
  const messages: Record<typeof type, string> = {
    queued: `📋 TRADE QUEUED: ${symbol} ${direction.toUpperCase()} @ ${price}`,
    approved: `✅ TRADE APPROVED: ${symbol} ${direction.toUpperCase()} @ ${price}`,
    executed: `✅ TRADE EXECUTED: ${symbol} ${direction.toUpperCase()} @ ${price}`,
    rejected: `❌ TRADE REJECTED: ${symbol} ${direction.toUpperCase()}`,
    failed: `❌ TRADE FAILED: ${symbol} ${direction.toUpperCase()} - ${price}`,
  };

  const alertType: AlertType = type === 'failed' || type === 'rejected' ? 'error' : 'success';
  return sendAlert(alertType, messages[type], details);
}

/**
 * Send error alert with urgency
 */
export async function sendErrorAlert(
  component: string,
  error: string | Error,
  details?: Record<string, any>
) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const message = `🔴 ${component.toUpperCase()} ERROR: ${errorMessage}`;
  return sendAlert('error', message, details);
}

/**
 * Send system health alert
 */
export async function sendHealthAlert(
  component: string,
  status: 'ok' | 'error',
  message?: string
) {
  if (status === 'ok') {
    return true; // Don't send success alerts for health (too noisy)
  }

  const alertMessage = `⚠️ SYSTEM HEALTH: ${component} - ${message || 'Unknown error'}`;
  return sendAlert('error', alertMessage);
}

/**
 * Send stop loss alert
 */
export async function sendStopLossAlert(
  symbol: string,
  currentPrice: number,
  stopLevel: number,
  status: 'triggered' | 'warning'
) {
  const messages = {
    triggered: `🔴 STOP LOSS TRIGGERED: ${symbol} @ ${currentPrice} (below ${stopLevel})`,
    warning: `⚠️ STOP LOSS WARNING: ${symbol} @ ${currentPrice} (near ${stopLevel})`,
  };

  return sendAlert(status === 'triggered' ? 'error' : 'warning', messages[status]);
}
