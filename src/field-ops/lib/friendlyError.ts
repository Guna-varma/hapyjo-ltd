/**
 * Turns raw database / transport error text into something a field user can act
 * on. Only well-known machine messages are translated ("new row violates
 * row-level security policy", "Failed to fetch", …); messages written for people
 * — including the RAISE EXCEPTION texts of our own triggers — pass through as-is.
 *
 * Alert.alert() runs every message through this, so call sites keep showing the
 * error they caught and still never leak SQL wording to the screen.
 */

import { getTranslation, type Locale } from '@/field-ops/lib/i18n';

let activeLocale: Locale = 'en';

/** LocaleProvider keeps this in sync; Alert has no access to React context. */
export function setFriendlyErrorLocale(locale: Locale): void {
  activeLocale = locale;
}

type Kind = 'permission' | 'network' | 'session' | 'duplicate' | 'invalid' | 'server';

const RULES: Array<[RegExp, Kind]> = [
  [/row[- ]level security|permission denied|\b42501\b|not authorized|insufficient_privilege/i, 'permission'],
  [/failed to fetch|networkerror|network request failed|load failed|err_network|econnaborted|etimedout|enotfound|\boffline\b/i, 'network'],
  [/jwt expired|invalid jwt|invalid refresh token|refresh_token_not_found|session_not_found|auth session missing/i, 'session'],
  [/duplicate key|already exists|\b23505\b/i, 'duplicate'],
  [/violates (check|foreign key|not-null) constraint|invalid input syntax|out of range|\b2350[23]\b|\b22P02\b/i, 'invalid'],
  [/relation .* does not exist|column .* does not exist|schema cache|\b42P01\b|\b42703\b|PGRST\d+|internal server error|status code 5\d\d/i, 'server'],
];

const MESSAGE_KEY: Record<Kind, string> = {
  permission: 'error_friendly_permission',
  network: 'error_friendly_network',
  session: 'error_friendly_session',
  duplicate: 'error_friendly_duplicate',
  invalid: 'error_friendly_invalid',
  server: 'error_friendly_server',
};

const TITLE_KEY: Record<Kind, string> = {
  permission: 'error_title_permission',
  network: 'error_title_network',
  session: 'error_title_permission',
  duplicate: 'error_title_validation',
  invalid: 'error_title_validation',
  server: 'error_title_server',
};

function classify(message: string): Kind | null {
  for (const [re, kind] of RULES) {
    if (re.test(message)) return kind;
  }
  return null;
}

/** The message a user should read for an error (raw text is returned when it is already human). */
export function friendlyErrorMessage(error: unknown, locale: Locale = activeLocale): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : error && typeof error === 'object' && typeof (error as { message?: unknown }).message === 'string'
          ? (error as { message: string }).message
          : '';
  const kind = classify(raw);
  if (!kind) return raw || getTranslation(locale, 'error_friendly_server');
  return getTranslation(locale, MESSAGE_KEY[kind]);
}

/**
 * Rewrites an alert's title + message when the message is a raw machine error.
 * A generic "Error" title becomes the matching category title; a specific title
 * chosen by the caller is kept.
 */
export function humanizeAlert(
  title: string,
  message: string | undefined
): { title: string; message: string | undefined } {
  if (!message) return { title, message };
  const kind = classify(message);
  if (!kind) return { title, message };
  const genericTitles = new Set([
    getTranslation('en', 'alert_error'),
    getTranslation('rn', 'alert_error'),
    'Error',
  ]);
  return {
    title: genericTitles.has(title) ? getTranslation(activeLocale, TITLE_KEY[kind]) : title,
    message: getTranslation(activeLocale, MESSAGE_KEY[kind]),
  };
}
