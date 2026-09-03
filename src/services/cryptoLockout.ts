/**
 * Anti-Brute-Force Rate Limiting & Lockout Service
 * Protects encrypted notes against dictionary attacks and automated brute force.
 * 
 * Penalty Schedule:
 * - Attempts 1-3: Immediate retry
 * - Attempt 4: 5-second mandatory cooldown
 * - Attempt 5: 15-second mandatory cooldown
 * - Attempt 6: 30-second mandatory cooldown
 * - Attempt 7-9: 60-second mandatory cooldown
 * - Attempt 10+: 15-minute hard lockout
 */

interface StoredLockout {
  failedAttempts: number;
  lockedUntil: number; // Unix epoch ms
  lastAttemptAt: number;
}

const memoryStore = new Map<string, string>();

function safeGetItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
  } catch {}
  return memoryStore.get(key) || null;
}

function safeSetItem(key: string, val: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, val);
      return;
    }
  } catch {}
  memoryStore.set(key, val);
}

function safeRemoveItem(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
      return;
    }
  } catch {}
  memoryStore.delete(key);
}

export class CryptoLockoutManager {
  private getStorageKey(noteId: string): string {
    return `noteflow_lockout_${noteId}`;
  }

  private getStored(noteId: string): StoredLockout {
    try {
      const raw = safeGetItem(this.getStorageKey(noteId));
      if (!raw) return { failedAttempts: 0, lockedUntil: 0, lastAttemptAt: 0 };
      return JSON.parse(raw);
    } catch {
      return { failedAttempts: 0, lockedUntil: 0, lastAttemptAt: 0 };
    }
  }

  private saveStored(noteId: string, data: StoredLockout): void {
    try {
      safeSetItem(this.getStorageKey(noteId), JSON.stringify(data));
    } catch (err) {
      console.warn('Failed to persist lockout status', err);
    }
  }

  /**
   * Computes penalty cooldown in seconds based on failed attempts count
   */
  public getPenaltySeconds(failedAttempts: number): number {
    if (failedAttempts < 4) return 0;
    if (failedAttempts === 4) return 5;
    if (failedAttempts === 5) return 15;
    if (failedAttempts === 6) return 30;
    if (failedAttempts < 10) return 60;
    return 900; // 15 minutes
  }

  /**
   * Checks current lockout status and remaining cooldown seconds
   */
  public getLockoutStatus(noteId: string): { isLockedOut: boolean; remainingSeconds: number; failedAttempts: number } {
    const data = this.getStored(noteId);
    const now = Date.now();

    if (data.lockedUntil > now) {
      const remaining = Math.ceil((data.lockedUntil - now) / 1000);
      return {
        isLockedOut: true,
        remainingSeconds: remaining,
        failedAttempts: data.failedAttempts
      };
    }

    return {
      isLockedOut: false,
      remainingSeconds: 0,
      failedAttempts: data.failedAttempts
    };
  }

  /**
   * Records a failed password attempt and applies exponential backoff penalty
   */
  public recordFailedAttempt(noteId: string): { remainingSeconds: number; failedAttempts: number } {
    const data = this.getStored(noteId);
    const now = Date.now();

    const newAttempts = data.failedAttempts + 1;
    const penaltySeconds = this.getPenaltySeconds(newAttempts);
    const lockedUntil = penaltySeconds > 0 ? now + (penaltySeconds * 1000) : 0;

    const updated: StoredLockout = {
      failedAttempts: newAttempts,
      lockedUntil,
      lastAttemptAt: now
    };

    this.saveStored(noteId, updated);

    return {
      remainingSeconds: penaltySeconds,
      failedAttempts: newAttempts
    };
  }

  /**
   * Resets failed attempts after a successful authentication
   */
  public recordSuccess(noteId: string): void {
    safeRemoveItem(this.getStorageKey(noteId));
  }
}

export const lockoutManager = new CryptoLockoutManager();
