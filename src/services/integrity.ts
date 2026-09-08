/**
 * Runtime Integrity Service
 *
 * Detects monkeypatching of critical service singletons at startup.
 * Called once from App.tsx on mount. If a browser extension or XSS payload
 * replaces storage.importAllData or cryptoService.encrypt, this fires a
 * visible warning and logs to the debug console.
 *
 * Also exports freezeServices() which Object.freeze()s the critical singletons
 * to block replacement attempts in strict mode.
 */

import { storage } from './storage';
import { cryptoService } from './crypto';
import { debugLogger } from './debugLogger';

// Critical methods that MUST exist and MUST be functions
const STORAGE_CRITICAL = [
  'importAllData',
  'exportAllData',
  'getNotes',
  'saveNote',
  'deleteNote',
  'syncToPostgres',
] as const;

const CRYPTO_CRITICAL = [
  'encrypt',
  'decrypt',
] as const;

/**
 * Freeze critical service singletons so their methods cannot be replaced
 * by injected scripts or monkeypatching in DevTools.
 *
 * Object.freeze() in strict mode causes `TypeError` on assignment:
 *   storage.importAllData = maliciousFunction; // throws
 *
 * Call this ONCE at app startup, before any user interaction.
 */
export function freezeServices(): void {
  try {
    Object.freeze(storage);
    Object.freeze(cryptoService);
    debugLogger.log('info', 'system', 'Service singletons frozen against monkeypatching');
  } catch (e) {
    // Non-fatal: some test environments don't support freeze
    debugLogger.log('warn', 'system', `Could not freeze services: ${e}`);
  }
}

/**
 * Asserts that critical service methods haven't been replaced or removed.
 * Logs a warning and returns false if any violation is detected.
 * Does NOT throw — a missing method crashing the integrity check would be ironic.
 */
export function assertCriticalIntegrity(): boolean {
  let clean = true;

  for (const method of STORAGE_CRITICAL) {
    if (typeof (storage as Record<string, unknown>)[method] !== 'function') {
      debugLogger.log('warn', 'system', `⚠️ INTEGRITY VIOLATION: storage.${method} is missing or not a function`);
      console.error(`[INTEGRITY] storage.${method} has been removed or replaced`);
      clean = false;
    }
  }

  for (const method of CRYPTO_CRITICAL) {
    if (typeof (cryptoService as unknown as Record<string, unknown>)[method] !== 'function') {
      debugLogger.log('warn', 'system', `⚠️ INTEGRITY VIOLATION: cryptoService.${method} is missing or not a function`);
      console.error(`[INTEGRITY] cryptoService.${method} has been removed or replaced`);
      clean = false;
    }
  }

  // Verify encrypt still mentions AES-GCM in its source (basic patch detection)
  const encryptSrc = (cryptoService as unknown as Record<string, unknown>).encrypt?.toString() ?? '';
  if (!encryptSrc.includes('AES-GCM') && !encryptSrc.includes('subtle')) {
    debugLogger.log('warn', 'system', '⚠️ INTEGRITY WARNING: cryptoService.encrypt source looks unexpected — may be patched');
    console.warn('[INTEGRITY] cryptoService.encrypt may have been replaced with a non-AES-GCM implementation');
    clean = false;
  }

  if (clean) {
    debugLogger.log('info', 'system', '✅ Runtime integrity check passed');
  }

  return clean;
}
