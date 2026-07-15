# Qurtuba Fashion – Security Enhancement Report

Date: 2025-10-09

## Executive Summary
- Implemented CSP, COOP/COEP, HSTS, Referrer-Policy, and other headers.
- Removed hardcoded Supabase URL/key from `src/db/client.ts` and enforced env-only configuration with offline fallback.
- Hardened Electron `webPreferences` (sandbox, contextIsolation, disable nodeIntegration) and blocked navigation/popups in both TS and JS mains.
- Replaced `dangerouslySetInnerHTML` usage in `src/components/ui/chart.tsx` with safe `<style>` text content.
- Added CI security workflow (Semgrep, Gitleaks, OWASP ZAP Baseline) and ZAP rules for false-positive reduction.

## Findings and Severity
- Hardcoded Supabase credentials in `src/db/client.ts` – High
- Electron window with `nodeIntegration: true`, `contextIsolation: false` in `electron/main.js` – High
- Use of `dangerouslySetInnerHTML` in `src/components/ui/chart.tsx` – Medium
- Missing strong security headers/CSP – Medium
- Local auth persisting full user object to `localStorage` – Medium (risk if data includes sensitive fields)
- Inline `innerHTML` in `interactive-login-test.html` (test-only) – Low

## Applied Fixes (Code Diffs)
- `src/db/client.ts`: Removed fallbacks and require env; set invalid defaults to trigger offline mode gracefully.
- `electron/main.ts` and `electron/main.js`: Enabled `sandbox`, `contextIsolation`, disabled `nodeIntegration`, blocked popups/navigation, denied permissions/webview.
- `public/_headers` and `index.html`: Added strict CSP and other headers.
- `src/components/ui/chart.tsx`: Eliminated `dangerouslySetInnerHTML`.
- `.github/workflows/security.yml`: Added Semgrep, Gitleaks, ZAP baseline.
- `.zap/rules.tsv`: Tuned ZAP baseline.

## Residual Risks and Recommendations
- Switch client-side password hashing to server-side (use Argon2/bcrypt on an API) when backend is available.
- Consider migrating auth/session to HttpOnly secure cookies instead of `localStorage` when server exists.
- Ensure least-privilege Supabase roles and RLS policies for `users`, `roles`, `invoices`, and `orders` tables.
- Add request-rate limiting on login endpoints when API exists (e.g., `express-rate-limit`).
- Periodically run dependency scans and update.

## 2-Week Mitigation Roadmap
- Week 1: Finalize RLS policies, enable row-level filtering; introduce service API for auth with hashed credentials and token rotation; move remember-me to HttpOnly cookie.
- Week 2: Add rate limiting + account lockout policy; instrument Content Security Policy reports; extend E2E security tests; rotate any leaked secrets and set up secret scanning alerts.

## Security Headers Summary
- CSP: `default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https://*.supabase.co; font-src 'self' data:; object-src 'none'; frame-src 'none'; upgrade-insecure-requests`
- HSTS: `max-age=63072000; includeSubDomains; preload`
- X-Frame-Options: `DENY`
- Referrer-Policy: `strict-origin-when-cross-origin`
- X-Content-Type-Options: `nosniff`
- COOP/COEP/CORP and Permissions-Policy: Set to restrictive defaults

## Attachments
- CI workflow: `.github/workflows/security.yml`
- ZAP rules: `.zap/rules.tsv`
