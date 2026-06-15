# Security Policy — EcoPulse

## Privacy-by-Design

EcoPulse is built with privacy as a first-class design constraint, not an afterthought.

### Data Storage

- **All user data is stored exclusively in `localStorage`** on the user's own device.
- No user data is transmitted to any server, database, or analytics service.
- No authentication, user accounts, or personal identifiers are collected.
- The app functions fully offline after the initial page load (Gemini AI calls require internet, but are entirely optional).

### API Key Handling

- The optional Gemini API key is stored in `.env.local` (a local-only file, never committed to version control).
- `.env.local` is explicitly listed in `.gitignore` — it will never appear in the repository.
- Only `.env.example` is committed, containing a placeholder value only.
- The API key is read at build time via `import.meta.env.VITE_GEMINI_API_KEY` and is **never logged**, **never stored in localStorage**, and **never sent to any service other than the Gemini API endpoint** (`generativelanguage.googleapis.com`).

### Input Validation

All numeric inputs are:
- Clamped to sane ranges (min 0, max upper bounds per category)
- Guarded against `NaN` and `Infinity` propagation using the `clamp()` utility in `calculator.ts`
- Validated before passing to the calculation engine

### External API Calls

The only external network calls EcoPulse makes are:
1. **Gemini API** (`generativelanguage.googleapis.com`) — only when `VITE_GEMINI_API_KEY` is set and non-empty
2. **Google Fonts** (`fonts.googleapis.com`) — for Inter typography (loaded via standard `<link>` tag)

All Gemini API calls:
- Are wrapped in `try/catch` with a silent fallback
- Use `AbortController` with an 8-second timeout to prevent hangs
- Never include personal identifying information — only aggregated emission totals and category summaries

### Dependency Security

- `npm audit` is run periodically; only production-essential dependencies are included
- `node_modules/` and `dist/` are excluded from the repository via `.gitignore`

## Reporting a Vulnerability

This is an open-source hackathon project with no real user data or backend. If you find a security concern, please open a GitHub issue labeled `security`.

---

*EcoPulse is a client-side-only tool. No personal data ever leaves your device.*
