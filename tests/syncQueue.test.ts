import { describe, it, expect } from 'bun:test';
import { syncQueue } from '../src/services/syncQueue';

describe('Local Mutation Sync Queue', () => {
  it('generates and persists a stable client device ID', () => {
    const id1 = syncQueue.getDeviceId();
    const id2 = syncQueue.getDeviceId();
    expect(id1).toBeDefined();
    expect(id1.length).toBeGreaterThan(5);
    expect(id1).toBe(id2);
  });

  it('creates well-formed mutations with timestamp and unique IDs', () => {
    const mutation = syncQueue.createMutation({
      entityType: 'note',
      entityId: 'note-123',
      action: 'upsert',
      payload: { title: 'Differential Sync Note' }
    });

    expect(mutation.id).toMatch(/^mut-/);
    expect(mutation.entityType).toBe('note');
    expect(mutation.entityId).toBe('note-123');
    expect(mutation.action).toBe('upsert');
    expect(mutation.timestamp).toBeGreaterThan(0);
    expect(mutation.synced).toBe(false);
  });

  it('handles in-memory mutation queue management cleanly when running without browser IndexedDB', async () => {
    const mut1 = syncQueue.createMutation({
      entityType: 'note',
      entityId: 'note-1',
      action: 'upsert',
      payload: { title: 'Note 1' }
    });

    const mut2 = syncQueue.createMutation({
      entityType: 'folder',
      entityId: 'folder-1',
      action: 'upsert',
      payload: { name: 'Folder 1' }
    });

    await syncQueue.enqueueMutation(mut1);
    await syncQueue.enqueueMutation(mut2);

    const pending = await syncQueue.getPendingMutations();
    expect(pending.length).toBeGreaterThanOrEqual(2);

    await syncQueue.markMutationsSynced([mut1.id]);
    const afterSync = await syncQueue.getPendingMutations();
    expect(afterSync.some((m: import('../src/services/syncQueue').SyncMutation) => m.id === mut1.id)).toBe(false);

    await syncQueue.clearQueue();
    const afterClear = await syncQueue.getPendingMutations();
    expect(afterClear.length).toBe(0);
  });
});
