import { describe, it, expect } from 'bun:test';
import { conflictResolver } from '../src/services/conflictResolver';
import { syncEngine } from '../src/services/syncEngine';
import { type Note } from '../src/types';

describe('Conflict Resolution & Delta Sync Protocol', () => {
  it('resolves conflicts in favor of latest timestamp (Last-Write-Wins)', () => {
    const localNote: Note = {
      id: 'n-1',
      title: 'Local Version',
      content: 'Local Content that was drafted offline',
      updatedAt: 1000,
      createdAt: 500,
      tags: [],
      isPinned: false,
      isArchived: false,
      isTrashed: false
    };

    const remoteNote: Note = {
      id: 'n-1',
      title: 'Remote Version (Newer)',
      content: 'Remote Content from another device',
      updatedAt: 2000,
      createdAt: 500,
      tags: [],
      isPinned: false,
      isArchived: false,
      isTrashed: false
    };

    const result = conflictResolver.resolveNoteConflict(localNote, remoteNote);
    expect(result.winner.title).toBe('Remote Version (Newer)');
    expect(result.conflictFork).toBeDefined();
    expect(result.conflictFork?.title).toContain('[Conflict Copy]');
    expect(result.conflictFork?.content).toBe(localNote.content);
  });

  it('preserves local note without fork if local is strictly newer', () => {
    const localNote: Note = {
      id: 'n-2',
      title: 'Local Newer Note',
      content: 'Local latest edits',
      updatedAt: 5000,
      createdAt: 500,
      tags: [],
      isPinned: false,
      isArchived: false,
      isTrashed: false
    };

    const remoteNote: Note = {
      id: 'n-2',
      title: 'Stale Remote Note',
      content: 'Old remote edits',
      updatedAt: 3000,
      createdAt: 500,
      tags: [],
      isPinned: false,
      isArchived: false,
      isTrashed: false
    };

    const result = conflictResolver.resolveNoteConflict(localNote, remoteNote);
    expect(result.winner.title).toBe('Local Newer Note');
    expect(result.conflictFork).toBeUndefined();
  });

  it('manages last sync timestamp tracking in client storage', () => {
    syncEngine.setLastSyncTimestamp(12345678);
    expect(syncEngine.getLastSyncTimestamp()).toBe(12345678);
  });
});
