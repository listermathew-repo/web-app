/**
 * Request context tracking for debugging
 * Generates unique requestId for each webhook, passes through all logs
 */

import { randomUUID } from 'crypto';

export interface RequestContext {
  requestId: string;
  startTime: number;
  symbol?: string;
  tradeId?: string;
  direction?: string;
  userId?: string;
}

// Store context for lifecycle of request
const contexts = new Map<string, RequestContext>();

/**
 * Create a new request context
 */
export function createRequestContext(
  symbol?: string,
  tradeId?: string,
  direction?: string
): RequestContext {
  const ctx: RequestContext = {
    requestId: randomUUID(),
    startTime: Date.now(),
    symbol,
    tradeId,
    direction,
  };

  // Auto-cleanup after 1 hour
  setTimeout(() => {
    contexts.delete(ctx.requestId);
  }, 3600000);

  contexts.set(ctx.requestId, ctx);
  return ctx;
}

/**
 * Get request context by ID
 */
export function getRequestContext(requestId: string): RequestContext | undefined {
  return contexts.get(requestId);
}

/**
 * Log message with request context
 */
export function logWithContext(ctx: RequestContext, message: string, data?: any): void {
  const elapsed = Date.now() - ctx.startTime;
  const prefix = `[${ctx.requestId}] [${elapsed}ms]`;
  const details = data ? ` ${JSON.stringify(data)}` : '';

  if (ctx.symbol) {
    console.log(`${prefix} [${ctx.symbol}] ${message}${details}`);
  } else {
    console.log(`${prefix} ${message}${details}`);
  }
}

/**
 * Format context for API responses
 */
export function formatContextForResponse(ctx: RequestContext): {
  request_id: string;
  duration_ms: number;
} {
  return {
    request_id: ctx.requestId,
    duration_ms: Date.now() - ctx.startTime,
  };
}

/**
 * Get all active contexts (admin function)
 */
export function getAllContexts(): RequestContext[] {
  return Array.from(contexts.values());
}

/**
 * Clear all contexts (admin function)
 */
export function clearAllContexts(): void {
  contexts.clear();
}

/**
 * Log context statistics
 */
export function logContextStats(): void {
  const all = Array.from(contexts.values());
  const avgDuration = all.length > 0
    ? all.reduce((sum, ctx) => sum + (Date.now() - ctx.startTime), 0) / all.length
    : 0;

  console.log(`[STATS] Active contexts: ${all.length}, Avg duration: ${avgDuration.toFixed(0)}ms`);
}
