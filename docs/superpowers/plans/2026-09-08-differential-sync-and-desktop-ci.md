# Differential Cloud Sync Engine & Cross-Platform Desktop CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust differential sync engine with local mutation tracking and conflict resolution in IndexedDB, plus a multi-platform GitHub Actions CI workflow for automated Tauri 2 desktop releases.

**Architecture:** Maintain a persistent `sync_queue` object store in IndexedDB to record granular create/update/delete operations with UTC timestamps and device IDs. Introduce a bidirectional differential sync engine (`syncEngine.ts`) that sends un-synced mutations and pulls remote changes (`sinceTimestamp`) using Last-Write-Wins (LWW) conflict resolution with non-destructive revision preservation. Provide a `/api/sync/delta` endpoint in Vite server middleware with Zod validation. Configure GitHub Actions (`.github/workflows/desktop-release.yml`) to compile Windows, macOS, and Linux desktop installers via Tauri 2.

**Tech Stack:** TypeScript, IndexedDB API, React 19, Zod, Vite, Bun, Tauri 2, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-08-differential-sync-and-desktop-ci.md`

## Global Constraints
- Existing IndexedDB data (`notes`, `folders`, `workspaces`, `books`, `flashcards`, `citations`) must not be destroyed or wiped.
- Database version upgraded to `DB_VERSION = 4` to add `sync_queue` object store.
- Zero network errors when operating offline or deployed on static Vercel.
- All 68 existing tests must continue to pass.
- Desktop CI workflow must support Windows (`.exe`/`.msi`), macOS (`.dmg`), and Linux (`.AppImage`).

---

### Task 1: IndexedDB v4 Schema & Local Mutation Queue (`sync_queue`)

**Files:**
- Modify: `src/services/storage.ts` (upgrade to `DB_VERSION = 4`, add `sync_queue` store)
- Create: `src/services/syncQueue.ts`
- Test: `tests/syncQueue.test.ts`

**Interfaces:**
- `syncQueue.enqueueMutation(mutation: Omit<SyncMutation, 'id' | 'timestamp' | 'synced'>): Promise<SyncMutation>`
- `syncQueue.getPendingMutations(): Promise<SyncMutation[]>`
- `syncQueue.markMutationsSynced(ids: string[]): Promise<void>`
- `syncQueue.clearQueue(): Promise<void>`
- `syncQueue.getDeviceId(): string`

- [ ] **Step 1: Write the unit test for sync queue and mutation lifecycle**
```typescript
import { describe, it, expect, beforeEach } from 'bun:test';
import { syncQueue, type SyncMutation } from '../src/services/syncQueue';

describe('Local Mutation Sync Queue', () => {
  it('generates and persists a stable client device ID', () => {
    const id1 = syncQueue.getDeviceId();
    const id2 = syncQueue.getDeviceId();
    expect(id1).toBeDefined();
    expect(id1.length).toBeGreaterThan(5);
    expect(id1).toBe(id2);
  });

  it('creates well-formed mutations with timestamp and unique IDs', () => {
    const mutation = syncQueue.createMutation({
      entityType: 'note',
      entityId: 'note-123',
      action: 'upsert',
      payload: { title: 'Differential Sync Note' }
    });

    expect(mutation.id).toMatch(/^mut-/);
    expect(mutation.entityType).toBe('note');
    expect(mutation.entityId).toBe('note-123');
    expect(mutation.action).toBe('upsert');
    expect(mutation.timestamp).toBeGreaterThan(0);
    expect(mutation.synced).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify failure**
Run: `bun test tests/syncQueue.test.ts`
Expected: FAIL ("Cannot find module '../src/services/syncQueue'")

- [ ] **Step 3: Implement `src/services/syncQueue.ts` and update `storage.ts` to `DB_VERSION = 4`**
Implement `src/services/syncQueue.ts`:
```typescript
export interface SyncMutation {
  id: string;
  entityType: 'note' | 'folder' | 'workspace' | 'book' | 'flashcard';
  entityId: string;
  action: 'upsert' | 'delete';
  payload?: Record<string, unknown>;
  timestamp: number;
  deviceId: string;
  synced: boolean;
}

const DEVICE_ID_KEY = 'milearn_device_id';

export const syncQueue = {
  getDeviceId(): string {
    if (typeof localStorage === 'undefined') return 'dev-node-env';
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'dev-' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  },

  createMutation(params: {
    entityType: SyncMutation['entityType'];
    entityId: string;
    action: 'upsert' | 'delete';
    payload?: Record<string, unknown>;
  }): SyncMutation {
    return {
      id: 'mut-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      payload: params.payload,
      timestamp: Date.now(),
      deviceId: this.getDeviceId(),
      synced: false
    };
  }
};
```
In `src/services/storage.ts`:
Upgrade `DB_VERSION = 4` and add `db.createObjectStore('sync_queue', { keyPath: 'id' })` in `onupgradeneeded`.
In `storage.saveNote`, `storage.deleteNote`, `storage.saveFolder`, etc., enqueue mutations.

- [ ] **Step 4: Run test to verify it passes**
Run: `bun test tests/syncQueue.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**
```bash
git add src/services/syncQueue.ts src/services/storage.ts tests/syncQueue.test.ts
git commit -m "feat: add local mutation sync queue and upgrade indexeddb to v4"
```

---

### Task 2: Conflict Resolution Engine & Client Differential Sync Protocol

**Files:**
- Create: `src/services/conflictResolver.ts`
- Create: `src/services/syncEngine.ts`
- Test: `tests/syncEngine.test.ts`

**Interfaces:**
- `conflictResolver.resolveNoteConflict(local: Note, remote: Note): { winner: Note; conflictFork?: Note }`
- `syncEngine.syncDelta(): Promise<{ success: boolean; pushedCount: number; pulledCount: number; conflictsResolved: number }>`

- [ ] **Step 1: Write tests for conflict resolution and delta sync logic**
```typescript
import { describe, it, expect } from 'bun:test';
import { conflictResolver } from '../src/services/conflictResolver';
import { type Note } from '../src/types';

describe('Conflict Resolution & Delta Sync Protocol', () => {
  it('resolves conflicts in favor of latest timestamp (Last-Write-Wins)', () => {
    const localNote: Note = {
      id: 'n-1',
      title: 'Local Version',
      content: 'Local Content',
      updatedAt: 1000,
      createdAt: 500,
      tags: [],
      isPinned: false,
      isArchived: false,
      isTrashed: false
    };

    const remoteNote: Note = {
      id: 'n-1',
      title: 'Remote Version (Newer)',
      content: 'Remote Content',
      updatedAt: 2000,
      createdAt: 500,
      tags: [],
      isPinned: false,
      isArchived: false,
      isTrashed: false
    };

    const result = conflictResolver.resolveNoteConflict(localNote, remoteNote);
    expect(result.winner.title).toBe('Remote Version (Newer)');
    expect(result.conflictFork).toBeDefined();
    expect(result.conflictFork?.title).toContain('[Conflict Copy]');
  });
});
```

- [ ] **Step 2: Run test to verify failure**
Run: `bun test tests/syncEngine.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `conflictResolver.ts` and `syncEngine.ts`**
Implement Last-Write-Wins comparison with fork safety, and `syncEngine.syncDelta()` to exchange mutation payloads with the backend.

- [ ] **Step 4: Run test to verify it passes**
Run: `bun test tests/syncEngine.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**
```bash
git add src/services/conflictResolver.ts src/services/syncEngine.ts tests/syncEngine.test.ts
git commit -m "feat: implement last-write-wins conflict resolver and differential sync engine"
```

---

### Task 3: Server Differential Delta Sync Endpoint (`/api/sync/delta`)

**Files:**
- Modify: `src/services/validation/schemas.ts`
- Modify: `src/services/db/serverDb.ts`
- Modify: `vite.config.ts`
- Test: `tests/serverDeltaSync.test.ts`

**Interfaces:**
- `POST /api/sync/delta` accepting `{ sinceTimestamp: number, clientMutations: SyncMutation[], deviceId: string }`
- Responding with `{ success: true, appliedMutationIds: string[], serverMutations: SyncMutation[], latestServerTimestamp: number }`

- [ ] **Step 1: Write integration test for delta sync schema validation**
Verify that `/api/sync/delta` parses valid mutations, rejects malformed payloads, and correctly orders updates.

- [ ] **Step 2: Implement server delta handler in `serverDb.ts` and register endpoint in `vite.config.ts`**
Handle delta batches against PostgreSQL or local mock memory.

- [ ] **Step 3: Run full automated test suite**
Run: `bun test`
Expected: All tests pass.

- [ ] **Step 4: Commit changes**
```bash
git add src/services/validation/schemas.ts src/services/db/serverDb.ts vite.config.ts tests/serverDeltaSync.test.ts
git commit -m "feat: add differential delta sync endpoint with zod schema validation"
```

---

### Task 4: Multi-Platform Tauri 2 Desktop Release Workflow (GitHub Actions)

**Files:**
- Create: `.github/workflows/desktop-release.yml`

**Interfaces:**
- Automated CI pipeline building Windows (`.exe` / `.msi`), macOS (`.dmg`), and Linux (`.AppImage` / `.deb`) release bundles using GitHub's hosted runners.

- [ ] **Step 1: Create `.github/workflows/desktop-release.yml`**
```yaml
name: Desktop Release Build

on:
  push:
    tags:
      - 'v*'
    branches:
      - main
  workflow_dispatch:

jobs:
  build-tauri:
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: 'windows-latest'
            args: ''
          - platform: 'macos-latest'
            args: ''
          - platform: 'ubuntu-22.04'
            args: ''

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install Linux Dependencies
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev

      - name: Install Frontend Dependencies
        run: bun install --frozen-lockfile

      - name: Build Desktop Application
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'MiLEARNAPP Desktop ${{ github.ref_name }}'
          releaseBody: 'Automated release build of MiLEARNAPP Desktop workstation.'
          releaseDraft: true
          prerelease: false
```

- [ ] **Step 2: Verify YAML syntax and project build**
Run: `bun run build && bun run lint`
Expected: 0 errors.

- [ ] **Step 3: Commit changes**
```bash
git add .github/workflows/desktop-release.yml
git commit -m "ci: add cross-platform desktop build workflow for windows mac and linux"
```
