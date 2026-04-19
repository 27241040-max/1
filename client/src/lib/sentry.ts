import * as Sentry from "@sentry/react";

import { apiBaseUrl } from "./api";

function parseSampleRate(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : fallback;
}

function getTracePropagationTargets(): Array<string | RegExp> {
  const targets: Array<string | RegExp> = [/^\//];

  try {
    targets.push(new URL(apiBaseUrl).origin);
  } catch {
    targets.push(apiBaseUrl);
  }

  return targets;
}

export function initializeSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    enabled: import.meta.env.MODE !== "test",
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT?.trim() || import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE?.trim() || undefined,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: parseSampleRate(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE, 0),
    tracePropagationTargets: getTracePropagationTargets(),
  });
}
