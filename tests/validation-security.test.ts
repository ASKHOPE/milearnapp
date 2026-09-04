import { describe, it, expect } from 'bun:test';
import { 
  validateNote, 
  validateFolder, 
  validateFlashcard, 
  validateVaultData, 
  validateSyncPayload,
  validateScrapeRequest
} from '../src/services/validation/schemas';
import { passwordService } from '../src/services/db/passwordService';

describe('Zod Runtime Schema Validation & Vault Resilience Tests', () => {
  it('successfully validates a complete Note object', () => {
    const validNote = {
      id: 'n-test-101',
      title: 'Active Recall in Computer Science',
      content: '# Heading\nDetailed notes here',
      folderId: 'f-cs',
      workspaceId: 'ws-personal',
      tags: ['study', 'cs'],
      isFavorite: true,
      isPinned: false,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = validateNote(validNote);
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('n-test-101');
    expect(result.data?.title).toBe('Active Recall in Computer Science');
  });

  it('rejects a Note with missing or invalid required properties', () => {
    const invalidNote = {
      title: 'Missing ID note',
      tags: 'not-an-array'
    };

    const result = validateNote(invalidNote);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.fieldErrors?.id).toBeDefined();
  });

  it('validates Folder objects with color and parent bindings', () => {
    const folder = {
      id: 'f-algorithms',
      name: 'Algorithms & Data Structures',
      parentId: 'f-root',
      color: '#4f46e5',
      icon: 'folder',
      createdAt: new Date().toISOString()
    };

    const result = validateFolder(folder);
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe('Algorithms & Data Structures');

    // Rejects empty name
    const emptyFolder = { id: 'f-empty', name: '', createdAt: new Date().toISOString() };
    const invalid = validateFolder(emptyFolder);
    expect(invalid.success).toBe(false);
  });

  it('validates SuperMemo-2 Flashcard schemas and ease factor bounds', () => {
    const card = {
      id: 'fc-test-1',
      noteId: 'n-test-101',
      noteTitle: 'Computer Science',
      question: 'What is O(1) complexity?',
      answer: 'Constant time regardless of input size',
      type: 'concept' as const,
      repetition: 2,
      interval: 6,
      easeFactor: 2.5,
      nextReviewDate: '2026-09-10'
    };

    const result = validateFlashcard(card);
    expect(result.success).toBe(true);

    // Rejects ease factor below 1.3
    const badCard = { ...card, easeFactor: 1.1 };
    const badResult = validateFlashcard(badCard);
    expect(badResult.success).toBe(false);
  });

  it('validates Vault Data backups and catches corrupted or non-conforming structures', () => {
    const validVault = {
      notes: [{
        id: 'n-1',
        title: 'Note 1',
        content: 'Content',
        tags: [],
        attachments: [],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01'
      }],
      folders: [{
        id: 'f-1',
        name: 'Folder 1',
        createdAt: '2026-01-01'
      }],
      workspaces: [{
        id: 'ws-1',
        name: 'Main Workspace',
        icon: '📁',
        color: '#4f46e5'
      }],
      books: []
    };

    const result = validateVaultData(validVault);
    expect(result.success).toBe(true);
    expect(result.data?.notes.length).toBe(1);

    // Rejects corrupted payload missing folders array
    const corruptVault = { notes: 'not-an-array' };
    const corruptResult = validateVaultData(corruptVault);
    expect(corruptResult.success).toBe(false);
  });

  it('enforces that SyncPayload contains at least one valid entity', () => {
    // Empty sync payload is rejected
    const emptySync = {};
    const resEmpty = validateSyncPayload(emptySync);
    expect(resEmpty.success).toBe(false);

    // Valid sync with note is accepted
    const noteSync = {
      note: {
        id: 'n-sync-1',
        title: 'Sync Note',
        content: 'Synced content',
        tags: [],
        attachments: [],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01'
      }
    };
    const resNote = validateSyncPayload(noteSync);
    expect(resNote.success).toBe(true);
  });

  it('validates Web Scraper URLs and rejects invalid protocols or javascript injections', () => {
    const validHttp = validateScrapeRequest({ url: 'https://developer.mozilla.org/en-US/' });
    expect(validHttp.success).toBe(true);

    const invalidProto = validateScrapeRequest({ url: 'javascript:alert(1)' });
    expect(invalidProto.success).toBe(false);

    const badString = validateScrapeRequest({ url: 'not-a-valid-url' });
    expect(badString.success).toBe(false);
  });
});

describe('Bcrypt Password Hashing & Salt Verification Tests', () => {
  it('correctly hashes a password and matches candidate passwords', async () => {
    const plain = 'VaultPassphrase$2026';
    const hash = await passwordService.hashPassword(plain, 8);

    expect(typeof hash).toBe('string');
    expect(passwordService.isBcryptHash(hash)).toBe(true);

    // Matching password verification
    const isMatch = await passwordService.verifyPassword(plain, hash);
    expect(isMatch).toBe(true);

    // Mismatched password rejection
    const isMismatch = await passwordService.verifyPassword('WrongPassword', hash);
    expect(isMismatch).toBe(false);
  });

  it('detects valid vs malformed bcrypt hash strings', () => {
    expect(passwordService.isBcryptHash('$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')).toBe(true);
    expect(passwordService.isBcryptHash('plain-text-password')).toBe(false);
    expect(passwordService.isBcryptHash('')).toBe(false);
  });
});
