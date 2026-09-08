/**
 * useSyncStatus Hook
 * 
 * Subscribes to differential sync queue updates, backend healthchecks,
 * and live sync state transitions to provide real-time UI telemetry.
 */

import { useState, useEffect, useCallback } from 'react';
import { syncQueue } from '../services/syncQueue';
import { syncEngine } from '../services/syncEngine';
import { checkBackendHealth } from '../services/storage';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'unsynced';

export interface UseSyncStatusReturn {
  status: SyncStatus;
  pendingCount: number;
  isOnline: boolean;
  lastSyncTime: number;
  lastSyncFormatted: string;
  isSyncing: boolean;
  triggerSync: () => Promise<void>;
  statusLabel: string;
  statusColor: string;
}

function formatRelativeSyncTime(timestamp: number): string {
  if (!timestamp) return 'Never';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  return `${diffHours}h ago`;
}

export function useSyncStatus(): UseSyncStatusReturn {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(() => syncEngine.getLastSyncTimestamp());
  const [lastSyncFormatted, setLastSyncFormatted] = useState<string>(() =>
    formatRelativeSyncTime(syncEngine.getLastSyncTimestamp())
  );

  const refreshStatus = useCallback(async () => {
    try {
      const [pending, online] = await Promise.all([
        syncQueue.getPendingMutations(),
        checkBackendHealth()
      ]);
      setPendingCount(pending.length);
      setIsOnline(online);
      const ts = syncEngine.getLastSyncTimestamp();
      setLastSyncTime(ts);
      setLastSyncFormatted(formatRelativeSyncTime(ts));
    } catch {
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();

    const handleQueueUpdate = () => {
      refreshStatus();
    };

    const handleSyncStateChange = (e: Event) => {
      const custom = e as CustomEvent<{ isSyncing: boolean }>;
      if (custom.detail && typeof custom.detail.isSyncing === 'boolean') {
        setIsSyncing(custom.detail.isSyncing);
      }
      refreshStatus();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('milearn:sync-queue-updated', handleQueueUpdate);
      window.addEventListener('milearn:sync-state-changed', handleSyncStateChange);
      window.addEventListener('online', handleQueueUpdate);
      window.addEventListener('offline', handleQueueUpdate);

      // Periodic check every 15s to keep status accurate
      const interval = setInterval(refreshStatus, 15000);

      return () => {
        window.removeEventListener('milearn:sync-queue-updated', handleQueueUpdate);
        window.removeEventListener('milearn:sync-state-changed', handleSyncStateChange);
        window.removeEventListener('online', handleQueueUpdate);
        window.removeEventListener('offline', handleQueueUpdate);
        clearInterval(interval);
      };
    }
  }, [refreshStatus]);

  const triggerSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await syncEngine.syncDelta();
    } finally {
      await refreshStatus();
      setIsSyncing(false);
    }
  }, [refreshStatus]);

  // Determine current status
  let status: SyncStatus = 'synced';
  if (isSyncing) {
    status = 'syncing';
  } else if (!isOnline) {
    status = 'offline';
  } else if (pendingCount > 0) {
    status = 'unsynced';
  } else {
    status = 'synced';
  }

  let statusLabel = 'Synced';
  let statusColor = '#10b981'; // Green

  switch (status) {
    case 'syncing':
      statusLabel = 'Syncing...';
      statusColor = '#f59e0b'; // Amber
      break;
    case 'offline':
      statusLabel = 'Offline (Saved locally)';
      statusColor = '#94a3b8'; // Slate / Gray
      break;
    case 'unsynced':
      statusLabel = `Unsynced (${pendingCount} pending)`;
      statusColor = '#ef4444'; // Red
      break;
    case 'synced':
    default:
      statusLabel = 'Synced';
      statusColor = '#10b981'; // Green
      break;
  }

  return {
    status,
    pendingCount,
    isOnline,
    lastSyncTime,
    lastSyncFormatted,
    isSyncing,
    triggerSync,
    statusLabel,
    statusColor
  };
}
