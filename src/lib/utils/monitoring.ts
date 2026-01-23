/**
 * Monitoring utilities for Frame responses and transaction failures
 * Basic error tracking and health checks
 */

interface MonitoringEvent {
  type: 'frame_request' | 'transaction' | 'error';
  endpoint?: string;
  status?: number;
  error?: string;
  timestamp: number;
  duration?: number;
}

const events: MonitoringEvent[] = [];
const MAX_EVENTS = 1000;

export function logEvent(event: Omit<MonitoringEvent, 'timestamp'>) {
  events.push({
    ...event,
    timestamp: Date.now(),
  });

  // Keep only recent events
  if (events.length > MAX_EVENTS) {
    events.shift();
  }

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with monitoring service (e.g., Sentry, DataDog)
    console.log('[Monitoring]', event);
  }
}

export function logFrameRequest(endpoint: string, status: number, duration?: number) {
  logEvent({
    type: 'frame_request',
    endpoint,
    status,
    duration,
  });
}

export function logTransaction(txHash: string, success: boolean, error?: string) {
  logEvent({
    type: 'transaction',
    status: success ? 200 : 500,
    error,
  });
}

export function logError(error: Error, context?: string) {
  logEvent({
    type: 'error',
    error: error.message,
    endpoint: context,
  });
}

export function getHealthStatus() {
  const recentErrors = events.filter(
    (e) => e.type === 'error' && e.timestamp > Date.now() - 60000, // Last minute
  );

  const recentFrameRequests = events.filter(
    (e) => e.type === 'frame_request' && e.timestamp > Date.now() - 60000,
  );

  const errorRate =
    recentFrameRequests.length > 0
      ? recentErrors.length / recentFrameRequests.length
      : 0;

  return {
    healthy: errorRate < 0.1, // Less than 10% error rate
    errorRate,
    recentErrors: recentErrors.length,
    recentRequests: recentFrameRequests.length,
  };
}

