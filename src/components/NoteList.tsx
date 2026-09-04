import React, { useState, useMemo } from 'react';
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
  SlidersHorizontal,
  Columns2
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
  onSelectNoteSplit?: (noteId: string) => void;
  onCreateNote?: () => void;
  onToggleFavorite: (noteId: string, e: React.MouseEvent) => void;
  onEmptyTrash: () => void;
  onRestoreNote: (noteId: string, e: React.MouseEvent) => void;
  onArchiveNote?: (noteId: string, e: React.MouseEvent) => void;
  onDeleteNote?: (noteId: string, e: React.MouseEvent) => void;
  onPermanentDeleteNote?: (noteId: string, e: React.MouseEvent) => void;
}

// Helper: Relative time format
const formatTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const diffHours = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
  onSelectNoteSplit,
  onCreateNote,
  onToggleFavorite,
  onEmptyTrash,
  onRestoreNote,
  onArchiveNote,
  onDeleteNote,
  onPermanentDeleteNote
}) => {
  const [query, setQuery] = useState('');
  const [sortOption, setSortOption] = useState<'updated' | 'created' | 'title'>('updated');

  // Derive title from active view
  let columnTitle = 'Notes';
  if (currentFolderId) {
    const currentFolder = folders.find((f) => f.id === currentFolderId);
    columnTitle = currentFolder ? currentFolder.name : 'Folder';
  } else if (selectedTag) {
    columnTitle = `#${selectedTag}`;
  } else if (currentFilter === 'favorites') {
    columnTitle = 'Favorites';
  } else if (currentFilter === 'recent') {
    columnTitle = 'Recent Notes';
  } else if (currentFilter === 'quick') {
    columnTitle = 'Quick Notes';
  } else if (currentFilter === 'attachments') {
    columnTitle = 'Files & Media';
  } else if (currentFilter === 'archive') {
    columnTitle = 'Archive';
  } else if (currentFilter === 'trash') {
    columnTitle = 'Trash Bin';
  }

  // Filter notes based on active filter, folder, tag, and search query
  const filteredNotes = useMemo(() => {
    let list: Note[] = [];

    // 1. Trash Bin Mode: ONLY show trashed notes
    if (currentFilter === 'trash') {
      list = notes.filter((n) => n.isTrashed);
    } else {
      // All other modes: EXCLUDE trashed notes
      list = notes.filter((n) => !n.isTrashed);

      if (currentFilter === 'archive') {
        list = list.filter((n) => n.isArchived);
      } else {
        // Exclude archived from normal views
        list = list.filter((n) => !n.isArchived);

        if (currentFilter === 'favorites') {
          list = list.filter((n) => n.isFavorite);
        } else if (currentFilter === 'quick') {
          list = list.filter((n) => !n.folderId);
        } else if (currentFilter === 'attachments') {
          list = list.filter((n) => n.attachments && n.attachments.length > 0);
        } else if (currentFolderId) {
          list = list.filter((n) => n.folderId === currentFolderId);
        } else if (selectedTag) {
          list = list.filter((n) => n.tags && n.tags.includes(selectedTag));
        }
      }
    }

    // Apply text search query
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((n) =>
        (n.title || '').toLowerCase().includes(q) ||
        (n.content || '').toLowerCase().includes(q) ||
        (n.tags && n.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // Sorting
    return [...list].sort((a, b) => {
      if (sortOption === 'updated') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else if (sortOption === 'created') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortOption === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });
  }, [notes, currentFilter, currentFolderId, selectedTag, query, sortOption]);

  return (
    <section className={`notes-list-pane ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Middle Edge Floating Toggle Button */}
      {onToggleCollapse && (
        <button
          type="button"
          className="edge-middle-toggle-btn"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          title={isCollapsed ? "Expand Notes List" : "Collapse Notes List"}
          aria-label={isCollapsed ? "Expand Notes List" : "Collapse Notes List"}
        >
          {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      )}

      {isCollapsed ? (
        <div 
          className="notes-list-collapsed-strip" 
          onClick={onToggleCollapse} 
          title="Click anywhere to expand Notes List"
        >
          {onCreateNote && currentFilter !== 'trash' && currentFilter !== 'archive' && (
            <button
              type="button"
              className="collapsed-quick-add-btn"
              onClick={(e) => {
                e.stopPropagation();
                onCreateNote();
              }}
              title="Create New Note (Cmd+N)"
            >
              <Plus size={14} />
            </button>
          )}

          <div className="collapsed-notes-badge">
            <span>{columnTitle}</span>
            <span className="collapsed-count-pill">{filteredNotes.length}</span>
          </div>
        </div>
      ) : (
        <>
          {/* Sleek Modern List Header */}
          <div className="notelist-sleek-header">
            <div className="notelist-header-title-wrap">
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="notelist-search-input"
              />
              {query && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setQuery('')}
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
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                title="Sort notes"
              >
                <option value="updated">Recent</option>
                <option value="created">Created</option>
                <option value="title">A–Z</option>
              </select>
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
                : query 
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
                {/* Heading: Title & Top-Right Actions */}
                <div className="card-top-row">
                  <div className="card-heading-wrap">
                    {note.isPinned && <Pin size={12} className="card-pin-icon" />}
                    {note.isLocked && (
                      <span title="Encrypted with AES-256-GCM" style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <Lock size={12} color="var(--color-warning)" />
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
                          <RotateCcw size={14} color="var(--color-success)" />
                        </button>
                        {onPermanentDeleteNote && (
                          <button
                            className="card-icon-btn danger"
                            title="Permanently Delete Note"
                            onClick={(e) => onPermanentDeleteNote(note.id, e)}
                          >
                            <Trash2 size={14} />
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
                            <Archive size={14} color={note.isArchived ? '#8b5cf6' : undefined} />
                          </button>
                        )}

                        <button
                          className="card-icon-btn star"
                          onClick={(e) => onToggleFavorite(note.id, e)}
                          title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Star 
                            size={14} 
                            fill={note.isFavorite ? '#f59e0b' : 'none'} 
                            color={note.isFavorite ? '#f59e0b' : 'var(--text-muted)'} 
                          />
                        </button>

                        {onSelectNoteSplit && (
                          <button
                            type="button"
                            className="card-icon-btn split"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectNoteSplit(note.id);
                            }}
                            title="Open Side-by-Side (Split View)"
                          >
                            <Columns2 size={14} />
                          </button>
                        )}

                        {onDeleteNote && (
                          <button
                            type="button"
                            className="card-icon-btn trash danger"
                            onClick={(e) => onDeleteNote(note.id, e)}
                            title="Move to Trash Bin"
                          >
                            <Trash2 size={14} />
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
        </>
      )}
    </section>
  );
};
