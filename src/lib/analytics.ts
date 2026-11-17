export interface AnalyticsEventPayload {
  event: string;
  source: string;
  timestamp: string;
  metadata?: Record<string, string | number | boolean>;
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/**
 * Sends custom conversion events to the application analytics pipeline.
 */
export function trackConversionEvent(
  event: string,
  source: string,
  metadata?: Record<string, string | number | boolean>
): void {
  const payload: AnalyticsEventPayload = {
    event,
    source,
    timestamp: new Date().toISOString(),
    metadata,
  };

  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: payload.event,
      source: payload.source,
      timestamp: payload.timestamp,
      ...(payload.metadata ?? {}),
    });

    window.dispatchEvent(
      new CustomEvent<AnalyticsEventPayload>('sultan:analytics', { detail: payload })
    );
  }

  console.info('[Analytics]', payload);

  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/event', blob);
    } else if (typeof fetch === 'function') {
      void fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      });
    }
  } catch {
    // Non-blocking analytics transport
  }
}
