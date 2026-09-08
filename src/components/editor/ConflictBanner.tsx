import React, { useMemo } from 'react';
import { AlertTriangle, Columns3, Check, Trash2 } from 'lucide-react';
import type { Note } from '../../types';
import { Button } from '../ui/Button';

interface ConflictBannerProps {
  currentNote: Note;
  allNotes: Note[];
  onOpenSplit?: (noteId: string) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
}

export const ConflictBanner: React.FC<ConflictBannerProps> = ({
  currentNote,
  allNotes,
  onOpenSplit,
  onUpdateNote,
  onDeleteNote
}) => {
  const isThisAConflictFork = currentNote.title.startsWith('[Conflict Copy]') || currentNote.id.startsWith('n-conflict-');

  // Find paired note
  const pairedNote = useMemo(() => {
    if (isThisAConflictFork) {
      // Find original note by stripping [Conflict Copy] prefix
      const cleanTitle = currentNote.title.replace(/^\[Conflict Copy\]\s*/, '').trim();
      return allNotes.find((n) => n.id !== currentNote.id && !n.isTrashed && n.title.trim() === cleanTitle) || null;
    } else {
      // Find if there is a conflict copy referencing this note
      return allNotes.find((n) => n.id !== currentNote.id && !n.isTrashed && n.title.startsWith('[Conflict Copy]') && n.title.includes(currentNote.title)) || null;
    }
  }, [allNotes, currentNote, isThisAConflictFork]);

  // If neither this note nor any other note is a conflict copy, don't render anything
  if (!isThisAConflictFork && !pairedNote) {
    return null;
  }

  const handleKeepThisVersion = () => {
    if (isThisAConflictFork) {
      const cleanTitle = currentNote.title.replace(/^\[Conflict Copy\]\s*/, '').trim();
      onUpdateNote({
        ...currentNote,
        title: cleanTitle || 'Resolved Note',
        updatedAt: new Date().toISOString()
      });
    }
    // If paired note is the conflict copy, trash it
    if (pairedNote && (pairedNote.title.startsWith('[Conflict Copy]') || pairedNote.id.startsWith('n-conflict-'))) {
      onDeleteNote(pairedNote.id);
    }
  };

  const handleDiscardConflict = () => {
    if (isThisAConflictFork) {
      onDeleteNote(currentNote.id);
    } else if (pairedNote) {
      onDeleteNote(pairedNote.id);
    }
  };

  return (
    <div
      className="sync-conflict-banner"
      style={{
        margin: '8px 16px 12px 16px',
        padding: '10px 14px',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(239, 68, 68, 0.08) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <div
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '6px',
            background: 'rgba(245, 158, 11, 0.2)',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <AlertTriangle size={16} />
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isThisAConflictFork ? 'Preserved Local Conflict Copy' : 'Cloud Sync Conflict Detected'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {isThisAConflictFork
              ? 'This draft was preserved during cloud sync because remote changes were newer. Compare both versions to merge edits.'
              : `A conflicting offline version ("${pairedNote?.title}") exists for this note.`}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {pairedNote && onOpenSplit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenSplit(pairedNote.id)}
            title="Open both notes in split view to compare differences"
          >
            <Columns3 size={13} style={{ marginRight: '5px' }} />
            Compare Side-by-Side
          </Button>
        )}

        <Button
          variant="primary"
          size="sm"
          onClick={handleKeepThisVersion}
          title="Keep this version as the primary note"
        >
          <Check size={13} style={{ marginRight: '5px' }} />
          Keep This Version
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDiscardConflict}
          title="Discard the conflict copy"
        >
          <Trash2 size={13} style={{ marginRight: '5px', color: '#ef4444' }} />
          Discard Copy
        </Button>
      </div>
    </div>
  );
};
