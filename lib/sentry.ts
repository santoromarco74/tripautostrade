import * as Sentry from '@sentry/react-native';

// DSN pubblico del progetto Sentry, iniettato a build/update time.
// Se assente (sviluppo locale) Sentry resta disattivato senza effetti.
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

export function initSentry() {
  Sentry.init({
    dsn: SENTRY_DSN || undefined,
    enabled: Boolean(SENTRY_DSN),
    sendDefaultPii: false,
    tracesSampleRate: 0.2,
  });
}

export { Sentry };
