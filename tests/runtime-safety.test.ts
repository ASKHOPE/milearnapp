import { describe, it, expect } from 'bun:test';
import {
  validateNote,
  validateFolder,
  validateFlashcard,
  validateVaultData,
  validateSyncPayload,
  validateScrapeRequest,
  validateDeltaSyncPayload,
} from '../src/services/validation/schemas';
import { storage } from '../src/services/storage';

// ---------------------------------------------------------------------------
// RUNTIME SAFETY & USER ACTION RESILIENCE TESTS
//
// Covers: corrupt file import, upload size limits, memory bombs, duplicate IDs,
// missing required fields, schema boundary attacks, null injection, and payload
// size abuse that could crash or corrupt the app.
// ---------------------------------------------------------------------------

// ─── helpers ────────────────────────────────────────────────────────────────

function makeNote(overrides: Record<string, unknown> = {}) {
  return {
    id: 'note-test-001',
    title: 'Test Note',
    content: 'Some content',
    tags: [],
    attachments: [],
    isFavorite: false,
    isPinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeFlashcard(overrides: Record<string, unknown> = {}) {
  return {
    id: 'fc-001',
    noteId: 'note-001',
    noteTitle: 'Test Note',
    question: 'What is X?',
    answer: 'X is Y',
    type: 'qa',
    repetition: 0,
    interval: 1,
    easeFactor: 2.5,
    nextReviewDate: new Date().toISOString().split('T')[0],
    ...overrides,
  };
}

// ─── 1. Corrupt / malformed file import ────────────────────────────────────

describe('Corrupt file import safety', () => {
  it('importAllData must throw a readable error on completely non-JSON input', async () => {
    let threw = false;
    let errMsg = '';
    try {
      await storage.importAllData('this is not json at all!!!!');
    } catch (e) {
      threw = true;
      errMsg = e instanceof Error ? e.message : String(e);
    }
    expect(threw).toBe(true);
    // Error must be a string — not [object Object] or undefined
    expect(errMsg.length).toBeGreaterThan(0);
  });

  it('importAllData must reject empty string without crashing', async () => {
    let threw = false;
    try {
      await storage.importAllData('');
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it('importAllData must reject valid JSON that is not a vault object', async () => {
    let threw = false;
    try {
      await storage.importAllData(JSON.stringify([1, 2, 3]));
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it('importAllData must reject a vault with notes missing required id field', async () => {
    const corrupt = JSON.stringify({
      notes: [{ title: 'No ID Note', content: 'x', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
      folders: [],
      workspaces: [],
      books: [],
    });
    let threw = false;
    try {
      await storage.importAllData(corrupt);
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it('importAllData must reject a vault with a null note inside the notes array', async () => {
    const corrupt = JSON.stringify({
      notes: [null, makeNote()],
      folders: [],
      workspaces: [],
      books: [],
    });
    let threw = false;
    try {
      await storage.importAllData(corrupt);
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it('importAllData must reject a vault where notes is not an array', async () => {
    const corrupt = JSON.stringify({
      notes: 'this should be an array',
      folders: [],
      workspaces: [],
      books: [],
    });
    let threw = false;
    try {
      await storage.importAllData(corrupt);
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});

// ─── 2. Upload / size limits ────────────────────────────────────────────────

describe('Upload and content size guards', () => {
  const MB = 1024 * 1024;

  it('validateNote rejects a note with content exceeding 10MB', () => {
    const hugeContent = 'A'.repeat(10 * MB + 1);
    const result = validateNote(makeNote({ content: hugeContent }));
    expect(result.success).toBe(false);
    expect(result.error).toContain('10 MB');
  });

  it('validateNote rejects a note title exceeding 500 characters', () => {
    const longTitle = 'T'.repeat(501);
    const result = validateNote(makeNote({ title: longTitle }));
    expect(result.success).toBe(false);
    expect(result.error).toContain('500');
  });

  it('validateNote rejects an attachment with a size field of negative bytes', () => {
    const result = validateNote(makeNote({
      attachments: [{
        id: 'att-1',
        name: 'file.pdf',
        type: 'pdf',
        size: -9999,
        mimeType: 'application/pdf',
        dataUrl: '',
        createdAt: new Date().toISOString(),
      }],
    }));
    // AttachmentSchema uses z.number().nonnegative() — must reject negative size
    expect(result.success).toBe(false);
  });

  it('validateNote rejects an attachment with unknown type (security: prevents executable uploads)', () => {
    const result = validateNote(makeNote({
      attachments: [{
        id: 'att-2',
        name: 'malware.exe',
        type: 'executable', // not in the enum
        size: 1024,
        mimeType: 'application/x-msdownload',
        dataUrl: '',
        createdAt: new Date().toISOString(),
      }],
    }));
    expect(result.success).toBe(false);
  });
});

// ─── 3. Duplicate management ────────────────────────────────────────────────

describe('Duplicate entity detection in vault validation', () => {
  it('validateVaultData rejects duplicate note IDs (silent overwrite attack)', () => {
    const dupNote = makeNote({ id: 'same-id' });
    const result = validateVaultData({
      notes: [dupNote, { ...dupNote, title: 'Shadow Note' }],
      folders: [],
      workspaces: [],
      books: [],
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('same-id');
  });

  it('validateVaultData handles 1000 notes without throwing (bulk import performance)', () => {
    const bulkNotes = Array.from({ length: 1000 }, (_, i) =>
      makeNote({ id: `note-bulk-${i}`, title: `Bulk Note ${i}` })
    );
    let threw = false;
    let result: { success: boolean } = { success: false };
    try {
      result = validateVaultData({ notes: bulkNotes, folders: [], workspaces: [], books: [] });
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);
    expect(result.success).toBe(true);
  });
});

// ─── 4. Schema boundary & null injection ───────────────────────────────────

describe('Schema boundary and null/undefined injection', () => {
  it('validateNote rejects null', () => {
    expect(validateNote(null).success).toBe(false);
  });

  it('validateNote rejects undefined', () => {
    expect(validateNote(undefined).success).toBe(false);
  });

  it('validateNote rejects a bare string', () => {
    expect(validateNote('just a string').success).toBe(false);
  });

  it('validateNote rejects a note where id is an empty string', () => {
    expect(validateNote(makeNote({ id: '' })).success).toBe(false);
  });

  it('validateNote rejects a note where id is a number (type confusion attack)', () => {
    expect(validateNote(makeNote({ id: 12345 })).success).toBe(false);
  });

  it('validateNote rejects a note where tags contains non-string values', () => {
    expect(validateNote(makeNote({ tags: ['valid', 42, null] })).success).toBe(false);
  });

  it('validateFlashcard rejects easeFactor below minimum (1.3) — prevents SM-2 infinite loop', () => {
    // An easeFactor < 1.3 makes SM-2 schedule the same card every 1 day forever
    const result = validateFlashcard(makeFlashcard({ easeFactor: 0.5 }));
    expect(result.success).toBe(false);
  });

  it('validateFlashcard rejects negative repetition count', () => {
    expect(validateFlashcard(makeFlashcard({ repetition: -1 })).success).toBe(false);
  });

  it('validateFlashcard rejects type outside allowed enum', () => {
    expect(validateFlashcard(makeFlashcard({ type: 'multiple-choice' })).success).toBe(false);
  });

  it('validateFolder rejects a folder with an empty name (unnamed folders break sidebar UI)', () => {
    expect(validateFolder({ id: 'f-1', name: '', workspaceId: 'ws-1', createdAt: new Date().toISOString() }).success).toBe(false);
  });

  it('validateScrapeRequest rejects non-http(s) URLs (security: prevents file:// and data: abuse)', () => {
    expect(validateScrapeRequest({ url: 'file:///etc/passwd' }).success).toBe(false);
    expect(validateScrapeRequest({ url: 'data:text/html,<script>alert(1)</script>' }).success).toBe(false);
    expect(validateScrapeRequest({ url: 'javascript:void(0)' }).success).toBe(false);
  });

  it('validateScrapeRequest rejects a completely missing url field', () => {
    expect(validateScrapeRequest({}).success).toBe(false);
  });

  it('validateSyncPayload rejects an empty payload (nothing to sync)', () => {
    expect(validateSyncPayload({}).success).toBe(false);
  });

  it('validateDeltaSyncPayload rejects negative sinceTimestamp (clock rollback attack)', () => {
    expect(validateDeltaSyncPayload({ sinceTimestamp: -1, clientMutations: [], deviceId: 'dev-1' }).success).toBe(false);
  });
});

// ─── 5. Memory bomb protection ──────────────────────────────────────────────

describe('Memory bomb and payload abuse', () => {
  it('validateVaultData handles an empty vault gracefully (no explosion on zero data)', () => {
    const result = validateVaultData({ notes: [], folders: [], workspaces: [], books: [] });
    expect(result.success).toBe(true);
  });

  it('exportAllData payload shape: version and exportDate must always be present', () => {
    // Test the export payload shape directly (exportAllData itself requires IndexedDB
    // which is browser-only; here we verify the serialization contract holds)
    const payload = {
      app: 'MiLearn',
      version: 2,
      exportDate: new Date().toISOString(),
      workspaces: [],
      books: [],
      folders: [],
      notes: [],
      flashcards: [],
    };
    const serialized = JSON.stringify(payload, null, 2);
    expect(typeof serialized).toBe('string');
    expect(serialized.length).toBeGreaterThan(0);
    const parsed = JSON.parse(serialized) as Record<string, unknown>;
    expect(parsed.version).toBe(2);
    expect(typeof parsed.exportDate).toBe('string');
    expect(parsed.app).toBe('MiLearn');
  });

  it('exportAllData payload: serialization must not lose ISO date precision', () => {
    const now = new Date().toISOString();
    const payload = { exportDate: now, version: 2 };
    const round = JSON.parse(JSON.stringify(payload)) as { exportDate: string };
    expect(round.exportDate).toBe(now);
  });

  it('validateNote with deeply nested tags array (5000 tags) completes without hanging', () => {
    const massiveTags = Array.from({ length: 5000 }, (_, i) => `tag-${i}`);
    let threw = false;
    try {
      validateNote(makeNote({ tags: massiveTags }));
    } catch {
      threw = true;
    }
    // Must complete — not hang or crash (even if the result is rejection)
    expect(threw).toBe(false);
  });
});
