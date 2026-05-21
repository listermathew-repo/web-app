/**
 * ntfy.sh alert utility
 * Sends notifications to https://ntfy.sh/mgm-7k4x-live
 */

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertOptions {
  type: AlertType;
  message: string;
  title?: string;
  details?: Record<string, any>;
  timestamp?: boolean;
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
 * Send alert to ntfy.sh
 */
export async function sendAlert(type: AlertType, message: string, details?: Record<string, any>) {
  try {
    const priority = PRIORITY_MAP[type];
    const emoji = EMOJI_MAP[type];
    const timestamp = new Date().toLocaleTimeString('en-AU', { timeZone: 'Australia/Adelaide' });

    // Format the title
    const title = `[${type.toUpperCase()}] ${timestamp} ADL`;

    // Build the body
    let body = message;
    if (details) {
      body += '\n\n---\n';
      body += Object.entries(details)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join('\n');
    }

    // Send to ntfy
    const response = await fetch(NTFY_URL, {
      method: 'POST',
      headers: {
        'Title': title,
        'Priority': priority.toString(),
        'Content-Type': 'text/plain; charset=utf-8',
      },
      body: body,
    });

    if (!response.ok) {
      console.error(`Failed to send alert: ${response.status} ${response.statusText}`);
      return false;
    }

    console.log(`Alert sent (${type}): ${message}`);
    return true;
  } catch (error) {
    console.error('Failed to send alert:', error);
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
