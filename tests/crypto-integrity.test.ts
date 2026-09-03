import { describe, it, expect } from 'bun:test';
import { cryptoService } from '../src/services/crypto';

describe('Zero-Knowledge Cryptographic Integrity & Anti-MITM Tests', () => {
  const noteId = 'note-secure-999';
  const passphrase = 'Ultra-Secure-Password!2026';
  const secretContent = '# Secret Financial Roadmap\n- Confidential projection: $5,000,000\n- Password: xyz';

  it('successfully encrypts and decrypts with AES-256-GCM and PBKDF2 (600,000 iterations)', async () => {
    const encrypted = await cryptoService.encrypt(secretContent, passphrase, noteId, 'Financial hint');

    expect(encrypted.algorithm).toBe('AES-GCM-256');
    expect(encrypted.kdf).toBe('PBKDF2-SHA256-600K');
    expect(encrypted.hint).toBe('Financial hint');
    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.salt).toBeDefined();
    expect(encrypted.iv).toBeDefined();

    // Verify plaintext is NOT in ciphertext
    expect(encrypted.ciphertext).not.toContain('Secret Financial Roadmap');

    // Decrypt
    const decrypted = await cryptoService.decrypt(encrypted, passphrase, noteId);
    expect(decrypted).toBe(secretContent);
  });

  it('rejects decryption with an incorrect passphrase', async () => {
    const encrypted = await cryptoService.encrypt(secretContent, passphrase, noteId);

    expect(
      cryptoService.decrypt(encrypted, 'WrongPassword123!', noteId)
    ).rejects.toThrow();
  });

  it('INTEGRITY CHECK (MITM Detection): Rejects ciphertext if even a single bit is modified', async () => {
    const encrypted = await cryptoService.encrypt(secretContent, passphrase, noteId);

    // Tamper with ciphertext by flipping characters
    const tamperedCiphertext = encrypted.ciphertext.slice(0, 10) + 'X' + encrypted.ciphertext.slice(11);
    const tamperedPayload = { ...encrypted, ciphertext: tamperedCiphertext };

    // AES-GCM 128-bit authentication tag MUST fail
    expect(
      cryptoService.decrypt(tamperedPayload, passphrase, noteId)
    ).rejects.toThrow(/tampered with|Authentication failed/i);
  });

  it('INTEGRITY CHECK (MITM Detection): Rejects IV tampering', async () => {
    const encrypted = await cryptoService.encrypt(secretContent, passphrase, noteId);

    // Tamper with IV
    const tamperedIv = encrypted.iv.slice(0, 4) + 'AAAA' + encrypted.iv.slice(8);
    const tamperedPayload = { ...encrypted, iv: tamperedIv };

    expect(
      cryptoService.decrypt(tamperedPayload, passphrase, noteId)
    ).rejects.toThrow();
  });

  it('ANTI-RELOCATION CHECK (Associated Data Binding): Cannot decrypt Note A ciphertext under Note B id', async () => {
    const noteA_Id = 'note-alpha-100';
    const noteB_Id = 'note-beta-200';

    const encryptedA = await cryptoService.encrypt(secretContent, passphrase, noteA_Id);

    // Attacker attempts to transplant Note A's encrypted payload into Note B
    expect(
      cryptoService.decrypt(encryptedA, passphrase, noteB_Id)
    ).rejects.toThrow(/tampered with|Authentication failed/i);
  });

  it('evaluates passphrase entropy strength scores properly', () => {
    const weak = cryptoService.evaluateStrength('123');
    expect(weak.label).toBe('Weak');
    expect(weak.score).toBeLessThan(40);

    const fair = cryptoService.evaluateStrength('password123');
    expect(fair.label).toBe('Fair');

    const strong = cryptoService.evaluateStrength('P@ssw0rd_Super_Long_Complex!2026');
    expect(strong.label).toBe('Strong');
    expect(strong.score).toBeGreaterThanOrEqual(85);
  });
});
