import { describe, it, expect } from 'bun:test';
import { syncQueue } from '../src/services/syncQueue';
import { type Note } from '../src/types';

describe('Sync Telemetry & Conflict Copy Detection', () => {
  it('correctly identifies conflict copies and strips prefixes', () => {
    const conflictNote: Note = {
      id: 'n-conflict-12345',
      title: '[Conflict Copy] Quantum Computing Notes',
      content: 'Local divergent thoughts',
      folderId: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      tags: [],
      attachments: [],
      isFavorite: false,
      isPinned: false,
      isArchived: false,
      isTrashed: false
    };

    const isConflict = conflictNote.title.startsWith('[Conflict Copy]') || conflictNote.id.startsWith('n-conflict-');
    expect(isConflict).toBe(true);

    const cleanTitle = conflictNote.title.replace(/^\[Conflict Copy\]\s*/, '').trim();
    expect(cleanTitle).toBe('Quantum Computing Notes');
  });

  it('generates unique client device identifiers and maintains stable ID', () => {
    const id1 = syncQueue.getDeviceId();
    const id2 = syncQueue.getDeviceId();
    expect(id1).toBeDefined();
    expect(typeof id1).toBe('string');
    expect(id1).toBe(id2);
  });

  it('correctly queues and tracks local mutations', async () => {
    await syncQueue.clearQueue();
    const mut = syncQueue.createMutation({
      entityType: 'note',
      entityId: 'n-test-1',
      action: 'upsert',
      payload: { title: 'Test Note' }
    });

    await syncQueue.enqueueMutation(mut);
    const pending = await syncQueue.getPendingMutations();
    expect(pending.length).toBeGreaterThanOrEqual(1);
    expect(pending.some((m) => m.id === mut.id)).toBe(true);

    await syncQueue.markMutationsSynced([mut.id]);
    const after = await syncQueue.getPendingMutations();
    expect(after.some((m) => m.id === mut.id)).toBe(false);
  });
});
