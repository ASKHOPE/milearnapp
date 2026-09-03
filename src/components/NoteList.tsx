import React, { useState } from 'react';
import type { 
  Note, 
  Folder as FolderType, 
  ViewFilter 
} from '../types';
import { 
  Plus, 
  Search, 
  Star, 
  Pin, 
  Image as ImageIcon, 
  FileText as FileIcon, 
  Folder as FolderIcon,
  Music,
  Trash2,
  RotateCcw,
  Lock
} from 'lucide-react';

interface NoteListProps {
  notes: Note[];
  folders: FolderType[];
  selectedNoteId: string | null;
  currentFilter: ViewFilter;
  currentFolderId: string | null;
  selectedTag: string | null;
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
  onToggleFavorite: (noteId: string, e: React.MouseEvent) => void;
  onEmptyTrash: () => void;
  onRestoreNote: (noteId: string, e: React.MouseEvent) => void;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  folders,
  selectedNoteId,
  currentFilter,
  currentFolderId,
  selectedTag,
  onSelectNote,
  onCreateNote,
  onToggleFavorite,
  onEmptyTrash,
  onRestoreNote
}) => {
  const [listSearch, setListSearch] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');

  // Find active folder name
  const activeFolder = folders.find((f) => f.id === currentFolderId);

  // Determine Title for the list column
  let columnTitle = 'All Notes';
  if (selectedTag) {
    columnTitle = `#${selectedTag}`;
  } else if (currentFolderId && activeFolder) {
    columnTitle = activeFolder.name;
  } else if (currentFilter === 'favorites') {
    columnTitle = 'Favorites';
  } else if (currentFilter === 'recent') {
    columnTitle = 'Recent Notes';
  } else if (currentFilter === 'attachments') {
    columnTitle = 'With Files & Media';
  } else if (currentFilter === 'archive') {
    columnTitle = 'Archived Notes';
  } else if (currentFilter === 'trash') {
    columnTitle = 'Trash Bin';
  }

  // Filter notes based on lifecycle and current filter
  let filteredNotes = notes.filter((note) => {
    // 1. Trash Bin Mode: ONLY show trashed notes
    if (currentFilter === 'trash') {
      if (!note.isTrashed) return false;
    } else {
      // All other modes: EXCLUDE trashed notes
      if (note.isTrashed) return false;

      // 2. Archive Mode: ONLY show archived notes
      if (currentFilter === 'archive') {
        if (!note.isArchived) return false;
      } else {
        // Normal views: EXCLUDE archived notes
        if (note.isArchived) return false;
      }
    }

    // Tag filter
    if (selectedTag && (!note.tags || !note.tags.includes(selectedTag))) {
      return false;
    }

    // Folder filter
    if (currentFolderId && note.folderId !== currentFolderId) {
      return false;
    }

    // Navigation filters
    if (currentFilter === 'favorites' && !note.isFavorite) {
      return false;
    }
    if (currentFilter === 'attachments' && (!note.attachments || note.attachments.length === 0)) {
      return false;
    }

    // List search query
    if (listSearch.trim()) {
      const q = listSearch.toLowerCase();
      const matchTitle = note.title.toLowerCase().includes(q);
      const matchContent = note.content.toLowerCase().includes(q);
      const matchTags = note.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchContent && !matchTags) return false;
    }

    return true;
  });

  // Sort notes: pinned first, then by selected sort
  filteredNotes.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    if (sortBy === 'updated') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    if (sortBy === 'created') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  // Helper: Format relative date
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Helper: Clean content preview
  const getCleanSnippet = (content: string) => {
    return content
      .replace(/^#+\s+/gm, '') // Remove markdown headers
      .replace(/\[\[(.*?)\]\]/g, '$1') // Remove wiki link brackets
      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
      .replace(/`{1,3}.*?`{1,3}/gs, '') // Remove code blocks
      .replace(/-\s\[[ x]\]\s/g, '') // Remove checklist marks
      .replace(/\n+/g, ' ')
      .trim();
  };

  return (
    <section className="notes-list-pane">
      {/* List Header */}
      <div className="list-header-row">
        <div className="list-title-group">
          <span className="list-column-title">{columnTitle}</span>
          <span className="list-count-badge">{filteredNotes.length}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Empty Trash Button in Trash View */}
          {currentFilter === 'trash' && filteredNotes.length > 0 && (
            <button
              className="btn-small-ghost danger"
              onClick={onEmptyTrash}
              title="Permanently delete all items in trash"
            >
              <Trash2 size={12} />
              <span>Empty</span>
            </button>
          )}

          {/* New Note Button (only in normal views) */}
          {currentFilter !== 'trash' && currentFilter !== 'archive' && (
            <button
              className="btn-new-note"
              onClick={onCreateNote}
              title="Create New Note (Cmd+N)"
            >
              <Plus size={14} />
              <span>Note</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Sort Row */}
      <div className="list-search-sort-row">
        <div className="list-search-box">
          <Search size={14} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Filter list..."
            value={listSearch}
            onChange={(e) => setListSearch(e.target.value)}
          />
        </div>

        <select
          className="list-sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          title="Sort Notes By"
        >
          <option value="updated">Updated</option>
          <option value="created">Created</option>
          <option value="title">Title</option>
        </select>
      </div>

      {/* Notes List Cards */}
      <div className="notes-cards-scroll">
        {filteredNotes.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {currentFilter === 'trash' 
                ? 'Trash bin is empty' 
                : currentFilter === 'archive' 
                ? 'No archived notes' 
                : listSearch 
                ? 'No notes match your filter' 
                : 'No notes yet'}
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const folder = folders.find((f) => f.id === note.folderId);
            const isSelected = note.id === selectedNoteId;
            const snippet = getCleanSnippet(note.content);
            const hasImages = note.attachments?.some((a) => a.type === 'image');
            const hasAudio = note.attachments?.some((a) => a.type === 'audio');
            const hasFiles = note.attachments?.some((a) => a.type === 'document' || a.type === 'pdf');

            return (
              <div
                key={note.id}
                className={`note-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectNote(note.id)}
              >
                {/* Note Card Header: Title & Pin/Favorite/Restore */}
                <div className="card-top-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                    {note.isPinned && <Pin size={12} className="card-pin-icon" />}
                    {note.isLocked && (
                      <span title="Encrypted with AES-256-GCM" style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <Lock size={12} color="var(--color-warning)" />
                      </span>
                    )}
                    <span className="card-title">{note.title || 'Untitled Note'}</span>
                  </div>

                  <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                    {/* Restore Button in Trash */}
                    {note.isTrashed ? (
                      <button
                        className="card-icon-btn"
                        title="Restore Note"
                        onClick={(e) => onRestoreNote(note.id, e)}
                      >
                        <RotateCcw size={13} color="var(--color-success)" />
                      </button>
                    ) : (
                      <button
                        className="card-icon-btn"
                        onClick={(e) => onToggleFavorite(note.id, e)}
                        title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star 
                          size={13} 
                          fill={note.isFavorite ? '#f59e0b' : 'none'} 
                          color={note.isFavorite ? '#f59e0b' : 'var(--text-muted)'} 
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content Snippet */}
                <p className="card-snippet">
                  {note.isLocked ? '🔒 Encrypted (AES-256-GCM authenticated)' : snippet || 'Empty note...'}
                </p>

                {/* Footer Metadata */}
                <div className="card-meta-row">
                  <span className="card-time">{formatTime(note.updatedAt)}</span>

                  <div className="card-badges">
                    {/* Folder Badge */}
                    {folder && (
                      <span className="card-badge folder" style={{ color: folder.color }}>
                        <FolderIcon size={9} />
                        <span>{folder.name}</span>
                      </span>
                    )}

                    {/* Media Indicators */}
                    {hasImages && <span title="Has images"><ImageIcon size={11} className="card-media-icon" /></span>}
                    {hasAudio && <span title="Has voice recording"><Music size={11} className="card-media-icon" style={{ color: '#ef4444' }} /></span>}
                    {hasFiles && <span title="Has documents/PDFs"><FileIcon size={11} className="card-media-icon" /></span>}

                    {/* Tag Pills */}
                    {note.tags && note.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="card-badge tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
