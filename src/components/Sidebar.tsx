import React, { useState, useEffect, useMemo } from 'react';
import type { Folder as FolderType, Note, ViewFilter, Workspace, Book, ThemeMode } from '../types';
import { 
  FileText, 
  Star, 
  Clock, 
  Folder, 
  Tag, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
  Trash2, 
  Paperclip,
  Archive,
  Calendar as CalendarIcon,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Zap,
  Pin,
  SlidersHorizontal,
  Plus,
  Sun,
  Moon,
  Monitor,
  Sparkles,
  Columns2,
  RotateCcw,
  Lock,
  Image as ImageIcon,
  Music,
  Menu,
  X,
  Search,
  Settings,
  HelpCircle
} from 'lucide-react';

import { CalendarWidget } from './CalendarWidget';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { TagSelectorPopover } from './TagSelectorPopover';
import { FolderSelectorModal } from './FolderSelectorModal';
import { BookSelectorModal } from './BookSelectorModal';

interface SidebarProps {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  notesCountByWorkspace?: Map<string, number>;
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
  onRenameWorkspace?: (id: string, newName: string, newIcon?: string, newColor?: string) => void;
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
  onCloseMobile: () => void;
  onOpenLibrary?: () => void;
  isLibraryOpen?: boolean;
  showCalendar?: boolean;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  onChangeTheme?: (mode: ThemeMode) => void;
  onOpenSettings?: (tab?: string) => void;
  // Note List Integration props
  onSelectNoteSplit?: (noteId: string) => void;
  onCreateNote?: () => void;
  onToggleFavorite?: (noteId: string, e: React.MouseEvent) => void;
  onEmptyTrash?: () => void;
  onRestoreNote?: (noteId: string, e: React.MouseEvent) => void;
  onArchiveNote?: (noteId: string, e: React.MouseEvent) => void;
  onDeleteNote?: (noteId: string, e: React.MouseEvent) => void;
  onPermanentDeleteNote?: (noteId: string, e?: React.MouseEvent) => void;
  onMoveNote?: (noteId: string, targetFolderId: string | null, targetBookId: string | null) => void;
}

// Relative time formatting helper
const formatRelativeTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const diffMs = Date.now() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

// Clean snippet preview helper
const getSnippet = (content: string) => {
  return content
    .replace(/^#+\s+/gm, '')
    .replace(/\[\[(.*?)\]\]/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/`{1,3}.*?`{1,3}/gs, '')
    .replace(/-\s\[[ x]\]\s/g, '')
    .replace(/\n+/g, ' ')
    .trim();
};

export const Sidebar: React.FC<SidebarProps> = ({
  workspaces,
  activeWorkspaceId,
  notesCountByWorkspace: propNotesCount,
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
  showCalendar = false,
  onSelectWorkspace,
  onCreateWorkspace,
  onRenameWorkspace,
  onDeleteWorkspace,
  onCreateBook,
  onDeleteBook,
  onAddPageToBook,
  onSelectNote,
  onSelectFilter,
  onSelectFolder,
  onSelectTag,
  onSelectDate,
  onOpenTodayNote,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onCloseMobile,
  onOpenLibrary,
  theme = 'dark',
  onChangeTheme,
  onOpenSettings,
  onSelectNoteSplit,
  onCreateNote,
  onToggleFavorite,
  onEmptyTrash,
  onRestoreNote,
  onArchiveNote,
  onDeleteNote,
  onPermanentDeleteNote,
  onMoveNote
}) => {
  // Consolidated View Mode: 'M' = Menu/Directory, 'N' = Notes Feed
  const [viewMode, setViewMode] = useState<'M' | 'N'>(() => {
    try {
      const saved = localStorage.getItem('milearnapp_sidebar_view_mode');
      return saved === 'M' || saved === 'N' ? saved : 'M';
    } catch {
      return 'M';
    }
  });

  const handleSetViewMode = (mode: 'M' | 'N') => {
    setViewMode(mode);
    try {
      localStorage.setItem('milearnapp_sidebar_view_mode', mode);
    } catch {}
  };

  // Keyboard Shortcuts: M for Menu, N for Notes (when not typing in an input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      ) {
        return;
      }
      if (e.key === 'm' || e.key === 'M') {
        handleSetViewMode('M');
      } else if (e.key === 'n' || e.key === 'N') {
        handleSetViewMode('N');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Section Accordion States in Mode M
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [expandedBookIds, setExpandedBookIds] = useState<Set<string>>(new Set());
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(true);
  const [isBooksExpanded, setIsBooksExpanded] = useState(true);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [isNavSectionCollapsed, setIsNavSectionCollapsed] = useState(false);

  // Modal / Popover States
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [noteToMoveId, setNoteToMoveId] = useState<string | null>(null);

  // Notes Feed Filter & Search in Mode N
  const [notesSearchQuery, setNotesSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'updated' | 'created' | 'title'>('updated');

  // Pinned Folders & Books persisted in localStorage
  const [pinnedFolderIds, setPinnedFolderIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('milearnapp_pinned_folders');
      if (saved) return JSON.parse(saved);
      return folders.slice(0, 4).map((f) => f.id);
    } catch {
      return [];
    }
  });

  const [pinnedBookIds, setPinnedBookIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('milearnapp_pinned_books');
      if (saved) return JSON.parse(saved);
      return books.slice(0, 3).map((b) => b.id);
    } catch {
      return [];
    }
  });

  const togglePinFolder = (folderId: string) => {
    setPinnedFolderIds((prev) => {
      const next = prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId];
      localStorage.setItem('milearnapp_pinned_folders', JSON.stringify(next));
      return next;
    });
  };

  const togglePinBook = (bookId: string) => {
    setPinnedBookIds((prev) => {
      const next = prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId];
      localStorage.setItem('milearnapp_pinned_books', JSON.stringify(next));
      return next;
    });
  };

  // Note Counts
  const activeNotes = useMemo(() => notes.filter((n) => !n.isTrashed && !n.isArchived), [notes]);
  const quickNotesCount = useMemo(() => activeNotes.filter(
    (n) => n.tags?.includes('quick-note') || n.title.includes('Quick Scratchpad')
  ).length, [activeNotes]);
  const favoriteNotesCount = useMemo(() => activeNotes.filter((n) => n.isFavorite).length, [activeNotes]);
  const withAttachmentsCount = useMemo(() => activeNotes.filter((n) => n.attachments && n.attachments.length > 0).length, [activeNotes]);
  const archivedNotesCount = useMemo(() => notes.filter((n) => n.isArchived && !n.isTrashed).length, [notes]);
  const trashedNotesCount = useMemo(() => notes.filter((n) => n.isTrashed).length, [notes]);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const notesCountByWorkspace = propNotesCount || useMemo(() => {
    const map = new Map<string, number>();
    notes.forEach((n) => {
      if (!n.isTrashed) {
        const wsId = n.workspaceId || 'ws-personal';
        map.set(wsId, (map.get(wsId) || 0) + 1);
      }
    });
    return map;
  }, [notes, propNotesCount]);

  const allTags = useMemo(() => Array.from(
    new Set(activeNotes.flatMap((n) => n.tags || []))
  ).filter(Boolean), [activeNotes]);

  // Derive title for Notes Feed header
  const notesFeedTitle = useMemo(() => {
    if (currentFolderId) {
      const currentFolder = folders.find((f) => f.id === currentFolderId);
      return currentFolder ? currentFolder.name : 'Folder Notes';
    }
    if (selectedTag) return `#${selectedTag}`;
    if (currentFilter === 'favorites') return 'Favorites';
    if (currentFilter === 'recent') return 'Recent Notes';
    if (currentFilter === 'quick') return 'Quick Notes';
    if (currentFilter === 'attachments') return 'With Media';
    if (currentFilter === 'archive') return 'Archive';
    if (currentFilter === 'trash') return 'Trash Bin';
    return 'All Notes';
  }, [currentFolderId, selectedTag, currentFilter, folders]);

  // Filtered Notes for Mode N
  const filteredNotes = useMemo(() => {
    let list: Note[] = [];

    if (currentFilter === 'trash') {
      list = notes.filter((n) => n.isTrashed);
    } else {
      list = notes.filter((n) => !n.isTrashed);

      if (currentFilter === 'archive') {
        list = list.filter((n) => n.isArchived);
      } else {
        list = list.filter((n) => !n.isArchived);

        if (currentFilter === 'favorites') {
          list = list.filter((n) => n.isFavorite);
        } else if (currentFilter === 'quick') {
          list = list.filter((n) => n.tags?.includes('quick-note') || n.title.includes('Quick Scratchpad'));
        } else if (currentFilter === 'attachments') {
          list = list.filter((n) => n.attachments && n.attachments.length > 0);
        } else if (currentFolderId) {
          list = list.filter((n) => n.folderId === currentFolderId);
        } else if (selectedTag) {
          list = list.filter((n) => n.tags && n.tags.includes(selectedTag));
        }
      }
    }

    if (notesSearchQuery.trim()) {
      const q = notesSearchQuery.trim().toLowerCase();
      list = list.filter((n) =>
        (n.title || '').toLowerCase().includes(q) ||
        (n.content || '').toLowerCase().includes(q) ||
        (n.tags && n.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

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
  }, [notes, currentFilter, currentFolderId, selectedTag, notesSearchQuery, sortOption]);

  // Tree Toggle Helpers
  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const toggleBook = (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedBookIds((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  };

  // Render Folders Tree Row
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
            handleSetViewMode('N'); // Fluidly show folder notes feed
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
            <span className="folder-name-label">{folder.name}</span>
          </div>

          <div className="folder-actions-hover" onClick={(e) => e.stopPropagation()}>
            <span className="folder-item-count">{folderNoteCount}</span>
            <button
              type="button"
              className="folder-quick-add-btn"
              onClick={(e) => {
                e.stopPropagation();
                onSelectFolder(folder.id);
                if (onCreateNote) onCreateNote();
                handleSetViewMode('N');
              }}
              title={`Create note inside ${folder.name}`}
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        {hasSubfolders && isExpanded && (
          <ul className="subfolder-list">
            {subfolders.map((sub) => renderFolderItem(sub, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  // COLLAPSED STATE (48px Rail)
  if (isCollapsed) {
    return (
      <aside className={`app-sidebar collapsed ${isOpenMobile ? 'mobile-open' : ''}`}>
        <div className="sidebar-collapsed-rail">
          {/* Active Workspace Icon */}
          <div
            className="sidebar-rail-btn"
            title={`Workspace: ${activeWorkspace?.name || 'Personal'}`}
            style={{ cursor: 'default', fontSize: '14px' }}
          >
            <span>{activeWorkspace?.icon || '🌿'}</span>
          </div>

          {/* Expand Button */}
          <button
            type="button"
            className="sidebar-rail-btn"
            onClick={onToggleCollapse}
            title="Expand Sidebar (◧)"
          >
            <PanelLeftOpen size={16} />
          </button>

          {/* M - Menu Toggle */}
          <button
            type="button"
            className={`sidebar-rail-btn ${viewMode === 'M' ? 'active' : ''}`}
            onClick={() => handleSetViewMode('M')}
            title="Menu / Navigation Directory (M)"
          >
            <Menu size={16} />
          </button>

          {/* N - Notes Feed Toggle */}
          <button
            type="button"
            className={`sidebar-rail-btn ${viewMode === 'N' ? 'active' : ''}`}
            onClick={() => handleSetViewMode('N')}
            title="Notes Feed (N)"
          >
            <FileText size={16} />
            <span
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#6366f1'
              }}
            />
          </button>

          {/* Quick New Note */}
          {onCreateNote && (
            <button
              type="button"
              className="sidebar-rail-btn"
              onClick={() => {
                onCreateNote();
                handleSetViewMode('N');
              }}
              title="Create New Note (+)"
            >
              <Plus size={16} />
            </button>
          )}

          <div style={{ flex: 1 }} />

          {/* Theme Quick Toggle */}
          <button
            type="button"
            className="sidebar-rail-btn"
            onClick={() => onChangeTheme && onChangeTheme(theme === 'dark' ? 'light' : 'dark')}
            title={`Switch theme (current: ${theme})`}
          >
            {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          {/* Settings Trigger */}
          {onOpenSettings && (
            <button
              type="button"
              className="sidebar-rail-btn"
              onClick={() => onOpenSettings('database')}
              title="Vault Settings"
            >
              <Settings size={15} />
            </button>
          )}
        </div>
      </aside>
    );
  }

  // EXPANDED STATE (320px Consolidated Sidebar)
  return (
    <aside className={`app-sidebar ${isOpenMobile ? 'mobile-open' : ''}`}>
      {/* Top Workspace Selector & M / N View Segmented Switcher */}
      <div className="sidebar-top-bar-row">
        {/* Unified Capsule: Workspace Dropdown + Menu/Notes Switcher */}
        <div className="sidebar-unified-capsule">
          {/* Workspace Switcher */}
          <WorkspaceSwitcher
            compact
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            notesCountByWorkspace={notesCountByWorkspace}
            onSelectWorkspace={onSelectWorkspace}
            onCreateWorkspace={onCreateWorkspace}
            onRenameWorkspace={onRenameWorkspace}
            onDeleteWorkspace={onDeleteWorkspace}
          />

          {/* Segmented Mode Switcher: Menu (M) vs Notes (N) */}
          <div className="sidebar-mode-segmented-track">
            <button
              type="button"
              id="tab-nav-btn"
              className={`sidebar-mode-segmented-btn ${viewMode === 'M' ? 'active' : ''}`}
              onClick={() => handleSetViewMode('M')}
              title="Menu & Directory Tree View (Press M)"
            >
              <Menu size={12} />
              <span>Menu (M)</span>
            </button>

            <button
              type="button"
              id="tab-notes-btn"
              className={`sidebar-mode-segmented-btn ${viewMode === 'N' ? 'active' : ''}`}
              onClick={() => handleSetViewMode('N')}
              title="Notes Feed List (Press N)"
            >
              <FileText size={12} />
              <span>Notes (N)</span>
              <span className="sidebar-segmented-count">{activeNotes.length}</span>
            </button>
          </div>
        </div>

        {/* Collapse Sidebar Button */}
        {onToggleCollapse && (
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title="Collapse Sidebar"
          >
            <PanelLeftClose size={15} />
          </button>
        )}
      </div>

      {/* =========================================================================
          VIEW MODE 'M': Menu, Directory Tree, Books, Folders & Calendar
          ========================================================================= */}
      {viewMode === 'M' && (
        <div className="sidebar-scrollable-area" style={{ flex: 1, overflowY: 'auto' }}>
          {/* Primary Navigation Views */}
          {!isNavSectionCollapsed && (
            <div className="sidebar-section">
              <div className="sidebar-section-header" style={{ padding: '4px 6px 6px 6px' }}>
                <span className="section-title-text">Navigation</span>
              </div>
              <nav className="nav-list">
                {/* All Notes */}
                <button
                  type="button"
                  className={`nav-item ${currentFilter === 'all' && !currentFolderId && !selectedTag ? 'active' : ''}`}
                  onClick={() => {
                    onSelectFilter('all');
                    handleSetViewMode('N');
                    onCloseMobile();
                  }}
                >
                  <div className="nav-item-left">
                    <FileText size={14} color="#818cf8" />
                    <span>All Notes</span>
                  </div>
                  <span className="nav-item-count">{activeNotes.length}</span>
                </button>

                {/* Quick Notes */}
                <button
                  type="button"
                  className={`nav-item ${currentFilter === 'quick' ? 'active' : ''}`}
                  onClick={() => {
                    onSelectFilter('quick');
                    handleSetViewMode('N');
                    onCloseMobile();
                  }}
                >
                  <div className="nav-item-left">
                    <Zap size={14} color="#f59e0b" />
                    <span>Quick Notes</span>
                  </div>
                  {quickNotesCount > 0 && <span className="nav-item-count">{quickNotesCount}</span>}
                </button>

                {/* Favorites */}
                <button
                  type="button"
                  className={`nav-item ${currentFilter === 'favorites' ? 'active' : ''}`}
                  onClick={() => {
                    onSelectFilter('favorites');
                    handleSetViewMode('N');
                    onCloseMobile();
                  }}
                >
                  <div className="nav-item-left">
                    <Star size={14} color="#fbbf24" fill="#fbbf24" />
                    <span>Favorites</span>
                  </div>
                  <span className="nav-item-count">{favoriteNotesCount}</span>
                </button>

                {/* Recent */}
                <button
                  type="button"
                  className={`nav-item ${currentFilter === 'recent' ? 'active' : ''}`}
                  onClick={() => {
                    onSelectFilter('recent');
                    handleSetViewMode('N');
                    onCloseMobile();
                  }}
                >
                  <div className="nav-item-left">
                    <Clock size={14} color="#38bdf8" />
                    <span>Recent Notes</span>
                  </div>
                </button>

                {/* With Files & Media */}
                <button
                  type="button"
                  className={`nav-item ${currentFilter === 'attachments' ? 'active' : ''}`}
                  onClick={() => {
                    onSelectFilter('attachments');
                    handleSetViewMode('N');
                    onCloseMobile();
                  }}
                >
                  <div className="nav-item-left">
                    <Paperclip size={14} color="#a78bfa" />
                    <span>With Files & Media</span>
                  </div>
                  <span className="nav-item-count">{withAttachmentsCount}</span>
                </button>

                {/* Tag Directory */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className={`nav-item ${selectedTag ? 'active' : ''}`}
                    onClick={() => setIsTagPopoverOpen(!isTagPopoverOpen)}
                  >
                    <div className="nav-item-left">
                      <Tag size={14} color="#ec4899" />
                      <span>Tag Directory</span>
                    </div>
                    <span className="nav-item-count">{allTags.length}</span>
                  </button>

                  {isTagPopoverOpen && (
                    <TagSelectorPopover
                      notes={activeNotes}
                      selectedTag={selectedTag}
                      isOpen={isTagPopoverOpen}
                      onSelectTag={(t) => {
                        onSelectTag(t);
                        setIsTagPopoverOpen(false);
                        handleSetViewMode('N');
                        onCloseMobile();
                      }}
                      onClose={() => setIsTagPopoverOpen(false)}
                    />
                  )}
                </div>

                {/* Library & Books/Files Manager */}
                {onOpenLibrary && (
                  <button
                    type="button"
                    className="nav-item"
                    onClick={onOpenLibrary}
                  >
                    <div className="nav-item-left">
                      <BookOpen size={14} color="#818cf8" />
                      <span>Library & Files</span>
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#a5b4fc',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      {books.length}b · {notes.filter((n) => n.attachments?.length).length}f
                    </span>
                  </button>
                )}
              </nav>
            </div>
          )}

          {/* Centered Collapse Section Divider */}
          <div className="sidebar-collapse-section-divider">
            <button
              type="button"
              className="sidebar-collapse-section-btn"
              onClick={() => setIsNavSectionCollapsed(!isNavSectionCollapsed)}
              title={isNavSectionCollapsed ? 'Expand Navigation Section' : 'Collapse Navigation Section'}
            >
              {isNavSectionCollapsed ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
              <span>{isNavSectionCollapsed ? 'Expand Section' : 'Collapse Section'}</span>
            </button>
          </div>

          {/* Books Section */}
          <div className="sidebar-section">
            <div
              className="sidebar-section-header"
              onClick={() => setIsBooksExpanded(!isBooksExpanded)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isBooksExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                <span className="section-title-text">📚 Books ({books.length})</span>
              </div>
              <button
                type="button"
                className="section-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBookModalOpen(true);
                }}
                title="Manage Books"
              >
                <SlidersHorizontal size={13} />
              </button>
            </div>

            {isBooksExpanded && (
              <div style={{ padding: '0 6px 4px 6px' }}>
                {books
                  .filter((b) => pinnedBookIds.includes(b.id))
                  .map((book) => {
                    const isExp = expandedBookIds.has(book.id);
                    const pages = activeNotes.filter((n) => n.bookId === book.id);
                    return (
                      <div key={book.id} className="book-card-item">
                        <div
                          className="book-card-header"
                          onClick={(e) => toggleBook(book.id, e)}
                        >
                          <div className="book-header-left">
                            <span className="book-icon-emoji">{book.icon || '📖'}</span>
                            <span className="book-title-label">{book.title}</span>
                          </div>
                          <span className="book-page-count">{pages.length}p</span>
                        </div>

                        {isExp && (
                          <div className="book-pages-container">
                            {pages.map((page) => (
                              <div
                                key={page.id}
                                className={`book-page-row ${selectedNoteId === page.id ? 'active' : ''}`}
                                onClick={() => {
                                  onSelectNote(page.id);
                                  handleSetViewMode('N');
                                  onCloseMobile();
                                }}
                              >
                                <span className="book-page-title">{page.title || 'Untitled Page'}</span>
                              </div>
                            ))}
                            <button
                              type="button"
                              className="book-add-page-btn"
                              onClick={() => {
                                onAddPageToBook(book.id);
                                handleSetViewMode('N');
                              }}
                            >
                              <Plus size={11} />
                              <span>Add Chapter</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                <button
                  type="button"
                  className="browse-pin-btn"
                  onClick={() => setIsBookModalOpen(true)}
                >
                  <Plus size={12} />
                  <span>Browse & Pin Books ({books.length})</span>
                </button>
              </div>
            )}
          </div>

          {/* Folders Section */}
          <div className="sidebar-section">
            <div
              className="sidebar-section-header"
              onClick={() => setIsFoldersExpanded(!isFoldersExpanded)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isFoldersExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                <span className="section-title-text">📁 Folders ({folders.length})</span>
              </div>
              <button
                type="button"
                className="section-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFolderModalOpen(true);
                }}
                title="Manage Folders"
              >
                <SlidersHorizontal size={13} />
              </button>
            </div>

            {isFoldersExpanded && (
              <div style={{ padding: '0 6px 4px 6px' }}>
                <ul className="folder-tree-list">
                  {folders
                    .filter((f) => !f.parentId && pinnedFolderIds.includes(f.id))
                    .map((f) => renderFolderItem(f))}
                </ul>

                <button
                  type="button"
                  className="browse-pin-btn"
                  onClick={() => setIsFolderModalOpen(true)}
                >
                  <Plus size={12} />
                  <span>Browse & Pin Folders ({folders.length})</span>
                </button>
              </div>
            )}
          </div>

          {/* Optional Sidebar Calendar Accordion */}
          {showCalendar && (
            <div className="sidebar-section">
              <div
                className="sidebar-section-header"
                onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CalendarIcon size={13} color="#34d399" />
                  <span className="section-title-text">Calendar</span>
                </div>
                {isCalendarExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </div>

              {isCalendarExpanded && (
                <div style={{ padding: '4px 8px' }}>
                  <CalendarWidget
                    notes={notes}
                    onSelectDate={(d) => {
                      onSelectDate(d);
                      handleSetViewMode('N');
                    }}
                    onOpenTodayNote={() => {
                      onOpenTodayNote();
                      handleSetViewMode('N');
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 'N': Notes Feed List
          ========================================================================= */}
      {viewMode === 'N' && (
        <div className="sidebar-notes-view-panel" id="notes-view-panel">
          {/* Notes Feed Header */}
          <div className="sidebar-notes-feed-header">
            <div className="sidebar-notes-headline-row">
              <div className="sidebar-notes-title-group">
                <h2>{notesFeedTitle}</h2>
                <span className="sidebar-notes-count-badge">({filteredNotes.length})</span>
              </div>

              {onCreateNote && currentFilter !== 'trash' && currentFilter !== 'archive' && (
                <button
                  type="button"
                  className="sidebar-new-note-btn"
                  onClick={onCreateNote}
                  title="Create New Note (Cmd+N)"
                >
                  <Plus size={13} />
                  <span>New Note</span>
                </button>
              )}

              {currentFilter === 'trash' && onEmptyTrash && filteredNotes.length > 0 && (
                <button
                  type="button"
                  className="sidebar-new-note-btn"
                  style={{ background: '#ef4444' }}
                  onClick={onEmptyTrash}
                  title="Permanently empty trash"
                >
                  <Trash2 size={12} />
                  <span>Empty</span>
                </button>
              )}
            </div>

            {/* Filter Search Input & Sort Selector */}
            <div className="sidebar-notes-filter-row">
              <div className="sidebar-notes-search-wrapper">
                <Search size={12} className="sidebar-notes-search-icon" />
                <input
                  type="text"
                  className="sidebar-notes-search-input"
                  placeholder="Search notes in list..."
                  value={notesSearchQuery}
                  onChange={(e) => setNotesSearchQuery(e.target.value)}
                />
                {notesSearchQuery && (
                  <button
                    type="button"
                    className="sidebar-notes-search-clear"
                    onClick={() => setNotesSearchQuery('')}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Sort Selector Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="sidebar-notes-sort-btn"
                  onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                  title="Sort notes"
                >
                  <SlidersHorizontal size={11} />
                  <span>{sortOption === 'updated' ? 'Recent' : sortOption === 'created' ? 'Created' : 'Title'}</span>
                  <ChevronDown size={10} />
                </button>

                {isSortMenuOpen && (
                  <>
                    <div
                      style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                      onClick={() => setIsSortMenuOpen(false)}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        marginTop: '4px',
                        background: '#131824',
                        border: '1px solid #1c2233',
                        borderRadius: '6px',
                        padding: '4px',
                        zIndex: 50,
                        minWidth: '120px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                      }}
                    >
                      <button
                        type="button"
                        className="sidebar-theme-option-item"
                        style={{ width: '100%', fontSize: '11px', padding: '4px 8px' }}
                        onClick={() => { setSortOption('updated'); setIsSortMenuOpen(false); }}
                      >
                        Recent (Modified)
                      </button>
                      <button
                        type="button"
                        className="sidebar-theme-option-item"
                        style={{ width: '100%', fontSize: '11px', padding: '4px 8px' }}
                        onClick={() => { setSortOption('created'); setIsSortMenuOpen(false); }}
                      >
                        Date Created
                      </button>
                      <button
                        type="button"
                        className="sidebar-theme-option-item"
                        style={{ width: '100%', fontSize: '11px', padding: '4px 8px' }}
                        onClick={() => { setSortOption('title'); setIsSortMenuOpen(false); }}
                      >
                        Title (A-Z)
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Note Cards */}
          <div className="sidebar-note-cards-list">
            {filteredNotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                <FileText size={28} style={{ opacity: 0.3, margin: '0 auto 8px auto' }} />
                <p style={{ fontSize: '12px', margin: 0 }}>No notes found</p>
                {onCreateNote && currentFilter !== 'trash' && (
                  <button
                    type="button"
                    style={{
                      marginTop: '10px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      color: '#a5b4fc',
                      fontSize: '11.5px',
                      padding: '4px 10px',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                    onClick={onCreateNote}
                  >
                    + Create a Note
                  </button>
                )}
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = selectedNoteId === note.id;
                const folder = folders.find((f) => f.id === note.folderId);
                const snippet = getSnippet(note.content);
                const hasImages = note.attachments?.some((a) => a.type?.startsWith('image/'));
                const hasAudio = note.attachments?.some((a) => a.type?.startsWith('audio/'));
                const hasFiles = (note.attachments?.length || 0) > 0 && !hasImages && !hasAudio;

                return (
                  <div
                    key={note.id}
                    className={`consolidated-note-card ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      onSelectNote(note.id);
                      onCloseMobile();
                    }}
                  >
                    {/* Top Row: Title & Hover Micro Actions */}
                    <div className="consolidated-card-top-row">
                      <div className="consolidated-card-title-group">
                        {note.isPinned && <Pin size={11} style={{ color: '#818cf8', flexShrink: 0 }} />}
                        {note.isLocked && <Lock size={11} style={{ color: '#fbbf24', flexShrink: 0 }} />}
                        <span className="consolidated-card-title">
                          {note.title || 'Untitled Note'}
                        </span>
                      </div>

                      {/* Hover Actions */}
                      <div className="consolidated-card-hover-actions" onClick={(e) => e.stopPropagation()}>
                        {note.isTrashed ? (
                          <>
                            {onRestoreNote && (
                              <button
                                type="button"
                                className="card-action-micro-btn"
                                onClick={(e) => onRestoreNote(note.id, e)}
                                title="Restore Note"
                              >
                                <RotateCcw size={13} color="#34d399" />
                              </button>
                            )}
                            {onPermanentDeleteNote && (
                              <button
                                type="button"
                                className="card-action-micro-btn danger"
                                onClick={(e) => onPermanentDeleteNote(note.id, e)}
                                title="Permanently Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            {/* Archive Note */}
                            {onArchiveNote && (
                              <button
                                type="button"
                                className="card-action-micro-btn"
                                onClick={(e) => onArchiveNote(note.id, e)}
                                title={note.isArchived ? 'Unarchive Note' : 'Archive Note'}
                              >
                                <Archive size={12} color={note.isArchived ? '#8b5cf6' : undefined} />
                              </button>
                            )}

                            {/* Move to Folder */}
                            {onMoveNote && (
                              <button
                                type="button"
                                className="card-action-micro-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNoteToMoveId(note.id);
                                }}
                                title="Move Note to Folder"
                              >
                                <Folder size={12} />
                              </button>
                            )}

                            {/* Favorite Star */}
                            {onToggleFavorite && (
                              <button
                                type="button"
                                className="card-action-micro-btn star"
                                onClick={(e) => onToggleFavorite(note.id, e)}
                                title={note.isFavorite ? 'Unfavorite' : 'Favorite'}
                              >
                                <Star
                                  size={12}
                                  fill={note.isFavorite ? '#fbbf24' : 'none'}
                                  color={note.isFavorite ? '#fbbf24' : 'var(--text-muted)'}
                                />
                              </button>
                            )}

                            {/* Split View */}
                            {onSelectNoteSplit && (
                              <button
                                type="button"
                                className="card-action-micro-btn split"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectNoteSplit(note.id);
                                }}
                                title="Open Side-by-Side (Split View)"
                              >
                                <Columns2 size={12} />
                              </button>
                            )}

                            {/* Delete Note */}
                            {onDeleteNote && (
                              <button
                                type="button"
                                className="card-action-micro-btn danger"
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

                    {/* Metadata Row: Relative Time • Folder Badge • Media Icons */}
                    <div className="consolidated-card-meta-row">
                      <span className="consolidated-card-time">{formatRelativeTime(note.updatedAt)}</span>
                      <span>•</span>
                      <span className="consolidated-card-folder">
                        {folder ? (
                          <>
                            <span>📁</span>
                            <span style={{ color: folder.color || 'inherit' }}>{folder.name}</span>
                          </>
                        ) : (
                          <span>📁 Uncategorized</span>
                        )}
                      </span>

                      {(hasImages || hasAudio || hasFiles) && (
                        <>
                          <span>•</span>
                          <span style={{ display: 'inline-flex', gap: '3px' }}>
                            {hasImages && <ImageIcon size={10} />}
                            {hasAudio && <Music size={10} style={{ color: '#f87171' }} />}
                            {hasFiles && <Paperclip size={10} />}
                          </span>
                        </>
                      )}
                    </div>

                    {/* 2-line snippet preview */}
                    {snippet && (
                      <p className="card-snippet-2lines" style={{ margin: '2px 0 0 0' }}>
                        {snippet}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          Unified Sidebar Footer: Archive/Trash, Theme Switcher & More Menu
          ========================================================================= */}
      <div className="sidebar-footer-container">
        {/* Archive & Bin Quick Buttons */}
        <div className="sidebar-footer-row">
          <button
            type="button"
            className={`sidebar-bottom-pill ${currentFilter === 'archive' ? 'active' : ''}`}
            onClick={() => {
              onSelectFilter('archive');
              handleSetViewMode('N');
              onCloseMobile();
            }}
            title="Archived Notes"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Archive size={13} style={{ color: currentFilter === 'archive' ? 'var(--accent-primary)' : 'var(--accent-secondary, #8b5cf6)' }} />
              <span>Archive</span>
            </div>
            <span className="sidebar-bottom-badge">{archivedNotesCount}</span>
          </button>

          <button
            type="button"
            className={`sidebar-bottom-pill ${currentFilter === 'trash' ? 'active' : ''}`}
            onClick={() => {
              onSelectFilter('trash');
              handleSetViewMode('N');
              onCloseMobile();
            }}
            title="Trash Bin"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trash2 size={13} style={{ color: currentFilter === 'trash' ? 'var(--accent-primary)' : '#f87171' }} />
              <span>Bin</span>
            </div>
            <span className="sidebar-bottom-badge">{trashedNotesCount}</span>
          </button>
        </div>

        {/* Theme Switcher & More Options */}
        <div className="sidebar-footer-controls">
          {/* Segmented Theme Switcher */}
          <div className="sidebar-theme-segmented" role="radiogroup" aria-label="Theme selection">
            <button
              type="button"
              className={`sidebar-theme-chip ${theme === 'light' ? 'active' : ''}`}
              onClick={() => onChangeTheme && onChangeTheme('light')}
              title="Light Day Theme"
              aria-label="Light Day Theme"
            >
              <Sun size={12} />
              <span>Day</span>
            </button>
            <button
              type="button"
              className={`sidebar-theme-chip ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => onChangeTheme && onChangeTheme('dark')}
              title="Dark Night Theme"
              aria-label="Dark Night Theme"
            >
              <Moon size={12} />
              <span>Night</span>
            </button>
            <button
              type="button"
              className={`sidebar-theme-chip ${theme === 'system' ? 'active' : ''}`}
              onClick={() => onChangeTheme && onChangeTheme('system')}
              title="Auto System Theme"
              aria-label="Auto System Theme"
            >
              <Monitor size={12} />
              <span>Auto</span>
            </button>
          </div>

          {/* More Options Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="sidebar-more-trigger-btn"
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              title="More Vault Options"
              aria-expanded={isMoreMenuOpen}
            >
              <Sparkles size={12} style={{ color: 'var(--accent-primary, #818cf8)' }} />
              <span>More</span>
              <ChevronDown size={11} />
            </button>

            {isMoreMenuOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                  onClick={() => setIsMoreMenuOpen(false)}
                />
                <div className="sidebar-more-dropdown">
                  {onOpenSettings && (
                    <button
                      type="button"
                      className="sidebar-more-dropdown-item"
                      onClick={() => {
                        onOpenSettings('database');
                        setIsMoreMenuOpen(false);
                      }}
                    >
                      <Settings size={13} />
                      <span>Vault Settings</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="sidebar-more-dropdown-item"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('milearn:open-tour'));
                      setIsMoreMenuOpen(false);
                    }}
                  >
                    <HelpCircle size={13} />
                    <span>Start Guided Tour</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Move Note Modal */}
      {noteToMoveId && onMoveNote && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
          onClick={() => setNoteToMoveId(null)}
        >
          <div
            style={{
              background: 'var(--bg-modal)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '16px',
              width: '320px',
              maxWidth: '90vw',
              boxShadow: '0 16px 36px rgba(0,0,0,0.7)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                Move Note to Folder
              </h3>
              <button
                type="button"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setNoteToMoveId(null)}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '240px', overflowY: 'auto' }}>
              <button
                type="button"
                className="sidebar-theme-option-item"
                style={{ padding: '8px 10px', borderRadius: '6px' }}
                onClick={() => {
                  onMoveNote(noteToMoveId, null, null);
                  setNoteToMoveId(null);
                }}
              >
                <Folder size={14} color="#8e9bb5" />
                <span>📁 Uncategorized (Root)</span>
              </button>

              {folders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="sidebar-theme-option-item"
                  style={{ padding: '8px 10px', borderRadius: '6px' }}
                  onClick={() => {
                    onMoveNote(noteToMoveId, f.id, null);
                    setNoteToMoveId(null);
                  }}
                >
                  <Folder size={14} style={{ color: f.color || '#6366f1' }} />
                  <span>{f.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pinned Modals */}
      <FolderSelectorModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        folders={folders}
        notes={notes}
        currentFolderId={currentFolderId}
        pinnedFolderIds={pinnedFolderIds}
        onTogglePinFolder={togglePinFolder}
        onSelectFolder={(id) => {
          if (id) {
            onSelectFolder(id);
            handleSetViewMode('N');
          }
        }}
        onCreateFolder={onCreateFolder}
        onRenameFolder={onRenameFolder}
        onDeleteFolder={onDeleteFolder}
      />

      <BookSelectorModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        books={books}
        notes={notes}
        pinnedBookIds={pinnedBookIds}
        onTogglePinBook={togglePinBook}
        onSelectBook={(bookId) => {
          const page = activeNotes.find((n) => n.bookId === bookId);
          if (page) onSelectNote(page.id);
          handleSetViewMode('N');
          setIsBookModalOpen(false);
        }}
        onCreateBook={onCreateBook}
        onDeleteBook={onDeleteBook}
      />
    </aside>
  );
};
