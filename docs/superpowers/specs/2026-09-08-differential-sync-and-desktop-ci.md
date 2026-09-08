# Differential Cloud Sync Engine & Cross-Platform Tauri Desktop CI Design Spec

## 1. Overview & Vision
This specification defines:
1. **Differential Sync Engine (Hub & Spoke)**: A lightweight, delta-based synchronization protocol that tracks offline mutations in a local IndexedDB queue (`sync_queue`), transmits only changed records (`sinceTimestamp`), resolves collisions using Last-Write-Wins (LWW) with non-destructive revision preservation, and drains queued edits automatically upon reconnect.
2. **Cross-Platform Tauri Desktop CI/CD**: A GitHub Actions workflow (`.github/workflows/desktop-release.yml`) that compiles native Windows (`.exe` / `.msi`), macOS (`.dmg`), and Linux (`.AppImage` / `.deb`) desktop binaries on GitHub's hosted runners.

---

## 2. Architecture & Data Flow

### 2.1 Local Mutation Queue (`sync_queue`)
When any entity (note, folder, workspace, book, flashcard) is created, edited, or deleted:
1. The change is written directly to the local IndexedDB store (`notes`, `folders`, etc.) for zero-latency UI response.
2. A mutation record is appended to the `sync_queue` store:
```typescript
export interface SyncMutation {
  id: string; // Unique UUID (e.g., "mut-xxx")
  entityType: 'note' | 'folder' | 'workspace' | 'book' | 'flashcard';
  entityId: string;
  action: 'upsert' | 'delete';
  payload?: Record<string, unknown>; // Snapshot of data on upsert
  timestamp: number; // UTC Epoch timestamp in ms
  deviceId: string; // Identifier of the origin device
  synced: boolean;
}
```

### 2.2 Differential Sync Protocol (`/api/sync/delta`)
Instead of transferring the entire database:
1. **Client Request**:
   - `sinceTimestamp`: Epoch timestamp of last successful sync checkpoint (stored in `localStorage['milearn_last_sync_timestamp']`).
   - `clientMutations`: Un-synced mutations from `sync_queue`.
   - `deviceId`: Client device ID (generated once and stored in `localStorage`).
2. **Server Processing**:
   - Applies incoming `clientMutations` using Last-Write-Wins based on `timestamp > record.updated_at`.
   - Queries all records with `updated_at > sinceTimestamp` where `device_id != client.deviceId`.
   - Returns applied mutation IDs and remote changed records.
3. **Client Receipt**:
   - Applies remote updates into local IndexedDB.
   - Clears or marks applied mutations as `synced = true` in `sync_queue`.
   - Updates `milearn_last_sync_timestamp = response.latestServerTimestamp`.

### 2.3 Conflict Resolution Strategy
- **Primary Rule**: Last-Write-Wins (LWW) based on highest epoch timestamp.
- **Safety Guarantee**: If a remote incoming note conflicts with a locally modified note and the local version loses, the local draft is automatically preserved in `note.history` as a timestamped revision or saved as a `[Conflict Copy] Note Title` draft so user content is never lost.

### 2.4 Tauri Desktop CI/CD Pipeline
- Workflow: `.github/workflows/desktop-release.yml`
- Triggers: Tag push (`v*`), push to `main`, or manual `workflow_dispatch`.
- Matrix:
  - `windows-latest` -> Builds `.msi` and `.exe` (NSIS)
  - `macos-latest` -> Builds `.dmg`
  - `ubuntu-22.04` -> Builds `.AppImage` and `.deb`
- Uses `tauri-apps/tauri-action@v0` to build and upload release assets.
