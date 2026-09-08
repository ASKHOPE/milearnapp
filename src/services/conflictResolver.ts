import { type Note } from '../types';

export interface ConflictResolutionResult {
  winner: Note;
  conflictFork?: Note;
}

export const conflictResolver = {
  /**
   * Resolves a conflict between a local note and a remote incoming note.
   * Uses Last-Write-Wins (LWW) based on updatedAt timestamp.
   * If the remote note wins but the local note has differing content,
   * a non-destructive conflict fork is generated so user work is never erased.
   */
  resolveNoteConflict(local: Note, remote: Note): ConflictResolutionResult {
    // If contents and titles are identical, no fork is needed
    if (local.content === remote.content && local.title === remote.title) {
      const localTime = new Date(local.updatedAt).getTime() || 0;
      const remoteTime = new Date(remote.updatedAt).getTime() || 0;
      return { winner: remoteTime >= localTime ? remote : local };
    }

    const localTime = new Date(local.updatedAt).getTime() || 0;
    const remoteTime = new Date(remote.updatedAt).getTime() || 0;

    if (remoteTime > localTime) {
      // Remote wins; preserve local draft safely in a conflict fork
      const conflictFork: Note = {
        ...local,
        id: 'n-conflict-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        title: `[Conflict Copy] ${local.title || 'Untitled'}`,
        updatedAt: new Date().toISOString()
      };
      return {
        winner: remote,
        conflictFork
      };
    } else {
      // Local note is newer; local wins
      return {
        winner: local
      };
    }
  }
};
