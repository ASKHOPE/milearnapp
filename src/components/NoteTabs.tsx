import React from 'react';
import type { Note } from '../types';
import { FileText, X, Plus } from 'lucide-react';

interface NoteTabsProps {
  openNoteIds: string[];
  activeNoteId: string | null;
  allNotes: Note[];
  onSelectTab: (noteId: string) => void;
  onCloseTab: (noteId: string, e: React.MouseEvent) => void;
  onNewTab: () => void;
}

export const NoteTabs: React.FC<NoteTabsProps> = ({
  openNoteIds,
  activeNoteId,
  allNotes,
  onSelectTab,
  onCloseTab,
  onNewTab
}) => {
  if (openNoteIds.length === 0) return null;

  return (
    <div className="note-tabs-bar">
      <div className="note-tabs-scroll">
        {openNoteIds.map((noteId) => {
          const note = allNotes.find((n) => n.id === noteId);
          if (!note) return null;
          const isActive = noteId === activeNoteId;

          return (
            <div
              key={noteId}
              className={`note-tab-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(noteId)}
              title={note.title || 'Untitled Note'}
            >
              <FileText size={13} className="note-tab-icon" />
              <span className="note-tab-title">{note.title || 'Untitled Note'}</span>
              <button
                className="note-tab-close"
                onClick={(e) => onCloseTab(noteId, e)}
                title="Close Tab"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>

      <button className="note-tab-add" onClick={onNewTab} title="New Note Tab">
        <Plus size={14} />
      </button>
    </div>
  );
};
