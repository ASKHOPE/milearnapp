import { describe, it, expect, beforeEach } from 'bun:test';
import { lockoutManager } from '../src/services/cryptoLockout';

describe('Anti-Brute-Force Rate Limiting & Exponential Lockout Tests', () => {
  const testNoteId = 'note-test-bf-1';

  beforeEach(() => {
    lockoutManager.clearLockout?.(testNoteId);
    lockoutManager.recordSuccess(testNoteId);
  });

  it('allows immediate retries for first 3 failed attempts', () => {
    // Attempt 1
    const a1 = lockoutManager.recordFailedAttempt(testNoteId);
    expect(a1.failedAttempts).toBe(1);
    expect(a1.remainingSeconds).toBe(0);

    // Attempt 2
    const a2 = lockoutManager.recordFailedAttempt(testNoteId);
    expect(a2.failedAttempts).toBe(2);
    expect(a2.remainingSeconds).toBe(0);

    // Attempt 3
    const a3 = lockoutManager.recordFailedAttempt(testNoteId);
    expect(a3.failedAttempts).toBe(3);
    expect(a3.remainingSeconds).toBe(0);

    const status = lockoutManager.getLockoutStatus(testNoteId);
    expect(status.isLockedOut).toBe(false);
  });

  it('triggers exponential backoff cooldowns starting at attempt 4', () => {
    // 3 initial attempts
    lockoutManager.recordFailedAttempt(testNoteId);
    lockoutManager.recordFailedAttempt(testNoteId);
    lockoutManager.recordFailedAttempt(testNoteId);

    // Attempt 4 -> 5s cooldown
    const a4 = lockoutManager.recordFailedAttempt(testNoteId);
    expect(a4.failedAttempts).toBe(4);
    expect(a4.remainingSeconds).toBe(5);

    // Attempt 5 -> 15s cooldown
    const a5 = lockoutManager.recordFailedAttempt(testNoteId);
    expect(a5.failedAttempts).toBe(5);
    expect(a5.remainingSeconds).toBe(15);

    // Attempt 6 -> 30s cooldown
    const a6 = lockoutManager.recordFailedAttempt(testNoteId);
    expect(a6.failedAttempts).toBe(6);
    expect(a6.remainingSeconds).toBe(30);

    // Attempt 7 -> 60s cooldown
    const a7 = lockoutManager.recordFailedAttempt(testNoteId);
    expect(a7.failedAttempts).toBe(7);
    expect(a7.remainingSeconds).toBe(60);

    // Attempt 10 -> 900s (15 minute hard lockout)
    lockoutManager.recordFailedAttempt(testNoteId); // 8
    lockoutManager.recordFailedAttempt(testNoteId); // 9
    const a10 = lockoutManager.recordFailedAttempt(testNoteId); // 10
    expect(a10.failedAttempts).toBe(10);
    expect(a10.remainingSeconds).toBe(900);

    const status = lockoutManager.getLockoutStatus(testNoteId);
    expect(status.isLockedOut).toBe(true);
    expect(status.remainingSeconds).toBeGreaterThanOrEqual(898);
  });

  it('resets failed attempts and unlocks after successful authentication', () => {
    // Generate failed attempts
    lockoutManager.recordFailedAttempt(testNoteId);
    lockoutManager.recordFailedAttempt(testNoteId);
    lockoutManager.recordFailedAttempt(testNoteId);
    lockoutManager.recordFailedAttempt(testNoteId);

    expect(lockoutManager.getLockoutStatus(testNoteId).isLockedOut).toBe(true);

    // User enters correct passphrase
    lockoutManager.recordSuccess(testNoteId);

    const resetStatus = lockoutManager.getLockoutStatus(testNoteId);
    expect(resetStatus.isLockedOut).toBe(false);
    expect(resetStatus.failedAttempts).toBe(0);
    expect(resetStatus.remainingSeconds).toBe(0);
  });
});
