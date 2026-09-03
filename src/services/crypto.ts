import type { EncryptedPayload } from '../types';

/**
 * High-Security Zero-Knowledge Cryptography Service
 * - AES-256-GCM (Authenticated Encryption with Associated Data)
 * - PBKDF2 with SHA-256 & 600,000 iterations (OWASP recommended defense against GPU/ASIC brute force)
 * - Cryptographically random 16-byte salt and 12-byte IV per encryption operation
 * - Associated Data (AD) binding: binds Note ID to ciphertext to defeat MITM ciphertext swapping
 * - Zero-knowledge: plaintext and keys never leave client memory
 */

// Helper: Convert Uint8Array to Base64
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Convert Base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Cross-environment WebCrypto accessor (browser + test runner)
function getCrypto(): Crypto {
  if (typeof window !== 'undefined' && window.crypto) return window.crypto;
  if (typeof globalThis !== 'undefined' && globalThis.crypto) return globalThis.crypto as Crypto;
  throw new Error('Web Crypto API is not supported in this runtime');
}

export class NoteCryptoService {
  private readonly ITERATIONS = 600_000; // Exceeds OWASP 2024 guidance of 310,000
  private readonly SALT_BYTES = 16;
  private readonly IV_BYTES = 12;

  /**
   * Derives an AES-GCM-256 CryptoKey from a passphrase using PBKDF2-HMAC-SHA-256
   */
  private async deriveKey(passphrase: string, salt: Uint8Array, keyUsage: KeyUsage[]): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passphraseBytes = encoder.encode(passphrase);
    const crypto = getCrypto();

    // Import the passphrase as raw key material for KDF
    const baseKey = await crypto.subtle.importKey(
      'raw',
      passphraseBytes,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    // Derive 256-bit AES-GCM key with 600,000 iterations
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as unknown as ArrayBuffer,
        iterations: this.ITERATIONS,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false, // non-extractable from browser memory
      keyUsage
    );
  }

  /**
   * Encrypts note plaintext with AES-256-GCM and binds it to the note's ID
   * @param plaintext The note markdown content to encrypt
   * @param passphrase The user's secret password/PIN
   * @param noteId Unique Note ID bound as Associated Data (anti-MITM relocation)
   * @param hint Optional hint to help user remember passphrase
   */
  public async encrypt(
    plaintext: string,
    passphrase: string,
    noteId: string,
    hint?: string
  ): Promise<EncryptedPayload> {
    if (!passphrase || passphrase.trim().length === 0) {
      throw new Error('Passphrase cannot be empty');
    }

    const crypto = getCrypto();

    // 1. Generate cryptographically strong random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(this.SALT_BYTES));
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_BYTES));

    // 2. Derive 256-bit AES-GCM key
    const key = await this.deriveKey(passphrase, salt, ['encrypt']);

    // 3. Prepare Associated Data (bind noteId into authentication tag)
    const encoder = new TextEncoder();
    const additionalData = encoder.encode(`noteflow:bound-id:${noteId}`);
    const plaintextBytes = encoder.encode(plaintext);

    // 4. Perform authenticated encryption
    const ciphertextBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as ArrayBuffer,
        additionalData: additionalData as unknown as ArrayBuffer,
        tagLength: 128 // 128-bit authentication tag
      },
      key,
      plaintextBytes
    );

    return {
      salt: uint8ArrayToBase64(salt),
      iv: uint8ArrayToBase64(iv),
      ciphertext: uint8ArrayToBase64(new Uint8Array(ciphertextBuffer)),
      hint: hint?.trim() || undefined,
      algorithm: 'AES-GCM-256',
      kdf: 'PBKDF2-SHA256-600K'
    };
  }

  /**
   * Decrypts an AES-256-GCM encrypted note payload
   * Verifies the 128-bit authentication tag and noteId binding
   * Throws if passphrase is wrong or if any bit of data has been altered (MITM detection)
   */
  public async decrypt(
    payload: EncryptedPayload,
    passphrase: string,
    noteId: string
  ): Promise<string> {
    if (!passphrase || passphrase.trim().length === 0) {
      throw new Error('Passphrase cannot be empty');
    }

    try {
      const salt = base64ToUint8Array(payload.salt);
      const iv = base64ToUint8Array(payload.iv);
      const ciphertextBytes = base64ToUint8Array(payload.ciphertext);

      // Derive key
      const key = await this.deriveKey(passphrase, salt, ['decrypt']);

      // Associated data verification
      const encoder = new TextEncoder();
      const additionalData = encoder.encode(`noteflow:bound-id:${noteId}`);
      const crypto = getCrypto();

      // Perform authenticated decryption
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv as unknown as ArrayBuffer,
          additionalData: additionalData as unknown as ArrayBuffer,
          tagLength: 128
        },
        key,
        ciphertextBytes as unknown as ArrayBuffer
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch {
      // Any tampering, corrupted tag, or invalid key will trigger WebCrypto OperationError
      throw new Error('Authentication failed: Incorrect password or encrypted data has been tampered with (integrity violation).');
    }
  }

  /**
   * Calculates passphrase entropy/strength score
   */
  public evaluateStrength(passphrase: string): { score: number; label: 'Weak' | 'Fair' | 'Good' | 'Strong'; color: string } {
    if (!passphrase) return { score: 0, label: 'Weak', color: 'var(--color-danger)' };

    let score = 0;
    if (passphrase.length >= 8) score += 25;
    if (passphrase.length >= 14) score += 25;
    if (/[A-Z]/.test(passphrase)) score += 15;
    if (/[0-9]/.test(passphrase)) score += 15;
    if (/[^A-Za-z0-9]/.test(passphrase)) score += 20;

    if (score < 40) return { score, label: 'Weak', color: 'var(--color-danger)' };
    if (score < 70) return { score, label: 'Fair', color: 'var(--color-warning)' };
    if (score < 85) return { score, label: 'Good', color: 'var(--color-info)' };
    return { score: 100, label: 'Strong', color: 'var(--color-success)' };
  }
}

export const cryptoService = new NoteCryptoService();
