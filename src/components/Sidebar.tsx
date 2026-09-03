import React, { useState } from 'react';
import type { Folder as FolderType, Note, ViewFilter, Workspace, Book } from '../types';
import { 
  FileText, 
  Star, 
  Clock, 
  Folder, 
  FolderPlus, 
  Tag, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
  Trash2, 
  Edit2, 
  Paperclip,
  Archive,
  Calendar as CalendarIcon,
  BookOpen
} from 'lucide-react';

import { CalendarWidget } from './CalendarWidget';
import { BookShelf } from './BookShelf';

interface SidebarProps {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  books: Book[];
  folders: FolderType[];
  notes: Note[];
  selectedNoteId: string | null;
  currentFilter: ViewFilter;
  currentFolderId: string | null;
  selectedTag: string | null;
  isOpenMobile: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onSelectWorkspace: (id: string) => void;
  onCreateWorkspace: (name: string, icon: string, color: string, description: string) => void;
  onDeleteWorkspace: (id: string) => void;
  onCreateBook: (title: string, icon: string, color: string) => void;
  onDeleteBook: (bookId: string) => void;
  onAddPageToBook: (bookId: string) => void;
  onSelectNote: (noteId: string) => void;
  onSelectFilter: (filter: ViewFilter) => void;
  onSelectFolder: (folderId: string) => void;
  onSelectTag: (tag: string | null) => void;
  onSelectDate: (dateStr: string) => void;
  onOpenTodayNote: () => void;
  onCreateFolder: (name: string, parentId?: string | null) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onExportData?: () => void;
  onImportData?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCloseMobile: () => void;
  onOpenLibrary?: () => void;
  isLibraryOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  workspaces,
  activeWorkspaceId,
  books,
  folders,
  notes,
  selectedNoteId,
  currentFilter,
  currentFolderId,
  selectedTag,
  isOpenMobile,
  isCollapsed = false,
  onToggleCollapse,
  onCreateBook,
  onDeleteBook,
  onAddPageToBook,
  onSelectNote,
  onSelectFilter,
  onOpenLibrary,
  isLibraryOpen = false,
  onSelectFolder,
  onSelectTag,
  onSelectDate,
  onOpenTodayNote,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onCloseMobile
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'f-work': true
  });
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [addingSubfolderTo, setAddingSubfolderTo] = useState<string | null>(null);
  const [subfolderName, setSubfolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);

  // Counts (Filtered to active/non-trashed unless viewing trash)
  const activeNotes = notes.filter((n) => !n.isTrashed && !n.isArchived);
  const totalNotes = activeNotes.length;
  const favoriteNotes = activeNotes.filter((n) => n.isFavorite).length;
  const withAttachments = activeNotes.filter((n) => n.attachments && n.attachments.length > 0).length;
  const archivedNotesCount = notes.filter((n) => n.isArchived && !n.isTrashed).length;
  const trashedNotesCount = notes.filter((n) => n.isTrashed).length;

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  // Compute notes count per workspace
  const notesCountByWorkspace = new Map<string, number>();
  notes.forEach((n) => {
    if (!n.isTrashed) {
      const wsId = n.workspaceId || 'ws-personal';
      notesCountByWorkspace.set(wsId, (notesCountByWorkspace.get(wsId) || 0) + 1);
    }
  });

  // Extract all unique tags
  const allTags = Array.from(
    new Set(activeNotes.flatMap((n) => n.tags || []))
  ).filter(Boolean);

  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleCreateRootFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim());
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleCreateSubfolder = (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!subfolderName.trim()) return;
    onCreateFolder(subfolderName.trim(), parentId);
    setSubfolderName('');
    setAddingSubfolderTo(null);
    setExpandedFolders((prev) => ({ ...prev, [parentId]: true }));
  };

  const handleRename = (folderId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!editFolderName.trim()) return;
    onRenameFolder(folderId, editFolderName.trim());
    setEditingFolderId(null);
    setEditFolderName('');
  };

  // Render Folders Tree Recursively
  const renderFolderItem = (folder: FolderType, depth = 0) => {
    const isExpanded = expandedFolders[folder.id];
    const isSelected = currentFolderId === folder.id;
    const subfolders = folders.filter((f) => f.parentId === folder.id);
    const hasSubfolders = subfolders.length > 0;
    const folderNoteCount = activeNotes.filter((n) => n.folderId === folder.id).length;

    return (
      <li key={folder.id} className="folder-item-wrap">
        <div 
          className={`folder-item-row ${isSelected ? 'active' : ''}`}
          style={{ paddingLeft: `${10 + depth * 12}px` }}
          onClick={() => {
            onSelectFolder(folder.id);
            onCloseMobile();
          }}
        >
          <div className="folder-item-left">
            <button 
              className="folder-toggle-chevron"
              onClick={(e) => toggleFolder(folder.id, e)}
            >
              {hasSubfolders ? (
                isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
              ) : (
                <span style={{ width: 12, display: 'inline-block' }} />
              )}
            </button>

            <Folder size={14} style={{ color: folder.color || 'var(--text-muted)' }} />

            {editingFolderId === folder.id ? (
              <form onSubmit={(e) => handleRename(folder.id, e)} onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  autoFocus
                  className="folder-input inline-edit"
                  value={editFolderName}
                  onChange={(e) => setEditFolderName(e.target.value)}
                  onBlur={() => setEditingFolderId(null)}
                />
              </form>
            ) : (
              <span className="folder-name-label">{folder.name}</span>
            )}
          </div>

          <div className="folder-actions-hover" onClick={(e) => e.stopPropagation()}>
            <span className="badge-count">{folderNoteCount}</span>
            <button
              className="folder-icon-btn"
              title="Add Subfolder"
              onClick={() => setAddingSubfolderTo(folder.id)}
            >
              <FolderPlus size={11} />
            </button>
            <button
              className="folder-icon-btn"
              title="Rename Folder"
              onClick={() => {
                setEditingFolderId(folder.id);
                setEditFolderName(folder.name);
              }}
            >
              <Edit2 size={11} />
            </button>
            <button
              className="folder-icon-btn danger"
              title="Delete Folder"
              onClick={() => onDeleteFolder(folder.id)}
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        {/* Subfolder inline creation */}
        {addingSubfolderTo === folder.id && (
          <form 
            onSubmit={(e) => handleCreateSubfolder(e, folder.id)}
            style={{ paddingLeft: `${24 + depth * 12}px`, paddingRight: '8px', margin: '4px 0' }}
          >
            <input
              type="text"
              autoFocus
              className="folder-input"
              placeholder="Subfolder name..."
              value={subfolderName}
              onChange={(e) => setSubfolderName(e.target.value)}
              onBlur={() => setAddingSubfolderTo(null)}
            />
          </form>
        )}

        {/* Nested Subfolders List */}
        {hasSubfolders && isExpanded && (
          <ul className="folder-nested-list">
            {subfolders.map((sub) => renderFolderItem(sub, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  const rootFolders = folders.filter((f) => !f.parentId);

  // If collapsed on desktop, render the sleek icon rail
  if (isCollapsed) {
    return (
      <aside className="app-sidebar collapsed">
        <div className="sidebar-collapsed-rail">
          <div 
            className="rail-ws-badge" 
            title={`Workspace: ${activeWorkspace?.name || 'Personal'}`}
          >
            <span>{activeWorkspace?.icon || '🏠'}</span>
          </div>

          <div className="rail-nav-group">
            <button 
              type="button"
              className={`rail-nav-btn ${currentFilter === 'all' && !currentFolderId && !selectedTag ? 'active' : ''}`}
              onClick={() => onSelectFilter('all')}
              title={`All Notes (${totalNotes})`}
            >
              <FileText size={16} />
              <span className="rail-pill-badge">{totalNotes}</span>
            </button>

            <button 
              type="button"
              className={`rail-nav-btn ${currentFilter === 'favorites' ? 'active' : ''}`}
              onClick={() => onSelectFilter('favorites')}
              title={`Favorites (${favoriteNotes})`}
            >
              <Star size={16} color="#f59e0b" />
            </button>

            <button 
              type="button"
              className={`rail-nav-btn ${currentFilter === 'recent' ? 'active' : ''}`}
              onClick={() => onSelectFilter('recent')}
              title="Recent Notes"
            >
              <Clock size={16} color="#0ea5e9" />
            </button>

            <button 
              type="button"
              className={`rail-nav-btn ${currentFilter === 'attachments' ? 'active' : ''}`}
              onClick={() => onSelectFilter('attachments')}
              title={`Files & Media (${withAttachments})`}
            >
              <Paperclip size={16} color="#10b981" />
            </button>

            {onOpenLibrary && (
              <button
                type="button"
                className={`rail-nav-btn ${isLibraryOpen ? 'active' : ''}`}
                onClick={onOpenLibrary}
                title={`Open Library & File Manager (${books.length} Books, ${folders.length} Folders)`}
              >
                <BookOpen size={16} color="var(--accent-primary)" />
              </button>
            )}

            <button
              type="button"
              className="rail-nav-btn"
              onClick={onToggleCollapse}
              title={`Folders (${folders.length}) - Click to expand`}
            >
              <Folder size={16} color="var(--text-secondary)" />
            </button>
          </div>

          <div className="rail-bottom-group">
            <button 
              type="button"
              className={`rail-nav-btn ${currentFilter === 'archive' ? 'active' : ''}`}
              onClick={() => onSelectFilter('archive')}
              title={`Archived Notes (${archivedNotesCount})`}
            >
              <Archive size={16} color="#8b5cf6" />
              {archivedNotesCount > 0 && <span className="rail-pill-badge">{archivedNotesCount}</span>}
            </button>

            <button 
              type="button"
              className={`rail-nav-btn danger ${currentFilter === 'trash' ? 'active' : ''}`}
              onClick={() => onSelectFilter('trash')}
              title={`Trash Bin (${trashedNotesCount})`}
            >
              <Trash2 size={16} color="#ef4444" />
              {trashedNotesCount > 0 && <span className="rail-pill-badge danger">{trashedNotesCount}</span>}
            </button>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <>
      {isOpenMobile && (
        <div className="sidebar-backdrop mobile-only" onClick={onCloseMobile} />
      )}

      <aside className={`app-sidebar ${isOpenMobile ? 'open' : ''}`}>
        <div className="sidebar-scroll">

          {/* Section: Quick Views */}
          <div>
            <div className="sidebar-section-title">Navigation</div>
            <ul className="sidebar-nav-list">
              <li 
                className={`sidebar-nav-item ${currentFilter === 'all' && !currentFolderId && !selectedTag ? 'active' : ''}`}
                onClick={() => {
                  onSelectFilter('all');
                  onCloseMobile();
                }}
              >
                <div className="nav-item-left">
                  <FileText size={15} />
                  <span>All Notes</span>
                </div>
                <span className="badge-count">{totalNotes}</span>
              </li>

              <li 
                className={`sidebar-nav-item ${currentFilter === 'favorites' ? 'active' : ''}`}
                onClick={() => {
                  onSelectFilter('favorites');
                  onCloseMobile();
                }}
              >
                <div className="nav-item-left">
                  <Star size={15} style={{ color: '#f59e0b' }} />
                  <span>Favorites</span>
                </div>
                <span className="badge-count">{favoriteNotes}</span>
              </li>

              <li 
                className={`sidebar-nav-item ${currentFilter === 'recent' ? 'active' : ''}`}
                onClick={() => {
                  onSelectFilter('recent');
                  onCloseMobile();
                }}
              >
                <div className="nav-item-left">
                  <Clock size={15} style={{ color: '#0ea5e9' }} />
                  <span>Recent Notes</span>
                </div>
              </li>

              <li 
                className={`sidebar-nav-item ${currentFilter === 'attachments' ? 'active' : ''}`}
                onClick={() => {
                  onSelectFilter('attachments');
                  onCloseMobile();
                }}
              >
                <div className="nav-item-left">
                  <Paperclip size={15} style={{ color: '#10b981' }} />
                  <span>With Files & Media</span>
                </div>
                <span className="badge-count">{withAttachments}</span>
              </li>

              {onOpenLibrary && (
                <li 
                  className={`sidebar-nav-item ${isLibraryOpen ? 'active' : ''}`}
                  onClick={() => {
                    onOpenLibrary();
                    onCloseMobile();
                  }}
                  style={{ marginTop: '4px', background: 'rgba(79, 70, 229, 0.08)', border: '1px solid rgba(79, 70, 229, 0.18)' }}
                >
                  <div className="nav-item-left">
                    <BookOpen size={15} color="var(--accent-primary)" />
                    <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>Library & Files</span>
                  </div>
                  <span className="badge-count" style={{ background: 'rgba(79, 70, 229, 0.2)', color: 'var(--accent-primary)' }}>
                    {books.length}b · {folders.length}f
                  </span>
                </li>
              )}
            </ul>
          </div>

          {/* Section: Books & Notebooks */}
          <BookShelf
            books={books}
            notes={notes}
            selectedNoteId={selectedNoteId}
            onSelectNote={onSelectNote}
            onCreateBook={onCreateBook}
            onDeleteBook={onDeleteBook}
            onAddPageToBook={onAddPageToBook}
          />

          {/* Section: Folders Hierarchy */}
          <div>
            <div className="sidebar-section-title">
              <span>Folders</span>
              <button 
                className="folder-action-btn"
                title="Create New Folder"
                onClick={() => setIsCreatingFolder(true)}
              >
                <FolderPlus size={13} />
              </button>
            </div>

            {isCreatingFolder && (
              <form onSubmit={handleCreateRootFolder} style={{ padding: '4px 8px' }}>
                <input
                  type="text"
                  autoFocus
                  className="folder-input"
                  placeholder="New folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onBlur={() => !newFolderName && setIsCreatingFolder(false)}
                />
              </form>
            )}

            <ul className="folder-tree-root">
              {rootFolders.map((folder) => renderFolderItem(folder))}
            </ul>
          </div>

          {/* Section: Tags */}
          {allTags.length > 0 && (
            <div>
              <div className="sidebar-section-title">Tags</div>
              <div className="sidebar-tags-cloud">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    className={`sidebar-tag-pill ${selectedTag === tag ? 'active' : ''}`}
                    onClick={() => {
                      onSelectTag(selectedTag === tag ? null : tag);
                      onCloseMobile();
                    }}
                  >
                    <Tag size={10} />
                    <span>#{tag}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section: Calendar & Daily Notes (Pinned directly above Bin & Archive footer) */}
        <div className="sidebar-calendar-accordion pinned-above-bins">
          <div 
            className="cal-accordion-header"
            onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
            title="Click to expand or collapse Calendar"
          >
            <div className="cal-header-left">
              <CalendarIcon size={14} color="var(--accent-primary)" />
              <span>Calendar & Daily Log</span>
            </div>
            <button 
              type="button" 
              className="btn-cal-chevron"
              aria-label={isCalendarExpanded ? 'Collapse Calendar' : 'Expand Calendar'}
            >
              {isCalendarExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>

          {isCalendarExpanded && (
            <div className="cal-accordion-body">
              <CalendarWidget
                notes={notes}
                onSelectDate={onSelectDate}
                onOpenTodayNote={onOpenTodayNote}
              />
            </div>
          )}
        </div>

        {/* Sidebar Footer: Archive & Bin Buttons (Restore & Vault Removed) */}
        <div className="sidebar-footer-bins">
          <button 
            className={`sidebar-bin-pill ${currentFilter === 'archive' ? 'active' : ''}`}
            onClick={() => {
              onSelectFilter('archive');
              onCloseMobile();
            }}
            title="View Archived Notes"
          >
            <Archive size={14} color="#8b5cf6" />
            <span className="bin-label">Archive</span>
            {archivedNotesCount > 0 && (
              <span className="bin-count-chip">{archivedNotesCount}</span>
            )}
          </button>

          <button 
            className={`sidebar-bin-pill danger ${currentFilter === 'trash' ? 'active' : ''}`}
            onClick={() => {
              onSelectFilter('trash');
              onCloseMobile();
            }}
            title="View Trash Bin"
          >
            <Trash2 size={14} color="#ef4444" />
            <span className="bin-label">Bin</span>
            {trashedNotesCount > 0 && (
              <span className="bin-count-chip danger">{trashedNotesCount}</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
