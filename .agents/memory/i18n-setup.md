---
name: i18n setup
description: How i18next is configured in this project and the gotchas around Arabic support.
---

## Configuration
- Files: `src/locales/en/translation.json` and `src/locales/ar/translation.json`
- i18n initialized in `src/lib/i18n.ts` (or similar) with `LanguageDetector`
- **`fallbackLng: "ar"`** — the fallback language is Arabic, not English. This means missing Arabic keys show the raw key string, not English text.
- The app defaults to Arabic (RTL) when the browser language is Arabic or undetected.

## Common failure mode
Sub-components like `CopyButton`, `WebhookRow`, `ConnectedBadge` that don't call `useTranslation()` will render hardcoded English even in Arabic mode. Each component that renders user-facing strings must call `const { t } = useTranslation()`.

**Why:** The fallback chain only works for keys that go through `t()`. Hardcoded string literals bypass i18n entirely.

**How to apply:** Any new sub-component that renders labels or messages must import and call `useTranslation()` directly (not rely on prop drilling).
