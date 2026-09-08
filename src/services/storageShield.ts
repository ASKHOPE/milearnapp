/**
 * Storage Shield & Quota Estimation Service
 * Provides persistent storage protection (navigator.storage.persist) to prevent
 * browser eviction under low disk space, and estimates real-time quota usage.
 */

export interface StorageEstimateResult {
  usedBytes: number;
  quotaBytes: number;
  percentage: number;
  isPersisted: boolean;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeIndex = Math.min(i, sizes.length - 1);
  if (safeIndex === 0) return `${bytes} B`;
  return `${(bytes / Math.pow(k, safeIndex)).toFixed(dm)} ${sizes[safeIndex]}`;
}

export function calculateStoragePercentage(used: number, quota: number): number {
  if (quota <= 0) return 0;
  return Math.round((used / quota) * 1000) / 10;
}

export const storageShield = {
  /**
   * Request persistent storage to shield data from browser eviction.
   * Returns true if granted, false otherwise.
   */
  async requestPersistence(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      try {
        return await navigator.storage.persist();
      } catch {
        return false;
      }
    }
    return false;
  },

  /**
   * Check whether persistent storage has already been granted.
   */
  async isPersisted(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage?.persisted) {
      try {
        return await navigator.storage.persisted();
      } catch {
        return false;
      }
    }
    return false;
  },

  /**
   * Retrieve the current storage usage, quota, and persistence status.
   */
  async getStorageEstimate(): Promise<StorageEstimateResult> {
    let usedBytes = 0;
    let quotaBytes = 0;
    let isPersisted = false;

    if (typeof navigator !== 'undefined' && navigator.storage) {
      if (navigator.storage.estimate) {
        try {
          const est = await navigator.storage.estimate();
          usedBytes = est.usage || 0;
          quotaBytes = est.quota || 0;
        } catch {
          // Ignore quota estimation failures gracefully
        }
      }
      if (navigator.storage.persisted) {
        try {
          isPersisted = await navigator.storage.persisted();
        } catch {
          // Ignore persistence check errors gracefully
        }
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
