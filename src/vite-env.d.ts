/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Global type extensions for monitoring services
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, options?: {
        extra?: Record<string, unknown>;
        level?: string;
      }) => void;
    };
    gtag?: (
      command: string,
      eventName: string,
      parameters?: {
        value?: number;
        event_category?: string;
        event_label?: string;
        non_interaction?: boolean;
      }
    ) => void;
  }

  // Mock location interface for tests
  interface MockLocation {
    href: string;
  }
}
