# Security Open Items — Action Required

> Last updated: 2026-09-09  
> Fixed items are in [`audit-2026-09-09.md`](./audit-2026-09-09.md)

---

## 🔴 Must fix before any public / internet-facing deployment

### [ ] CVE-C3 — Remove or auth-gate `/api/seed`
**File:** [`vite.config.ts:55`](../../vite.config.ts)  
**Effort:** 10 minutes

**Option A (recommended):** Delete the `/api/seed` HTTP route. Run seeds from terminal only:
```bash
bun run scripts/seed.ts
```

**Option B:** Add env-var guard:
```ts
const adminSecret = req.headers['x-admin-secret'];
if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
  res.statusCode = 401;
  res.end(JSON.stringify({ error: 'Unauthorized' }));
  return;
}
```
Then add `ADMIN_SECRET=<random-uuid>` to `.env`.

---

### [ ] CVE-H4 — Set Tauri CSP (currently `null`)
**File:** [`src-tauri/tauri.conf.json`](../../src-tauri/tauri.conf.json)  
**Effort:** 15 minutes

Change:
```json
"csp": null
```
To:
```json
"csp": "default-src 'self'; script-src 'self'; connect-src 'self' https://*.neon.tech wss: ws:; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; object-src 'none'; base-uri 'self'; frame-src https://www.youtube.com https://vimeo.com"
```

---

### [ ] CVE-H2 — API authentication for any internet-facing deployment
**File:** [`vite.config.ts`](../../vite.config.ts)  
**Effort:** 30 minutes

Add a startup token middleware before all `/api/` routes:
```ts
const DEV_TOKEN = process.env.DEV_API_SECRET ?? crypto.randomUUID();
// Inject DEV_TOKEN into the client via Vite's `define` config
// Client includes it as: headers: { 'x-dev-token': import.meta.env.VITE_DEV_TOKEN }
```

---

## 🟡 Should fix before stable release

### [ ] CVE-M2 — Add missing HTTP security headers to `vercel.json`
**File:** [`vercel.json`](../../vercel.json)  
**Effort:** 10 minutes

Add these headers to the `headers` array:
```json
{ "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
{ "key": "Permissions-Policy", "value": "camera=(), microphone=(self), clipboard-read=(self), clipboard-write=(self)" }
```
Remove the deprecated:
```json
{ "key": "X-XSS-Protection", "value": "1; mode=block" }
```

---

### [ ] CVE-M4 — Change dev server host to `127.0.0.1`
**File:** [`vite.config.ts:306`](../../vite.config.ts)  
**Effort:** 2 minutes

```ts
server: {
  host: '127.0.0.1', // was '0.0.0.0' — prevents LAN exposure
  port: 5173,
}
```

---

### [ ] CVE-M1 — Mask internal errors in production API responses
**File:** [`vite.config.ts`](../../vite.config.ts) — all `catch` blocks  
**Effort:** 20 minutes

Replace all instances of:
```ts
res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
```
With:
```ts
console.error('[API]', err); // log the real error server-side
res.end(JSON.stringify({ error: 'Internal server error' })); // generic to client
```

---

## 🔵 Nice to have

### [ ] CVE-L1 — Wire `express-rate-limit` or remove it
Either remove from `package.json` (it's unused), or implement a simple in-memory rate limiter for `/api/scrape` and `/api/auth/hash`.

### [ ] CVE-L3 — Rate-limit or remove `/api/auth/hash`
If this endpoint is ever internet-accessible, add a max-10-requests/minute throttle.

---

## Verification checklist before going live

- [ ] `bun audit` passes with no critical vulnerabilities in dependencies
- [ ] Tauri CSP is non-null and tested in desktop build
- [ ] `/api/seed` is unreachable from browser or requires `ADMIN_SECRET`
- [ ] All API endpoints return generic error messages (no stack traces or DB details)
- [ ] `vercel.json` includes HSTS and Permissions-Policy
- [ ] Dev server is `127.0.0.1` in production configs
- [ ] All `dangerouslySetInnerHTML` usages go through `sanitizer.sanitize()` — run:
  ```bash
  Select-String -Path "src/**/*.tsx" -Pattern "dangerouslySetInnerHTML" -Recurse
  ```
  Every result should have `sanitizer.sanitize(` on the same line or the content should be library-generated (KaTeX only).
