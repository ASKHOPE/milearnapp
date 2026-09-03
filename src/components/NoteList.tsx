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
  Lock,
  Archive,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal
} from 'lucide-react';

interface NoteListProps {
  notes: Note[];
  folders: FolderType[];
  selectedNoteId: string | null;
  currentFilter: ViewFilter;
  currentFolderId: string | null;
  selectedTag: string | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
  onToggleFavorite: (noteId: string, e: React.MouseEvent) => void;
  onEmptyTrash: () => void;
  onRestoreNote: (noteId: string, e: React.MouseEvent) => void;
  onArchiveNote?: (noteId: string, e: React.MouseEvent) => void;
  onDeleteNote?: (noteId: string, e: React.MouseEvent) => void;
  onPermanentDeleteNote?: (noteId: string, e: React.MouseEvent) => void;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  folders,
  selectedNoteId,
  currentFilter,
  currentFolderId,
  selectedTag,
  isCollapsed = false,
  onToggleCollapse,
  onSelectNote,
  onCreateNote,
  onToggleFavorite,
  onEmptyTrash,
  onRestoreNote,
  onArchiveNote,
  onDeleteNote,
  onPermanentDeleteNote
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
    if (currentFilter === 'attachments') {
      if (!note.attachments || note.attachments.length === 0) return false;
    }

    // List search query
    if (listSearch.trim()) {
      const q = listSearch.toLowerCase();
      const matchTitle = note.title.toLowerCase().includes(q);
      const matchContent = note.content.toLowerCase().includes(q);
      const matchTag = note.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchContent && !matchTag) return false;
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

  // Collapsed Panel Strip
  if (isCollapsed) {
    return (
      <section className="notes-list-pane collapsed">
        <button
          className="btn-expand-notes-pane"
          onClick={onToggleCollapse}
          title="Expand notes list"
        >
          <ChevronRight size={15} />
          <span className="collapsed-notes-count">{filteredNotes.length}</span>
        </button>
      </section>
    );
  }

  return (
    <section className="notes-list-pane">
      {/* Sleek Modern List Header */}
      <div className="notelist-sleek-header">
        <div className="notelist-header-top">
          <div className="notelist-heading-group">
            {onToggleCollapse && (
              <button
                className="btn-collapse-notes-pane"
                onClick={onToggleCollapse}
                title="Collapse notes panel"
              >
                <ChevronLeft size={14} />
              </button>
            )}
            <h3 className="notelist-heading-title">{columnTitle}</h3>
            <span className="notelist-count-chip">{filteredNotes.length}</span>
          </div>

          <div className="notelist-actions-group">
            {currentFilter === 'trash' && filteredNotes.length > 0 && (
              <button
                className="btn-trash-empty"
                onClick={onEmptyTrash}
                title="Permanently empty trash"
              >
                <Trash2 size={12} />
                <span>Empty</span>
              </button>
            )}

            {currentFilter !== 'trash' && currentFilter !== 'archive' && (
              <button
                className="btn-create-note-compact"
                onClick={onCreateNote}
                title="Create New Note (Cmd+N)"
              >
                <Plus size={14} />
                <span>New Note</span>
              </button>
            )}
          </div>
        </div>

        {/* Compact Integrated Search & Sort Toolbar */}
        <div className="notelist-toolbar-row">
          <div className="notelist-search-wrapper">
            <Search size={13} className="search-icon" />
            <input
              type="text"
              placeholder="Search notes in list..."
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              className="notelist-search-input"
            />
            {listSearch && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setListSearch('')}
                title="Clear filter"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="notelist-sort-wrapper">
            <SlidersHorizontal size={12} className="sort-icon" />
            <select
              className="notelist-sort-dropdown"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              title="Sort notes"
            >
              <option value="updated">Recent</option>
              <option value="created">Created</option>
              <option value="title">A–Z</option>
            </select>
          </div>
        </div>
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
                className={`note-card compact-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectNote(note.id)}
              >
                {/* Heading: Title & Pin/Favorite */}
                <div className="card-top-row">
                  <div className="card-heading-wrap">
                    {note.isPinned && <Pin size={11} className="card-pin-icon" />}
                    {note.isLocked && (
                      <span title="Encrypted with AES-256-GCM" style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <Lock size={11} color="var(--color-warning)" />
                      </span>
                    )}
                    <span className="card-heading">{note.title || 'Untitled Note'}</span>
                  </div>

                  <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                    {note.isTrashed ? (
                      <>
                        <button
                          className="card-icon-btn restore"
                          title="Restore Note"
                          onClick={(e) => onRestoreNote(note.id, e)}
                        >
                          <RotateCcw size={12} color="var(--color-success)" />
                        </button>
                        {onPermanentDeleteNote && (
                          <button
                            className="card-icon-btn danger"
                            title="Permanently Delete Note"
                            onClick={(e) => onPermanentDeleteNote(note.id, e)}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {onArchiveNote && (
                          <button
                            className={`card-icon-btn archive ${note.isArchived ? 'active' : ''}`}
                            onClick={(e) => onArchiveNote(note.id, e)}
                            title={note.isArchived ? 'Unarchive Note' : 'Archive Note'}
                          >
                            <Archive size={12} color={note.isArchived ? '#8b5cf6' : undefined} />
                          </button>
                        )}

                        <button
                          className="card-icon-btn star"
                          onClick={(e) => onToggleFavorite(note.id, e)}
                          title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Star 
                            size={12} 
                            fill={note.isFavorite ? '#f59e0b' : 'none'} 
                            color={note.isFavorite ? '#f59e0b' : 'var(--text-muted)'} 
                          />
                        </button>

                        {onDeleteNote && (
                          <button
                            className="card-icon-btn trash danger"
                            onClick={(e) => onDeleteNote(note.id, e)}
                            title="Move to Trash Bin"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Subheading: Time • Folder • Media Icons */}
                <div className="card-subheading">
                  <span className="card-time">{formatTime(note.updatedAt)}</span>
                  {folder && (
                    <>
                      <span className="card-meta-dot">•</span>
                      <span className="card-folder-chip" style={{ color: folder.color }}>
                        <FolderIcon size={10} />
                        <span>{folder.name}</span>
                      </span>
                    </>
                  )}
                  {(hasImages || hasAudio || hasFiles) && (
                    <>
                      <span className="card-meta-dot">•</span>
                      <div className="card-media-chips">
                        {hasImages && <span title="Has images"><ImageIcon size={10} /></span>}
                        {hasAudio && <span title="Has audio" style={{ color: '#ef4444' }}><Music size={10} /></span>}
                        {hasFiles && <span title="Has files"><FileIcon size={10} /></span>}
                      </div>
                    </>
                  )}
                </div>

                {/* Hover Details: Reveals 2 lines of text and tags on hover */}
                <div className="card-hover-details">
                  <p className="card-snippet-2lines">
                    {note.isLocked ? '🔒 Encrypted (AES-256-GCM authenticated)' : snippet || 'Empty note...'}
                  </p>
                  {note.tags && note.tags.length > 0 && (
                    <div className="card-hover-tags">
                      {note.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="card-badge tag">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
