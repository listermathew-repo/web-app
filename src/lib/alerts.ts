/**
 * Error Alerting Utility
 * Sends URGENT alerts via ntfy.sh on system failures
 * Sends NORMAL alerts on successful operations
 */

type AlertType = 'success' | 'error' | 'warning';

interface AlertOptions {
  type: AlertType;
  message: string;
  details?: Record<string, any>;
  tags?: string[];
}

export async function sendAlert({
  type,
  message,
  details,
  tags = [],
}: AlertOptions): Promise<void> {
  try {
    const ntfyTopic = process.env.NTFY_TOPIC || 'mgm-7k4x-live';

    // Priority: error=5 (URGENT), warning=3 (HIGH), success=2 (NORMAL)
    const priorityMap = {
      error: '5',
      warning: '3',
      success: '2',
    };

    const title = `[${type.toUpperCase()}]`;
    const priority = priorityMap[type];

    // Build full message with details
    let fullMessage = message;
    if (details && Object.keys(details).length > 0) {
      fullMessage += '\n' + JSON.stringify(details, null, 2);
    }

    // Send to ntfy.sh
    await fetch(`https://ntfy.sh/${ntfyTopic}`, {
      method: 'POST',
      headers: {
        'Title': title,
        'Priority': priority,
        'Tags': tags.length > 0 ? tags.join(',') : undefined,
      },
      body: fullMessage,
    });
  } catch (error) {
    // Silently fail on ntfy errors - don't interrupt trading
    console.error('[ALERT] Failed to send ntfy notification:', error);
  }
}

// Convenience functions for common alert types
export async function alertAuthFailure(error: string, details?: any): Promise<void> {
  await sendAlert({
    type: 'error',
    message: `🔐 WEBHOOK AUTH FAILED - ${error}`,
    details,
    tags: ['auth', 'webhook'],
  });
}

export async function alertDatabaseError(error: string, details?: any): Promise<void> {
  await sendAlert({
    type: 'error',
    message: `💾 DATABASE ERROR - ${error}`,
    details,
    tags: ['database', 'critical'],
  });
}

export async function alertCapitalComError(error: string, details?: any): Promise<void> {
  await sendAlert({
    type: 'error',
    message: `⚠️ CAPITAL.COM API ERROR - ${error}`,
    details,
    tags: ['capital_com', 'api'],
  });
}

export async function alertDuplicateTrade(symbol: string, direction: string): Promise<void> {
  await sendAlert({
    type: 'warning',
    message: `🚫 DUPLICATE TRADE DETECTED - ${symbol} ${direction.toUpperCase()} within 30s`,
    tags: ['duplicate', 'rate_limit'],
  });
}

export async function alertTradePending(symbol: string, direction: string, entryLevel: number): Promise<void> {
  await sendAlert({
    type: 'success',
    message: `📋 TRADE PENDING - ${symbol} ${direction.toUpperCase()} @ ${entryLevel}`,
    details: { symbol, direction, entryLevel },
    tags: ['trade', 'pending'],
  });
}

export async function alertTradeExecuted(
  symbol: string,
  direction: string,
  executionPrice: number,
  dealReference: string
): Promise<void> {
  await sendAlert({
    type: 'success',
    message: `✅ TRADE EXECUTED - ${symbol} ${direction.toUpperCase()} @ ${executionPrice}`,
    details: { symbol, direction, executionPrice, dealReference },
    tags: ['trade', 'executed'],
  });
}

export async function alertTradeRejected(symbol: string, direction: string): Promise<void> {
  await sendAlert({
    type: 'warning',
    message: `❌ TRADE REJECTED - ${symbol} ${direction.toUpperCase()}`,
    tags: ['trade', 'rejected'],
  });
}

export async function alertSystemHealthIssue(component: string, status: string): Promise<void> {
  await sendAlert({
    type: 'error',
    message: `🏥 HEALTH CHECK FAILED - ${component}: ${status}`,
    details: { component, status },
    tags: ['health', 'monitoring'],
  });
}
