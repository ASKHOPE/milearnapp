import React from 'react';
import type { Note } from '../types';
import { FileText, X, Plus, Pencil } from 'lucide-react';

interface NoteTabsProps {
  openNoteIds: string[];
  activeNoteId: string | null;
  allNotes: Note[];
  onSelectTab: (noteId: string) => void;
  onCloseTab: (noteId: string, e: React.MouseEvent) => void;
  onNewTab: () => void;
  onRenameTab?: (noteId: string, newTitle: string) => void;
}

export const NoteTabs: React.FC<NoteTabsProps> = ({
  openNoteIds,
  activeNoteId,
  allNotes,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onRenameTab
}) => {
  const [editingTabId, setEditingTabId] = React.useState<string | null>(null);
  const [editTabTitle, setEditTabTitle] = React.useState('');

  if (openNoteIds.length === 0) return null;

  const handleStartRename = (noteId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingTabId(noteId);
    setEditTabTitle(currentTitle || 'Untitled Note');
  };

  const handleSaveRename = (noteId: string) => {
    if (onRenameTab && editTabTitle.trim()) {
      onRenameTab(noteId, editTabTitle.trim());
    }
    setEditingTabId(null);
  };

  return (
    <div className="note-tabs-bar">
      <div className="note-tabs-scroll">
        {openNoteIds.map((noteId) => {
          const note = allNotes.find((n) => n.id === noteId);
          if (!note) return null;
          const isActive = noteId === activeNoteId;
          const isEditing = editingTabId === noteId;

          return (
            <div
              key={noteId}
              className={`note-tab-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(noteId)}
              title={isEditing ? '' : (note.title || 'Untitled Note')}
            >
              <FileText size={13} className="note-tab-icon" />
              {isEditing ? (
                <input
                  type="text"
                  autoFocus
                  className="note-tab-rename-input"
                  value={editTabTitle}
                  onChange={(e) => setEditTabTitle(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={() => handleSaveRename(noteId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename(noteId);
                    if (e.key === 'Escape') setEditingTabId(null);
                  }}
                />
              ) : (
                <span className="note-tab-title">
                  {note.title || 'Untitled Note'}
                </span>
              )}

              {/* Single-click rename button for active tab */}
              {isActive && !isEditing && onRenameTab && (
                <button
                  type="button"
                  className="note-tab-rename-btn"
                  onClick={(e) => handleStartRename(noteId, note.title, e)}
                  title="Rename Note"
                >
                  <Pencil size={11} />
                </button>
              )}

              <button
                type="button"
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
