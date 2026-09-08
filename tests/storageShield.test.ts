import { describe, it, expect } from 'bun:test';
import { formatBytes, calculateStoragePercentage, storageShield } from '../src/services/storageShield';

describe('Storage Shield & Quota Estimation', () => {
  it('correctly formats bytes into human-readable strings', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1024 * 1024 * 5.5)).toBe('5.5 MB');
    expect(formatBytes(1024 * 1024 * 1024 * 2.25)).toBe('2.3 GB');
  });

  it('calculates storage quota percentage accurately', () => {
    expect(calculateStoragePercentage(50, 100)).toBe(50);
    expect(calculateStoragePercentage(1, 1000)).toBe(0.1);
    expect(calculateStoragePercentage(0, 0)).toBe(0);
    expect(calculateStoragePercentage(250, 1000)).toBe(25);
  });

  it('provides safe fallbacks when browser navigator.storage is undefined or restricted', async () => {
    const isPersisted = await storageShield.isPersisted();
    expect(typeof isPersisted).toBe('boolean');

    const estimate = await storageShield.getStorageEstimate();
    expect(estimate).toBeDefined();
    expect(typeof estimate.usedBytes).toBe('number');
    expect(typeof estimate.quotaBytes).toBe('number');
    expect(typeof estimate.percentage).toBe('number');
    expect(typeof estimate.isPersisted).toBe('boolean');
  });
});
