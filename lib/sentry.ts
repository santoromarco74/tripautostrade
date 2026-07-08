import * as Sentry from '@sentry/react-native';

// DSN pubblico del progetto Sentry (identificatore, non un segreto).
// Sovrascrivibile con EXPO_PUBLIC_SENTRY_DSN; stringa vuota = disattivato.
const SENTRY_DSN =
  process.env.EXPO_PUBLIC_SENTRY_DSN ??
  'https://f693b4d04bec8064c8f943a7f619b90c@o4511701885386752.ingest.de.sentry.io/4511701891940432';

export function initSentry() {
  Sentry.init({
    dsn: SENTRY_DSN || undefined,
    enabled: Boolean(SENTRY_DSN),
    sendDefaultPii: false,
    tracesSampleRate: 0.2,
  });
}

export { Sentry };
