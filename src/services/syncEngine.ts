/**
 * Differential Sync Engine
 * Manages delta synchronizations between local IndexedDB stores and remote server.
 * Transmits only un-synced local mutations, pulls updates since last checkpoint,
 * and handles Last-Write-Wins conflict resolution with non-destructive forks.
 */

import { syncQueue, type SyncMutation } from './syncQueue';
import { conflictResolver } from './conflictResolver';
import { storage, checkBackendHealth } from './storage';
import { type Note } from '../types';
import { debugLogger } from './debugLogger';

const LAST_SYNC_KEY = 'milearn_last_sync_timestamp';

export interface SyncDeltaResult {
  success: boolean;
  offline?: boolean;
  pushedCount: number;
  pulledCount: number;
  conflictsResolved: number;
  error?: string;
}

let inMemoryLastSync = 0;

export const syncEngine = {
  /**
   * Retrieve the last successful synchronization checkpoint timestamp.
   */
  getLastSyncTimestamp(): number {
    if (typeof localStorage === 'undefined') {
      return inMemoryLastSync;
    }
    const saved = localStorage.getItem(LAST_SYNC_KEY);
    return saved ? parseInt(saved, 10) || 0 : inMemoryLastSync;
  },

  /**
   * Record the latest successful sync checkpoint.
   */
  setLastSyncTimestamp(timestamp: number): void {
    inMemoryLastSync = timestamp;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LAST_SYNC_KEY, timestamp.toString());
    }
  },

  /**
   * Execute a differential delta synchronization run.
   */
  async syncDelta(endpoint = '/api/sync/delta'): Promise<SyncDeltaResult> {
    try {
      const isReachable = await checkBackendHealth();
      if (!isReachable) {
        debugLogger.log('info', 'sync', 'Differential sync paused: backend offline. Local mutations safely queued in IndexedDB.');
        return {
          success: true,
          offline: true,
          pushedCount: 0,
          pulledCount: 0,
          conflictsResolved: 0
        };
      }

      const pendingMutations = await syncQueue.getPendingMutations();
      const sinceTimestamp = this.getLastSyncTimestamp();
      const deviceId = syncQueue.getDeviceId();

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sinceTimestamp,
          clientMutations: pendingMutations,
          deviceId
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server returned HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const appliedMutationIds: string[] = Array.isArray(data.appliedMutationIds) ? data.appliedMutationIds : [];
      const serverMutations: SyncMutation[] = Array.isArray(data.serverMutations) ? data.serverMutations : [];
      let conflictsResolved = 0;

      // 1. Mark our locally pushed mutations as synced
      if (appliedMutationIds.length > 0) {
        await syncQueue.markMutationsSynced(appliedMutationIds);
      }

      // 2. Apply remote incoming server mutations locally
      for (const sm of serverMutations) {
        if (sm.entityType === 'note') {
          if (sm.action === 'delete') {
            await storage.deleteNote(sm.entityId);
          } else if (sm.action === 'upsert' && sm.payload) {
            const remoteNote = sm.payload as unknown as Note;
            const existingNotes = await storage.getNotes();
            const localNote = existingNotes.find((n) => n.id === sm.entityId);

            if (localNote) {
              const resolution = conflictResolver.resolveNoteConflict(localNote, remoteNote);
              await storage.saveNote(resolution.winner);
              if (resolution.conflictFork) {
                await storage.saveNote(resolution.conflictFork);
                conflictsResolved++;
                debugLogger.log('warn', 'sync', `Note conflict detected for "${localNote.title}". Preserved local draft as "${resolution.conflictFork.title}".`);
              }
            } else {
              await storage.saveNote(remoteNote);
            }
          }
        }
      }

      // 3. Advance sync checkpoint
      if (typeof data.latestServerTimestamp === 'number' && data.latestServerTimestamp > sinceTimestamp) {
        this.setLastSyncTimestamp(data.latestServerTimestamp);
      }

      debugLogger.log('success', 'sync', `Differential sync complete: pushed ${appliedMutationIds.length} mutations, pulled ${serverMutations.length} updates.`);

      return {
        success: true,
        pushedCount: appliedMutationIds.length,
        pulledCount: serverMutations.length,
        conflictsResolved
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      debugLogger.log('warn', 'sync', `Differential sync warning: ${msg}`);
      return {
        success: false,
        pushedCount: 0,
        pulledCount: 0,
        conflictsResolved: 0,
        error: msg
      };
    }
  }
};
