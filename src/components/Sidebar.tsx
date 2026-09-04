import React, { useState, useEffect, useRef } from 'react';
import type { Folder as FolderType, Note, ViewFilter, Workspace, Book, ThemeMode } from '../types';
import { 
  FileText, 
  Star, 
  Clock, 
  Folder, 
  Tag, 
  ChevronRight, 
  ChevronLeft,
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
  Cloud
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
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

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
  theme = 'system',
  onToggleTheme,
  onSelectWorkspace,
  onCreateWorkspace,
  onDeleteWorkspace,
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
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [expandedBookIds, setExpandedBookIds] = useState<Set<string>>(new Set());
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(true);
  const [isBooksExpanded, setIsBooksExpanded] = useState(true);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);

  // Popup Modal States
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // Pinned Folders & Books persisted in localStorage
  const [pinnedFolderIds, setPinnedFolderIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('milearnapp_pinned_folders');
      if (saved) return JSON.parse(saved);
      // Default: pin root folders
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

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Daily 1-Minute Calendar auto-open and auto-collapse rule
  useEffect(() => {
    const todayDateKey = new Date().toISOString().slice(0, 10);
    const lastAutoOpenDate = localStorage.getItem('milearnapp_cal_daily_open_date');

    if (lastAutoOpenDate !== todayDateKey) {
      setIsCalendarExpanded(true);
      localStorage.setItem('milearnapp_cal_daily_open_date', todayDateKey);

      const timer = setTimeout(() => {
        setIsCalendarExpanded(false);
      }, 60000); // 1 minute auto-collapse

      return () => clearTimeout(timer);
    } else {
      setIsCalendarExpanded(false);
    }
  }, []);

  // Auto-collapse calendar when scrolling sidebar
  const handleSidebarScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 25 && isCalendarExpanded) {
      setIsCalendarExpanded(false);
    }
  };

  const collapseCalendarOnBrowse = () => {
    if (isCalendarExpanded) {
      setIsCalendarExpanded(false);
    }
  };

  // Counts
  const activeNotes = notes.filter((n) => !n.isTrashed && !n.isArchived);
  const totalNotes = activeNotes.length;
  const quickNotesCount = activeNotes.filter(
    (n) => n.tags?.includes('quick-note') || n.title.includes('Quick Scratchpad')
  ).length;
  const favoriteNotes = activeNotes.filter((n) => n.isFavorite).length;
  const withAttachments = activeNotes.filter((n) => n.attachments && n.attachments.length > 0).length;
  const archivedNotesCount = notes.filter((n) => n.isArchived && !n.isTrashed).length;
  const trashedNotesCount = notes.filter((n) => n.isTrashed).length;

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const notesCountByWorkspace = propNotesCount || (() => {
    const map = new Map<string, number>();
    notes.forEach((n) => {
      if (!n.isTrashed) {
        const wsId = n.workspaceId || 'ws-personal';
        map.set(wsId, (map.get(wsId) || 0) + 1);
      }
    });
    return map;
  })();

  const allTags = Array.from(
    new Set(activeNotes.flatMap((n) => n.tags || []))
  ).filter(Boolean);

  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    collapseCalendarOnBrowse();
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const toggleBook = (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    collapseCalendarOnBrowse();
    setExpandedBookIds((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  };

  // Render Pinned Folder Row
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
            collapseCalendarOnBrowse();
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
            <span className="folder-name-label">{folder.name}</span>
          </div>

          <div className="folder-actions-hover" onClick={(e) => e.stopPropagation()}>
            <span className="badge-count">{folderNoteCount}</span>
            <button
              className="folder-icon-btn"
              title="Unpin folder from sidebar"
              onClick={() => togglePinFolder(folder.id)}
            >
              <Pin size={11} fill="var(--accent-primary)" color="var(--accent-primary)" />
            </button>
          </div>
        </div>

        {hasSubfolders && isExpanded && (
          <ul className="folder-nested-list">
            {subfolders.map((sub) => renderFolderItem(sub, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  // Filter pinned folders & books for sidebar display
  const displayedFolders = folders.filter((f) => pinnedFolderIds.includes(f.id));
  const displayedBooks = books.filter((b) => pinnedBookIds.includes(b.id));

  // If collapsed on desktop, render sleek icon rail
  if (isCollapsed) {
    return (
      <aside className="app-sidebar collapsed">
        {onToggleCollapse && (
          <button
            type="button"
            className="edge-middle-toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
            title="Expand Sidebar (Cmd+\)"
            aria-label="Expand Sidebar"
          >
            <ChevronRight size={13} />
          </button>
        )}
        <div className="sidebar-collapsed-rail">
          {/* Top Rail Expand Button */}
          {onToggleCollapse && (
            <button 
              type="button"
              className="rail-nav-btn rail-toggle-btn"
              onClick={onToggleCollapse}
              title="Expand Sidebar (Cmd+\)"
              aria-label="Expand Sidebar"
            >
              <PanelLeftOpen size={16} />
            </button>
          )}

          <div 
            className="rail-ws-badge" 
            onClick={onToggleCollapse}
            title={`Workspace: ${activeWorkspace?.name || 'Personal'} (Click to expand)`}
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
              className={`rail-nav-btn ${currentFilter === 'quick' ? 'active' : ''}`}
              onClick={() => onSelectFilter('quick')}
              title={`Quick Notes (${quickNotesCount})`}
            >
              <Zap size={16} color="#eab308" />
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
              onClick={() => setIsFolderModalOpen(true)}
              title={`Browse Folders (${folders.length})`}
            >
              <Folder size={16} color="var(--text-secondary)" />
            </button>
          </div>

          <div className="rail-bottom-group">
            {/* Calendar Button placed above Archive & Bin in Rail */}
            <button
              type="button"
              className={`rail-nav-btn ${isCalendarExpanded ? 'active' : ''}`}
              onClick={() => {
                if (onToggleCollapse) onToggleCollapse();
                setIsCalendarExpanded(true);
              }}
              title={`Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })} (Click to expand Calendar)`}
            >
              <CalendarIcon size={16} color="var(--accent-primary)" />
              <span className="rail-pill-badge" style={{ background: 'var(--accent-primary)' }}>
                {new Date().getDate()}
              </span>
            </button>

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

            {onToggleTheme && (
              <button 
                type="button"
                className="rail-nav-btn rail-theme-btn"
                onClick={onToggleTheme}
                title={`Theme: ${
                  theme === 'system' ? 'System Default' :
                  theme === 'light' ? 'Day Theme' :
                  theme === 'dark' ? 'Night Theme' :
                  theme === 'oled' ? 'Obsidian Onyx' :
                  theme === 'tokyo' ? 'Tokyo Midnight' :
                  theme === 'nordic' ? 'Nordic Frost' : 'Editorial'
                } (Click to Cycle Themes)`}
              >
                {theme === 'system' ? <Monitor size={16} /> :
                 theme === 'light' ? <Sun size={16} color="#f59e0b" /> :
                 theme === 'dark' ? <Moon size={16} color="#8b5cf6" /> :
                 theme === 'oled' ? <Sparkles size={16} color="#a855f7" /> :
                 theme === 'tokyo' ? <Zap size={16} color="#38bdf8" /> :
                 theme === 'nordic' ? <Cloud size={16} color="#34d399" /> :
                 <BookOpen size={16} color="#c2410c" />}
              </button>
            )}
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

      {/* Popups & Selectors */}
      <TagSelectorPopover
        isOpen={isTagPopoverOpen}
        onClose={() => setIsTagPopoverOpen(false)}
        notes={notes}
        selectedTag={selectedTag}
        onSelectTag={(tag) => {
          onSelectTag(tag);
          if (tag) onSelectFilter('all');
        }}
      />

      <FolderSelectorModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        folders={folders}
        notes={notes}
        currentFolderId={currentFolderId}
        pinnedFolderIds={pinnedFolderIds}
        onTogglePinFolder={togglePinFolder}
        onSelectFolder={(fId) => {
          if (fId) {
            onSelectFolder(fId);
            onSelectFilter('all');
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
          const firstPage = notes.find((n) => n.bookId === bookId && !n.isTrashed);
          if (firstPage) onSelectNote(firstPage.id);
        }}
        onCreateBook={onCreateBook}
        onDeleteBook={onDeleteBook}
      />

      <aside className={`app-sidebar ${isOpenMobile ? 'open' : ''}`}>
        {onToggleCollapse && (
          <button
            type="button"
            className="edge-middle-toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
            title="Collapse Sidebar (Cmd+\)"
            aria-label="Collapse Sidebar"
          >
            <ChevronLeft size={13} />
          </button>
        )}
        {/* Top Header: Persona Switcher with right-aligned collapse button */}
        <div className="sidebar-top-header">
          <div className="sidebar-ws-container">
            <WorkspaceSwitcher
              workspaces={workspaces}
              activeWorkspaceId={activeWorkspaceId}
              notesCountByWorkspace={notesCountByWorkspace}
              onSelectWorkspace={onSelectWorkspace}
              onCreateWorkspace={onCreateWorkspace}
              onDeleteWorkspace={onDeleteWorkspace}
            />
          </div>
          {onToggleCollapse && (
            <button
              type="button"
              className="sidebar-collapse-btn"
              onClick={onToggleCollapse}
              title="Collapse Sidebar (Cmd+\)"
              aria-label="Collapse Sidebar"
            >
              <PanelLeftClose size={15} />
            </button>
          )}
        </div>

        <div 
          className="sidebar-scroll" 
          ref={scrollContainerRef}
          onScroll={handleSidebarScroll}
        >

          {/* Section: Quick Navigation */}
          <div>
            <div className="sidebar-section-title">Navigation</div>
            <ul className="sidebar-nav-list">
              <li 
                className={`sidebar-nav-item ${currentFilter === 'all' && !currentFolderId && !selectedTag ? 'active' : ''}`}
                onClick={() => {
                  collapseCalendarOnBrowse();
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

              {/* Quick Notes under All Notes */}
              <li 
                className={`sidebar-nav-item ${currentFilter === 'quick' ? 'active' : ''}`}
                onClick={() => {
                  collapseCalendarOnBrowse();
                  onSelectFilter('quick');
                  onCloseMobile();
                }}
              >
                <div className="nav-item-left">
                  <Zap size={15} style={{ color: '#eab308' }} />
                  <span>Quick Notes</span>
                </div>
                {quickNotesCount > 0 && <span className="badge-count">{quickNotesCount}</span>}
              </li>

              <li 
                className={`sidebar-nav-item ${currentFilter === 'favorites' ? 'active' : ''}`}
                onClick={() => {
                  collapseCalendarOnBrowse();
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
                  collapseCalendarOnBrowse();
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
                  collapseCalendarOnBrowse();
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

              {/* Tags Popup Selector Trigger in Navigation */}
              <li 
                className={`sidebar-nav-item ${selectedTag ? 'active' : ''}`}
                onClick={() => {
                  collapseCalendarOnBrowse();
                  setIsTagPopoverOpen(true);
                }}
              >
                <div className="nav-item-left">
                  <Tag size={15} style={{ color: 'var(--accent-primary)' }} />
                  <span>{selectedTag ? `Tag: #${selectedTag}` : 'Tag Directory'}</span>
                </div>
                <span className="badge-count" style={{ background: selectedTag ? 'var(--accent-primary)' : undefined, color: selectedTag ? 'white' : undefined }}>
                  {selectedTag ? 'Filtered' : allTags.length}
                </span>
              </li>

              {onOpenLibrary && (
                <li 
                  className={`sidebar-nav-item ${isLibraryOpen ? 'active' : ''}`}
                  onClick={() => {
                    collapseCalendarOnBrowse();
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

          {/* Section: Pinned Books & Notebooks (Collapsible with Popup Selector) */}
          <div className="sidebar-books-section">
            <div 
              className="sidebar-section-title clickable-section-header"
              onClick={() => {
                collapseCalendarOnBrowse();
                setIsBooksExpanded(!isBooksExpanded);
              }}
              title={isBooksExpanded ? "Collapse Books" : "Expand Books"}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button 
                  type="button" 
                  className="section-toggle-chevron"
                  aria-label={isBooksExpanded ? "Collapse Books" : "Expand Books"}
                >
                  {isBooksExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>
                <BookOpen size={13} color="var(--accent-primary)" />
                <span>Books</span>
                <span className="badge-count-tiny">{displayedBooks.length}</span>
              </div>
              <button
                type="button"
                className="folder-action-btn"
                title="Browse & Pin Books"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBookModalOpen(true);
                }}
              >
                <SlidersHorizontal size={12} />
              </button>
            </div>

            {isBooksExpanded && (
              <div className="sidebar-pinned-books">
                {displayedBooks.map((book) => {
                  const isExpanded = expandedBookIds.has(book.id);
                  const pages = notes
                    .filter((n) => n.bookId === book.id && !n.isTrashed)
                    .sort((a, b) => (a.pageOrder || 0) - (b.pageOrder || 0));

                  return (
                    <div key={book.id} className="book-card-item">
                      <div 
                        className="book-card-header"
                        onClick={(e) => toggleBook(book.id, e)}
                        title={book.title}
                      >
                        <div className="book-header-left">
                          <span className="book-icon-emoji">{book.icon || '📖'}</span>
                          <span className="book-title-label">{book.title}</span>
                          <span className="book-page-count">{pages.length}p</span>
                        </div>
                        <div className="book-header-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="book-icon-btn"
                            title="Add Chapter / Page"
                            onClick={() => onAddPageToBook(book.id)}
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            type="button"
                            className="book-icon-btn"
                            title="Unpin from Sidebar"
                            onClick={() => togglePinBook(book.id)}
                          >
                            <Pin size={11} fill="var(--accent-primary)" color="var(--accent-primary)" />
                          </button>
                        </div>
                      </div>

                      {/* Nested Pages List */}
                      {isExpanded && (
                        <div className="book-pages-sublist">
                          {pages.map((page, idx) => {
                            const isSelected = page.id === selectedNoteId;
                            return (
                              <div
                                key={page.id}
                                className={`book-page-item ${isSelected ? 'active' : ''}`}
                                onClick={() => {
                                  collapseCalendarOnBrowse();
                                  onSelectNote(page.id);
                                }}
                                title={page.title}
                              >
                                <span className="page-number-dot">{idx + 1}</span>
                                <FileText size={12} className="page-file-icon" />
                                <span className="page-title-text">{page.title || 'Untitled Page'}</span>
                              </div>
                            );
                          })}
                          {pages.length === 0 && (
                            <div 
                              className="book-empty-pages"
                              onClick={() => onAddPageToBook(book.id)}
                            >
                              + Add first chapter
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  className="btn-browse-pin"
                  onClick={() => setIsBookModalOpen(true)}
                >
                  <Plus size={12} />
                  <span>Browse & Pin Books ({books.length})</span>
                </button>
              </div>
            )}
          </div>

          {/* Section: Pinned Folders (Collapsible with Popup Selector) */}
          <div className="sidebar-folders-section">
            <div 
              className="sidebar-section-title clickable-section-header"
              onClick={() => {
                collapseCalendarOnBrowse();
                setIsFoldersExpanded(!isFoldersExpanded);
              }}
              title={isFoldersExpanded ? "Collapse Folders" : "Expand Folders"}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button 
                  type="button" 
                  className="section-toggle-chevron"
                  aria-label={isFoldersExpanded ? "Collapse Folders" : "Expand Folders"}
                >
                  {isFoldersExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>
                <Folder size={13} color="var(--text-muted)" />
                <span>Folders</span>
                <span className="badge-count-tiny">{displayedFolders.length}</span>
              </div>
              <button 
                className="folder-action-btn"
                title="Browse & Pin Folders"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFolderModalOpen(true);
                }}
              >
                <SlidersHorizontal size={12} />
              </button>
            </div>

            {isFoldersExpanded && (
              <div className="sidebar-pinned-folders">
                <ul className="folder-tree-root">
                  {displayedFolders.map((folder) => renderFolderItem(folder))}
                </ul>

                <button
                  type="button"
                  className="btn-browse-pin"
                  onClick={() => setIsFolderModalOpen(true)}
                >
                  <Plus size={12} />
                  <span>Browse & Pin Folders ({folders.length})</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section: Calendar & Daily Notes (Pinned directly above Bin & Archive footer) */}
        <div className="sidebar-calendar-accordion pinned-above-bins">
          <div 
            className="cal-accordion-header"
            onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
            title={`Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })} (Click to ${isCalendarExpanded ? 'collapse' : 'expand'})`}
          >
            <div className="cal-header-left">
              <CalendarIcon size={14} color="var(--accent-primary)" />
              <div className="cal-header-title-wrap">
                <span className="cal-header-title">Calendar & Daily Log</span>
                <span className="cal-header-date-badge">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
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

        {/* Sidebar Footer: Archive & Bin Buttons */}
        <div className="sidebar-footer-bins">
          <button 
            className={`sidebar-bin-pill ${currentFilter === 'archive' ? 'active' : ''}`}
            onClick={() => {
              collapseCalendarOnBrowse();
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
              collapseCalendarOnBrowse();
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

        {/* Theme Switcher beneath Archive and Bin */}
        {onToggleTheme && (
          <div className="sidebar-footer-theme">
            <button
              type="button"
              className="sidebar-theme-toggle-pill"
              onClick={onToggleTheme}
              title={`Theme: ${
                theme === 'system' ? 'System Default' :
                theme === 'light' ? 'Day Theme' :
                theme === 'dark' ? 'Night Theme' :
                theme === 'oled' ? 'Obsidian Onyx' :
                theme === 'tokyo' ? 'Tokyo Midnight' :
                theme === 'nordic' ? 'Nordic Frost' : 'Warm Editorial'
              } (Click to Cycle Themes)`}
            >
              <div className="sidebar-theme-icon-wrap">
                {theme === 'system' ? <Monitor size={14} /> :
                 theme === 'light' ? <Sun size={14} color="#f59e0b" /> :
                 theme === 'dark' ? <Moon size={14} color="#8b5cf6" /> :
                 theme === 'oled' ? <Sparkles size={14} color="#a855f7" /> :
                 theme === 'tokyo' ? <Zap size={14} color="#38bdf8" /> :
                 theme === 'nordic' ? <Cloud size={14} color="#34d399" /> :
                 <BookOpen size={14} color="#c2410c" />}
              </div>
              <span className="sidebar-theme-name">
                {theme === 'system' ? 'System Theme' :
                 theme === 'light' ? 'Day Light' :
                 theme === 'dark' ? 'Night Dark' :
                 theme === 'oled' ? 'Obsidian Onyx' :
                 theme === 'tokyo' ? 'Tokyo Midnight' :
                 theme === 'nordic' ? 'Nordic Frost' : 'Warm Editorial'}
              </span>
              <span className="sidebar-theme-chip">Theme</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
