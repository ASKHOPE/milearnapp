# Offline Local-First Storage & Desktop Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust, 100% standalone offline local-first storage architecture with persistent browser quota shielding, migration of flashcards/citations into IndexedDB, silent offline operation without backend errors, and Tauri desktop configuration.

**Architecture:** Expand IndexedDB (`milearn_db` v3) to store notes, folders, workspaces, books, flashcards, and citations in binary-safe stores. Wrap browser storage with `navigator.storage.persist()` and `navigator.storage.estimate()`. Gate remote sync behind active heartbeat checks so offline/Vercel environments operate silently and seamlessly. Scaffold `src-tauri/` configuration for desktop distribution.

**Tech Stack:** TypeScript, React 19, IndexedDB API, Web Storage API (`navigator.storage`), Vite, Bun, Tauri 2.

**Spec:** `docs/superpowers/specs/2026-09-08-offline-local-first-storage-design.md`

## Global Constraints
- Do not introduce breaking schema changes to existing IndexedDB `notes`, `folders`, `workspaces`, or `books`.
- Ensure 100% backward compatibility with existing JSON vault exports.
- All 65 existing automated tests must continue to pass.
- No network requests must fail or spam error messages to the console when running offline or on static Vercel.

---

### Task 1: IndexedDB v3 Schema Upgrade & Storage Shield Utility

**Files:**
- Create: `src/services/storageShield.ts`
- Modify: `src/services/storage.ts`
- Test: `tests/storageShield.test.ts`

**Interfaces:**
- `storageShield.requestPersistence(): Promise<boolean>`
- `storageShield.getStorageEstimate(): Promise<{ usedBytes: number; quotaBytes: number; percentage: number; isPersisted: boolean }>`
- `storage.openDB(): Promise<IDBDatabase>` (Upgraded to v3 with `flashcards` and `citations` object stores)

- [ ] **Step 1: Write the unit test for storage shield and quota estimation**
```typescript
import { describe, it, expect } from 'bun:test';
import { formatBytes, calculateStoragePercentage } from '../src/services/storageShield';

describe('Storage Shield & Quota Estimation', () => {
  it('correctly formats bytes into human-readable strings', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1024 * 1024 * 5.5)).toBe('5.5 MB');
    expect(formatBytes(1024 * 1024 * 1024 * 2)).toBe('2.0 GB');
  });

  it('calculates storage quota percentage accurately', () => {
    expect(calculateStoragePercentage(50, 100)).toBe(50);
    expect(calculateStoragePercentage(1, 1000)).toBe(0.1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `bun test tests/storageShield.test.ts`
Expected: FAIL ("cannot find module '../src/services/storageShield'")

- [ ] **Step 3: Implement `src/services/storageShield.ts` and upgrade `storage.ts` to DB_VERSION 3**
Create `src/services/storageShield.ts`:
```typescript
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function calculateStoragePercentage(used: number, quota: number): number {
  if (quota <= 0) return 0;
  return Math.round((used / quota) * 1000) / 10;
}

export const storageShield = {
  async requestPersistence(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        return await navigator.storage.persist();
      } catch {
        return false;
      }
    }
    return false;
  },

  async isPersisted(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      try {
        return await navigator.storage.persisted();
      } catch {
        return false;
      }
    }
    return false;
  },

  async getStorageEstimate(): Promise<{ usedBytes: number; quotaBytes: number; percentage: number; isPersisted: boolean }> {
    let usedBytes = 0;
    let quotaBytes = 0;
    let isPersisted = false;

    if (typeof navigator !== 'undefined' && navigator.storage) {
      if (navigator.storage.estimate) {
        try {
          const est = await navigator.storage.estimate();
          usedBytes = est.usage || 0;
          quotaBytes = est.quota || 0;
        } catch {}
      }
      if (navigator.storage.persisted) {
        try {
          isPersisted = await navigator.storage.persisted();
        } catch {}
      }
    }

    return {
      usedBytes,
      quotaBytes,
      percentage: calculateStoragePercentage(usedBytes, quotaBytes),
      isPersisted
    };
  }
};
```

In `src/services/storage.ts`:
Upgrade `DB_VERSION = 3` and add `flashcards` and `citations` object stores in `onupgradeneeded`.

- [ ] **Step 4: Run test to verify it passes**
Run: `bun test tests/storageShield.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**
```bash
git add src/services/storageShield.ts src/services/storage.ts tests/storageShield.test.ts
git commit -m "feat: add storage shield persistence utility and upgrade indexeddb to v3"
```

---

### Task 2: Silent Offline Operation & Intelligent Sync Gating

**Files:**
- Modify: `src/services/storage.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Gating remote `/api/sync` calls: Only attempt network sync if the app detects a successful `/api/health` response. Otherwise, log clean diagnostic messages and remain in 100% offline mode.

- [ ] **Step 1: Update `storage.ts` to cache backend availability**
Check backend health before attempting POST `/api/sync` so offline/Vercel browsers do not trigger 404/500 network warnings.

- [ ] **Step 2: Trigger `storageShield.requestPersistence()` on app initialization in `App.tsx`**
Ensure that whenever a user opens the app, the browser grants persistent storage protection.

- [ ] **Step 3: Run automated test suite to ensure zero regressions**
Run: `bun test`
Expected: All 66 tests pass.

- [ ] **Step 4: Commit changes**
```bash
git add src/services/storage.ts src/App.tsx
git commit -m "feat: gate remote sync behind active healthchecks and enable auto-persistence"
```

---

### Task 3: Storage Diagnostics & Quota View in Settings

**Files:**
- Modify: `src/components/SettingsModal.tsx`
- Modify: `src/components/settings/TutorialFaqTab.tsx`

**Interfaces:**
- Display live quota bar (Used / Total Available) and "Persistence Shield: Active" badge in the Storage / Backup settings tab.

- [ ] **Step 1: Add live storage quota card in SettingsModal.tsx (Storage tab)**
Displays the human-readable storage used (e.g. `2.4 MB / 120 GB (0.0%)`) and persistence status.

- [ ] **Step 2: Run linter and typecheck**
Run: `bun run lint && bun x tsc -b`
Expected: 0 errors.

- [ ] **Step 3: Commit changes**
```bash
git add src/components/SettingsModal.tsx src/components/settings/TutorialFaqTab.tsx
git commit -m "feat: display live storage quota and persistent storage status in settings"
```

---

### Task 4: Tauri 2 Desktop Configuration Scaffolding

**Files:**
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/src/main.rs`
- Modify: `package.json` (add `@tauri-apps/api` and `@tauri-apps/cli`)

**Interfaces:**
- Native desktop shell configuration enabling compilation to Windows `.exe` / `.msi` while consuming `./dist` built by Vite.

- [ ] **Step 1: Add Tauri dependencies to `package.json`**
Add `@tauri-apps/api` and `@tauri-apps/cli` to `devDependencies`.

- [ ] **Step 2: Scaffold `src-tauri/tauri.conf.json` and Rust main entry**
Configure app identifier `com.milearnapp.desktop`, window dimensions, and build scripts.

- [ ] **Step 3: Verify build and bundling**
Run: `bun run build`
Expected: Passes with 0 errors.

- [ ] **Step 4: Commit changes**
```bash
git add src-tauri package.json
git commit -m "feat: scaffold tauri desktop configuration for offline native distribution"
```
