/**
 * Sync Mutation Queue
 * Records granular local operations (upsert / delete) for differential synchronization.
 * Operates offline-first using IndexedDB with in-memory fallback for test environments.
 */

import type { SyncMutation } from '../types';

export type { SyncMutation };

const DEVICE_ID_KEY = 'milearn_device_id';
const inMemoryQueue: SyncMutation[] = [];

// Helper to access IndexedDB without circular dependencies
async function getDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return null;
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open('noteflow_db', 4);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export const syncQueue = {
  /**
   * Retrieves or creates a stable client device identifier.
   */
  getDeviceId(): string {
    if (typeof localStorage === 'undefined') {
      return 'dev-test-environment';
    }
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'dev-' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  },

  /**
   * Factory function to create a new timestamped mutation.
   */
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
  },

  /**
   * Enqueue a mutation into IndexedDB (or fallback memory).
   */
  async enqueueMutation(mutation: SyncMutation): Promise<SyncMutation> {
    const db = await getDb();
    if (!db || !db.objectStoreNames.contains('sync_queue')) {
      inMemoryQueue.push(mutation);
      return mutation;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction('sync_queue', 'readwrite');
        const store = tx.objectStore('sync_queue');
        const req = store.put(mutation);
        req.onsuccess = () => resolve(mutation);
        req.onerror = () => reject(req.error);
      } catch {
        // Fallback to memory
        inMemoryQueue.push(mutation);
        resolve(mutation);
      }
    });
  },

  /**
   * Retrieve all un-synced mutations ordered by timestamp.
   */
  async getPendingMutations(): Promise<SyncMutation[]> {
    const db = await getDb();
    if (!db || !db.objectStoreNames.contains('sync_queue')) {
      return [...inMemoryQueue].filter((m) => !m.synced);
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction('sync_queue', 'readonly');
        const store = tx.objectStore('sync_queue');
        const req = store.getAll();
        req.onsuccess = () => {
          const all = (req.result as SyncMutation[]) || [];
          resolve(all.filter((m) => !m.synced).sort((a, b) => a.timestamp - b.timestamp));
        };
        req.onerror = () => reject(req.error);
      } catch {
        resolve([...inMemoryQueue].filter((m) => !m.synced));
      }
    });
  },

  /**
   * Mark a set of mutation IDs as synced or remove them.
   */
  async markMutationsSynced(mutationIds: string[]): Promise<void> {
    const idSet = new Set(mutationIds);

    // Update in-memory fallback
    for (let i = inMemoryQueue.length - 1; i >= 0; i--) {
      if (idSet.has(inMemoryQueue[i].id)) {
        inMemoryQueue.splice(i, 1);
      }
    }

    const db = await getDb();
    if (!db || !db.objectStoreNames.contains('sync_queue')) return;

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction('sync_queue', 'readwrite');
        const store = tx.objectStore('sync_queue');
        for (const id of mutationIds) {
          store.delete(id);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      } catch {
        resolve();
      }
    });
  },

  /**
   * Clear all mutations from queue.
   */
  async clearQueue(): Promise<void> {
    inMemoryQueue.length = 0;
    const db = await getDb();
    if (!db || !db.objectStoreNames.contains('sync_queue')) return;

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction('sync_queue', 'readwrite');
        const store = tx.objectStore('sync_queue');
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch {
        resolve();
      }
    });
  }
};
