import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Folder as FolderType, ViewFilter, Workspace, Book, ThemeMode, UserProfile, Note } from '../types';
import { 
  FileText, 
  Star, 
  Clock, 
  Folder, 
  ChevronRight, 
  ChevronLeft,
  Trash2, 
  Archive, 
  BookOpen, 
  Zap, 
  Plus, 
  Sun, 
  Moon, 
  Settings, 
  Search, 
  Timer, 
  Keyboard, 
  Brain, 
  Network, 
  GitFork, 
  BookA, 
  Globe, 
  GraduationCap, 
  Calendar, 
  User, 
  LogOut, 
  PanelLeftOpen,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { PRESET_PERSONAS } from './ProfileSwitcherPopover';

interface WindowsXPStartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile;
  onOpenProfile?: () => void;
  onUpdateProfile?: (profile: UserProfile) => void;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
  folders: FolderType[];
  onSelectFolder: (folderId: string) => void;
  books: Book[];
  notes?: Note[];
  onSelectNote?: (noteId: string) => void;
  onSelectFilter: (filter: ViewFilter) => void;
  currentFilter: ViewFilter;
  theme?: ThemeMode;
  onChangeTheme?: (mode: ThemeMode) => void;
  onOpenSettings?: (tab?: string) => void;
  onCreateNote?: () => void;
  onCreateQuickNote?: () => void;
  onToggleCollapse?: () => void;
  onOpenTodayNote?: () => void;
  // Tool Launchers
  onOpenSearch?: () => void;
  onOpenKnowledgeBase?: () => void;
  onOpenInternalMind?: () => void;
  onOpenLinkTree?: () => void;
  onOpenStudyMode?: () => void;
  onOpenPomodoro?: () => void;
  onOpenTypingMetrics?: () => void;
  onOpenDictionary?: () => void;
  onOpenWebClipper?: () => void;
}

type ActiveCategory = 
  | 'all' 
  | 'favorites' 
  | 'recent' 
  | 'archive' 
  | 'trash' 
  | 'folders' 
  | 'books' 
  | 'workspaces' 
  | 'tools' 
  | 'profiles'
  | 'appearance' 
  | 'settings';

const formatRelativeTime = (dateStr?: string) => {
  if (!dateStr) return '';
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

export const WindowsXPStartMenu: React.FC<WindowsXPStartMenuProps> = ({
  isOpen,
  onClose,
  userProfile,
  onOpenProfile,
  onUpdateProfile,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  folders,
  onSelectFolder,
  books,
  notes = [],
  onSelectNote,
  onSelectFilter,
  currentFilter: _currentFilter,
  theme = 'dark',
  onChangeTheme,
  onOpenSettings,
  onCreateNote,
  onCreateQuickNote,
  onToggleCollapse,
  onOpenTodayNote,
  onOpenSearch,
  onOpenKnowledgeBase,
  onOpenInternalMind,
  onOpenLinkTree,
  onOpenStudyMode,
  onOpenPomodoro,
  onOpenTypingMetrics,
  onOpenDictionary,
  onOpenWebClipper
}) => {
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSelectCategory = (cat: ActiveCategory) => {
    setActiveCategory(cat);
    setSelectedFolderId(null);
    setSelectedBookId(null);
  };

  // Filtered Note Subsets
  const activeNotes = useMemo(() => notes.filter((n) => !n.isTrashed && !n.isArchived), [notes]);
  const favoriteNotes = useMemo(() => activeNotes.filter((n) => n.isFavorite), [activeNotes]);
  const recentNotes = useMemo(() => 
    [...activeNotes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 20),
    [activeNotes]
  );
  const archivedNotes = useMemo(() => notes.filter((n) => n.isArchived && !n.isTrashed), [notes]);
  const trashedNotes = useMemo(() => notes.filter((n) => n.isTrashed), [notes]);

  // Close on outside click or ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentName = userProfile?.name || 'Alex Mercer';
  const currentRole = userProfile?.role || 'Personal Knowledge Engineer';
  const currentMood = userProfile?.mood || '🧠 Deep Focus';
  const currentAvatarType = userProfile?.avatarType || 'emoji';
  const currentAvatarVal = userProfile?.avatarValue || '🦊';
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const handleAction = (cb?: () => void) => {
    onClose();
    cb?.();
  };

  // Helper to render Note Lists in Column 2
  const renderNoteList = (
    items: Note[], 
    title: string, 
    icon: React.ReactNode, 
    emptyText: string,
    viewFilter?: ViewFilter
  ) => (
    <div className="xp-pane-column-view">
      <div className="xp-col2-header">
        <div className="xp-col2-title">
          {icon}
          <span>{title} ({items.length})</span>
        </div>
        {viewFilter && (
          <button
            type="button"
            className="xp-col2-back-btn"
            onClick={() => {
              handleAction(() => {
                onSelectFilter(viewFilter);
                if (onToggleCollapse) onToggleCollapse();
              });
            }}
            title={`View all in feed`}
          >
            <span>Open Feed</span>
            <ChevronRight size={11} />
          </button>
        )}
      </div>

      <div className="xp-col2-list">
        {items.length === 0 ? (
          <div className="xp-col2-empty">{emptyText}</div>
        ) : (
          items.slice(0, 15).map((note) => (
            <button
              key={note.id}
              type="button"
              className="xp-col2-item"
              onClick={() => handleAction(() => onSelectNote?.(note.id))}
              title={note.title || 'Untitled Note'}
            >
              <FileText size={14} color="#818cf8" style={{ flexShrink: 0 }} />
              <div className="xp-col2-text">
                <strong>{note.title || 'Untitled Note'}</strong>
                <span>
                  {formatRelativeTime(note.updatedAt)}
                  {note.tags && note.tags.length > 0 ? ` · #${note.tags[0]}` : ''}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="xp-start-menu-wrapper" ref={menuRef}>
      <div className="xp-start-menu-window">
        {/* TOP BANNER (Classic XP Royal Blue Gradient Banner) */}
        <div className="xp-start-header">
          <div 
            className="xp-start-header-left" 
            onClick={() => handleAction(onOpenProfile)}
            title="Click to view Profile Settings"
            role="button"
            tabIndex={0}
          >
            <div className="xp-start-header-avatar-frame">
              {currentAvatarType === 'image' || currentAvatarType === 'gif' ? (
                <img src={currentAvatarVal} alt="Profile" className="xp-start-avatar-img" />
              ) : (
                <span className="xp-start-avatar-emoji">{currentAvatarVal}</span>
              )}
              <span className="xp-start-avatar-mood-dot" />
            </div>
            <div className="xp-start-header-user">
              <span className="xp-start-username">{currentName}</span>
              <span className="xp-start-role">{currentRole} · {currentMood}</span>
            </div>
          </div>

          {/* Quick Actions in Header: Search & Quick Note (Orange rectangle area) */}
          <div className="xp-start-header-actions">
            {onOpenSearch && (
              <button
                type="button"
                className="xp-header-btn xp-header-search-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(onOpenSearch);
                }}
                title="Search Notes (Cmd+K)"
              >
                <Search size={13} />
                <span>Search</span>
                <kbd className="xp-header-kbd">⌘K</kbd>
              </button>
            )}

            <button
              type="button"
              className="xp-header-btn xp-header-quicknote-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleAction(onCreateQuickNote || onCreateNote);
              }}
              title="Create Quick Note"
            >
              <Zap size={13} />
              <span>Quick Note</span>
            </button>
          </div>
        </div>

        {/* 2-COLUMN XP BODY */}
        <div className="xp-start-body">
          {/* ======================================================== */}
          {/* COLUMN 1: CATEGORIES & CONTROLS                         */}
          {/* ======================================================== */}
          <div className="xp-start-left-pane">
            {/* Primary Action: New Note */}
            <div className="xp-start-item-group">
              <button
                type="button"
                className="xp-menu-item xp-menu-item-pinned"
                onClick={() => handleAction(onCreateNote)}
              >
                <div className="xp-item-icon-box indigo">
                  <Plus size={15} />
                </div>
                <div className="xp-item-label-group">
                  <strong>New Note</strong>
                  <span>Create blank document</span>
                </div>
              </button>
            </div>

            <div className="xp-pane-divider" />

            {/* Group 2: Note Collections (Dynamic Detail View in Col 2) */}
            <div className="xp-start-item-group">
              <span className="xp-section-label">Note Collections</span>

              {/* All Notes */}
              <button
                type="button"
                className={`xp-menu-item xp-menu-expandable ${activeCategory === 'all' ? 'active is-expanded' : ''}`}
                onMouseEnter={() => handleSelectCategory('all')}
                onClick={() => handleSelectCategory('all')}
              >
                <FileText size={15} className="xp-item-icon" />
                <span className="xp-expandable-title">All Notes</span>
                <span className="xp-item-badge">{activeNotes.length}</span>
                <ChevronRight size={13} className="xp-expand-arrow" />
              </button>

              {/* Starred Notes */}
              <button
                type="button"
                className={`xp-menu-item xp-menu-expandable ${activeCategory === 'favorites' ? 'active is-expanded' : ''}`}
                onMouseEnter={() => handleSelectCategory('favorites')}
                onClick={() => handleSelectCategory('favorites')}
              >
                <Star size={15} className="xp-item-icon star" />
                <span className="xp-expandable-title">Starred Notes</span>
                <span className="xp-item-badge">{favoriteNotes.length}</span>
                <ChevronRight size={13} className="xp-expand-arrow" />
              </button>

              {/* Recent History */}
              <button
                type="button"
                className={`xp-menu-item xp-menu-expandable ${activeCategory === 'recent' ? 'active is-expanded' : ''}`}
                onMouseEnter={() => handleSelectCategory('recent')}
                onClick={() => handleSelectCategory('recent')}
              >
                <Clock size={15} className="xp-item-icon clock" />
                <span className="xp-expandable-title">Recent History</span>
                <ChevronRight size={13} className="xp-expand-arrow" />
              </button>

              {/* Daily Note */}
              {onOpenTodayNote && (
                <button
                  type="button"
                  className="xp-menu-item"
                  onClick={() => handleAction(onOpenTodayNote)}
                >
                  <Calendar size={15} className="xp-item-icon emerald" />
                  <span>Today's Daily Note</span>
                </button>
              )}

              {/* Archive */}
              <button
                type="button"
                className={`xp-menu-item xp-menu-expandable ${activeCategory === 'archive' ? 'active is-expanded' : ''}`}
                onMouseEnter={() => handleSelectCategory('archive')}
                onClick={() => handleSelectCategory('archive')}
              >
                <Archive size={15} className="xp-item-icon" />
                <span className="xp-expandable-title">Archive</span>
                <span className="xp-item-badge">{archivedNotes.length}</span>
                <ChevronRight size={13} className="xp-expand-arrow" />
              </button>

              {/* Recycle Bin */}
              <button
                type="button"
                className={`xp-menu-item xp-menu-expandable ${activeCategory === 'trash' ? 'active is-expanded' : ''}`}
                onMouseEnter={() => handleSelectCategory('trash')}
                onClick={() => handleSelectCategory('trash')}
              >
                <Trash2 size={15} className="xp-item-icon trash" />
                <span className="xp-expandable-title">Recycle Bin</span>
                <span className="xp-item-badge">{trashedNotes.length}</span>
                <ChevronRight size={13} className="xp-expand-arrow" />
              </button>
            </div>

            <div className="xp-pane-divider" />

            {/* Group 3: Places & Notebooks */}
            <div className="xp-start-item-group">
              <span className="xp-section-label">Places & Notebooks</span>

              {/* Folders */}
              <div 
                className={`xp-menu-item xp-menu-expandable ${activeCategory === 'folders' ? 'active is-expanded' : ''}`}
                onMouseEnter={() => handleSelectCategory('folders')}
                onClick={() => handleSelectCategory('folders')}
              >
                <Folder size={15} color="#f59e0b" className="xp-item-icon" />
                <span className="xp-expandable-title">Folders</span>
                <span className="xp-item-badge">{folders.length}</span>
                <ChevronRight size={13} className="xp-expand-arrow" />
              </div>

              {/* Notebooks */}
              <div 
                className={`xp-menu-item xp-menu-expandable ${activeCategory === 'books' ? 'active is-expanded' : ''}`}
                onMouseEnter={() => handleSelectCategory('books')}
                onClick={() => handleSelectCategory('books')}
              >
                <BookOpen size={15} color="#3b82f6" className="xp-item-icon" />
                <span className="xp-expandable-title">Notebooks</span>
                <span className="xp-item-badge">{books.length}</span>
                <ChevronRight size={13} className="xp-expand-arrow" />
              </div>
            </div>

            <div className="xp-pane-divider" />

            {/* Group 4: Productivity Apps & Utilities */}
            <div className="xp-start-item-group xp-start-expandables">
              <span className="xp-section-label">Productivity Apps</span>

              <div 
                className={`xp-menu-item xp-menu-expandable ${activeCategory === 'tools' ? 'is-expanded active' : ''}`}
                onMouseEnter={() => handleSelectCategory('tools')}
                onClick={() => handleSelectCategory('tools')}
              >
                <div className="xp-item-icon-box purple-soft">
                  <Sparkles size={14} />
                </div>
                <span className="xp-expandable-title">Tools & Utilities</span>
                <span className="xp-item-badge">8</span>
                <ChevronRight size={14} className="xp-expand-arrow" />
              </div>
            </div>

            <div className="xp-pane-divider" />

            {/* Group 5: System & Settings (Personal Vaults & Profiles moved here) */}
            <div className="xp-start-item-group">
              <span className="xp-section-label">System & Settings</span>

              {/* Personal Vaults (Workspaces) */}
              <div 
                className={`xp-menu-item xp-menu-expandable ${activeCategory === 'workspaces' ? 'active is-expanded' : ''}`}
                onMouseEnter={() => handleSelectCategory('workspaces')}
                onClick={() => handleSelectCategory('workspaces')}
              >
                <span style={{ fontSize: '14px', width: '20px', textAlign: 'center' }}>{activeWorkspace?.icon || '🌿'}</span>
                <span className="xp-expandable-title">Personal Vaults</span>
                <span className="xp-item-badge">{workspaces.length}</span>
                <ChevronRight size={13} className="xp-expand-arrow" />
              </div>

              {/* Profiles & Accounts */}
              <div 
                className={`xp-menu-item xp-menu-expandable ${activeCategory === 'profiles' ? 'active is-expanded' : ''}`}
                onMouseEnter={() => handleSelectCategory('profiles')}
                onClick={() => handleSelectCategory('profiles')}
              >
                <User size={15} color="#6366f1" className="xp-item-icon" />
                <span className="xp-expandable-title">Profiles</span>
                <span className="xp-item-badge">{PRESET_PERSONAS.length}</span>
                <ChevronRight size={13} className="xp-expand-arrow" />
              </div>

              {/* Theme */}
              <div 
                className={`xp-menu-item xp-menu-expandable ${activeCategory === 'appearance' ? 'active is-expanded' : ''}`}
                onMouseEnter={() => handleSelectCategory('appearance')}
                onClick={() => handleSelectCategory('appearance')}
              >
                {theme === 'dark' ? <Moon size={15} className="xp-item-icon" /> : <Sun size={15} className="xp-item-icon" />}
                <span className="xp-expandable-title">Theme</span>
                <ChevronRight size={13} className="xp-expand-arrow" />
              </div>

              {/* Control Panel */}
              <div 
                className={`xp-menu-item xp-menu-expandable ${activeCategory === 'settings' ? 'active is-expanded' : ''}`}
                onMouseEnter={() => handleSelectCategory('settings')}
                onClick={() => handleSelectCategory('settings')}
              >
                <Settings size={15} className="xp-item-icon" />
                <span className="xp-expandable-title">Control Panel</span>
                <ChevronRight size={13} className="xp-expand-arrow" />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* COLUMN 2: DYNAMIC DETAIL PANE (Driven by Active Category)*/}
          {/* ======================================================== */}
          <div className="xp-start-right-pane">
            {/* VIEW 1: All Notes */}
            {activeCategory === 'all' && 
              renderNoteList(activeNotes, 'All Notes', <FileText size={13} color="#818cf8" />, 'No notes in this workspace yet.', 'all')}

            {/* VIEW 2: Starred Notes */}
            {activeCategory === 'favorites' && 
              renderNoteList(favoriteNotes, 'Starred Notes', <Star size={13} color="#fbbf24" />, 'No starred notes yet.', 'favorites')}

            {/* VIEW 3: Recent History */}
            {activeCategory === 'recent' && 
              renderNoteList(recentNotes, 'Recent History', <Clock size={13} color="#38bdf8" />, 'No recent activity.', 'recent')}

            {/* VIEW 4: Archive */}
            {activeCategory === 'archive' && 
              renderNoteList(archivedNotes, 'Archived Notes', <Archive size={13} color="#94a3b8" />, 'Archive is empty.', 'archive')}

            {/* VIEW 5: Recycle Bin */}
            {activeCategory === 'trash' && 
              renderNoteList(trashedNotes, 'Recycle Bin', <Trash2 size={13} color="#ef4444" />, 'Recycle Bin is empty.', 'trash')}

            {/* VIEW 6: Tools & Utilities */}
            {activeCategory === 'tools' && (
              <div className="xp-pane-column-view">
                <div className="xp-col2-header">
                  <div className="xp-col2-title">
                    <Sparkles size={13} color="#8b5cf6" />
                    <span>Tools & Utilities (8)</span>
                  </div>
                  <button
                    type="button"
                    className="xp-col2-back-btn"
                    onClick={() => setActiveCategory('all')}
                    title="Back to All Notes"
                  >
                    <ChevronLeft size={12} />
                    <span>Notes</span>
                  </button>
                </div>

                <div className="xp-col2-list">
                  {onOpenPomodoro && (
                    <button 
                      type="button" 
                      className="xp-col2-item"
                      onClick={() => handleAction(onOpenPomodoro)}
                    >
                      <Timer size={14} color="#ef4444" />
                      <div className="xp-col2-text">
                        <strong>Focus Pomodoro</strong>
                        <span>25m Focus Timer & Audio</span>
                      </div>
                    </button>
                  )}

                  {onOpenTypingMetrics && (
                    <button 
                      type="button" 
                      className="xp-col2-item"
                      onClick={() => handleAction(onOpenTypingMetrics)}
                    >
                      <Keyboard size={14} color="#6366f1" />
                      <div className="xp-col2-text">
                        <strong>Typing Sprint</strong>
                        <span>WPM speed meter & practice</span>
                      </div>
                    </button>
                  )}

                  {onOpenInternalMind && (
                    <button 
                      type="button" 
                      className="xp-col2-item"
                      onClick={() => handleAction(onOpenInternalMind)}
                    >
                      <Brain size={14} color="#8b5cf6" />
                      <div className="xp-col2-text">
                        <strong>Internal Mind</strong>
                        <span>Autonomous knowledge hub</span>
                      </div>
                    </button>
                  )}

                  {onOpenKnowledgeBase && (
                    <button 
                      type="button" 
                      className="xp-col2-item"
                      onClick={() => handleAction(onOpenKnowledgeBase)}
                    >
                      <Network size={14} color="#0ea5e9" />
                      <div className="xp-col2-text">
                        <strong>Knowledge Galaxy</strong>
                        <span>Interactive node network graph</span>
                      </div>
                    </button>
                  )}

                  {onOpenLinkTree && (
                    <button 
                      type="button" 
                      className="xp-col2-item"
                      onClick={() => handleAction(onOpenLinkTree)}
                    >
                      <GitFork size={14} color="#10b981" />
                      <div className="xp-col2-text">
                        <strong>Folder Link Tree</strong>
                        <span>Visual directory hierarchy</span>
                      </div>
                    </button>
                  )}

                  {onOpenDictionary && (
                    <button 
                      type="button" 
                      className="xp-col2-item"
                      onClick={() => handleAction(onOpenDictionary)}
                    >
                      <BookA size={14} color="#f59e0b" />
                      <div className="xp-col2-text">
                        <strong>English Dictionary</strong>
                        <span>Definitions & vocabulary</span>
                      </div>
                    </button>
                  )}

                  {onOpenWebClipper && (
                    <button 
                      type="button" 
                      className="xp-col2-item"
                      onClick={() => handleAction(onOpenWebClipper)}
                    >
                      <Globe size={14} color="#06b6d4" />
                      <div className="xp-col2-text">
                        <strong>Web Clipper</strong>
                        <span>Capture markdown from links</span>
                      </div>
                    </button>
                  )}

                  {onOpenStudyMode && (
                    <button 
                      type="button" 
                      className="xp-col2-item"
                      onClick={() => handleAction(onOpenStudyMode)}
                    >
                      <GraduationCap size={14} color="#ec4899" />
                      <div className="xp-col2-text">
                        <strong>Study Cards (SRS)</strong>
                        <span>Spaced repetition flashcards</span>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* VIEW 7: Folders (with in-column drilldown to notes & back button) */}
            {activeCategory === 'folders' && (
              <div className="xp-pane-column-view">
                {selectedFolderId === null ? (
                  <>
                    <div className="xp-col2-header">
                      <div className="xp-col2-title">
                        <Folder size={13} color="#f59e0b" />
                        <span>Folders ({folders.length})</span>
                      </div>
                      <button
                        type="button"
                        className="xp-col2-back-btn"
                        onClick={() => handleSelectCategory('all')}
                        title="Back to All Notes"
                      >
                        <ChevronLeft size={12} />
                        <span>Notes</span>
                      </button>
                    </div>

                    <div className="xp-col2-list">
                      {folders.length === 0 ? (
                        <div className="xp-col2-empty">No folders created yet</div>
                      ) : (
                        folders.map((folder) => {
                          const folderCount = activeNotes.filter((n) => n.folderId === folder.id).length;
                          return (
                            <button
                              key={folder.id}
                              type="button"
                              className="xp-col2-item"
                              onClick={() => setSelectedFolderId(folder.id)}
                            >
                              <Folder size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
                              <div className="xp-col2-text">
                                <strong>{folder.name}</strong>
                                <span>{folderCount} {folderCount === 1 ? 'note' : 'notes'}</span>
                              </div>
                              <ChevronRight size={13} className="xp-expand-arrow" />
                            </button>
                          );
                        })
                      )}
                    </div>
                  </>
                ) : (
                  // DRILL-DOWN: Notes within the selected folder
                  (() => {
                    const drillFolder = folders.find((f) => f.id === selectedFolderId);
                    const folderNotes = activeNotes.filter((n) => n.folderId === selectedFolderId);
                    return (
                      <>
                        <div className="xp-col2-header">
                          <div className="xp-col2-title">
                            <Folder size={13} color="#f59e0b" />
                            <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {drillFolder?.name || 'Folder'} ({folderNotes.length})
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              type="button"
                              className="xp-col2-back-btn"
                              onClick={() => setSelectedFolderId(null)}
                              title="Back to Folders list"
                            >
                              <ChevronLeft size={12} />
                              <span>Folders</span>
                            </button>
                            <button
                              type="button"
                              className="xp-col2-back-btn"
                              onClick={() => handleAction(() => onSelectFolder(drillFolder?.id || ''))}
                              title="Open folder in notes feed"
                            >
                              <span>Feed</span>
                              <ChevronRight size={11} />
                            </button>
                          </div>
                        </div>

                        <div className="xp-col2-list">
                          {folderNotes.length === 0 ? (
                            <div className="xp-col2-empty">No notes in this folder yet</div>
                          ) : (
                            folderNotes.map((note) => (
                              <button
                                key={note.id}
                                type="button"
                                className="xp-col2-item"
                                onClick={() => handleAction(() => onSelectNote?.(note.id))}
                                title={note.title || 'Untitled Note'}
                              >
                                <FileText size={14} color="#818cf8" style={{ flexShrink: 0 }} />
                                <div className="xp-col2-text">
                                  <strong>{note.title || 'Untitled Note'}</strong>
                                  <span>
                                    {formatRelativeTime(note.updatedAt)}
                                    {note.tags && note.tags.length > 0 ? ` · #${note.tags[0]}` : ''}
                                  </span>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    );
                  })()
                )}
              </div>
            )}

            {/* VIEW 8: Notebooks (with in-column drilldown to pages & back button) */}
            {activeCategory === 'books' && (
              <div className="xp-pane-column-view">
                {selectedBookId === null ? (
                  <>
                    <div className="xp-col2-header">
                      <div className="xp-col2-title">
                        <BookOpen size={13} color="#3b82f6" />
                        <span>Notebooks ({books.length})</span>
                      </div>
                      <button
                        type="button"
                        className="xp-col2-back-btn"
                        onClick={() => handleSelectCategory('all')}
                        title="Back to All Notes"
                      >
                        <ChevronLeft size={12} />
                        <span>Notes</span>
                      </button>
                    </div>

                    <div className="xp-col2-list">
                      {books.length === 0 ? (
                        <div className="xp-col2-empty">No books created yet</div>
                      ) : (
                        books.map((book) => {
                          const bookPages = notes.filter((n) => n.bookId === book.id && !n.isTrashed);
                          return (
                            <button
                              key={book.id}
                              type="button"
                              className="xp-col2-item"
                              onClick={() => setSelectedBookId(book.id)}
                            >
                              <span style={{ fontSize: '14px', flexShrink: 0 }}>{book.icon || '📖'}</span>
                              <div className="xp-col2-text">
                                <strong>{book.title}</strong>
                                <span>{bookPages.length} {bookPages.length === 1 ? 'page' : 'pages'}</span>
                              </div>
                              <ChevronRight size={13} className="xp-expand-arrow" />
                            </button>
                          );
                        })
                      )}
                    </div>
                  </>
                ) : (
                  // DRILL-DOWN: Pages within the selected notebook
                  (() => {
                    const drillBook = books.find((b) => b.id === selectedBookId);
                    const bookPages = notes.filter((n) => n.bookId === selectedBookId && !n.isTrashed);
                    return (
                      <>
                        <div className="xp-col2-header">
                          <div className="xp-col2-title">
                            <span style={{ fontSize: '13px' }}>{drillBook?.icon || '📖'}</span>
                            <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {drillBook?.title || 'Notebook'} ({bookPages.length})
                            </span>
                          </div>
                          <button
                            type="button"
                            className="xp-col2-back-btn"
                            onClick={() => setSelectedBookId(null)}
                            title="Back to Notebooks list"
                          >
                            <ChevronLeft size={12} />
                            <span>Books</span>
                          </button>
                        </div>

                        <div className="xp-col2-list">
                          {bookPages.length === 0 ? (
                            <div className="xp-col2-empty">No pages in this notebook</div>
                          ) : (
                            bookPages.map((note) => (
                              <button
                                key={note.id}
                                type="button"
                                className="xp-col2-item"
                                onClick={() => handleAction(() => onSelectNote?.(note.id))}
                                title={note.title || 'Untitled Note'}
                              >
                                <FileText size={14} color="#3b82f6" style={{ flexShrink: 0 }} />
                                <div className="xp-col2-text">
                                  <strong>{note.title || 'Untitled Note'}</strong>
                                  <span>
                                    {formatRelativeTime(note.updatedAt)}
                                    {note.tags && note.tags.length > 0 ? ` · #${note.tags[0]}` : ''}
                                  </span>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    );
                  })()
                )}
              </div>
            )}

            {/* VIEW 9: Personal Vaults (Workspaces) */}
            {activeCategory === 'workspaces' && (
              <div className="xp-pane-column-view">
                <div className="xp-col2-header">
                  <div className="xp-col2-title">
                    <HardDrive size={13} color="#8b5cf6" />
                    <span>Personal Vaults ({workspaces.length})</span>
                  </div>
                  <button
                    type="button"
                    className="xp-col2-back-btn"
                    onClick={() => setActiveCategory('all')}
                    title="Back to All Notes"
                  >
                    <ChevronLeft size={12} />
                    <span>Notes</span>
                  </button>
                </div>

                <div className="xp-col2-list">
                  {workspaces.map((ws) => {
                    const isSelected = ws.id === activeWorkspaceId;
                    return (
                      <button
                        key={ws.id}
                        type="button"
                        className={`xp-col2-item ${isSelected ? 'active' : ''}`}
                        onClick={() => handleAction(() => onSelectWorkspace(ws.id))}
                      >
                        <span style={{ fontSize: '15px', flexShrink: 0 }}>{ws.icon || '🌿'}</span>
                        <div className="xp-col2-text">
                          <strong>{ws.name}</strong>
                          {ws.description && <span>{ws.description}</span>}
                        </div>
                        {isSelected && <span className="xp-persona-active-badge">Active</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW: Profiles & Personas */}
            {activeCategory === 'profiles' && (
              <div className="xp-pane-column-view">
                <div className="xp-col2-header">
                  <div className="xp-col2-title">
                    <User size={13} color="#6366f1" />
                    <span>Profiles & Personas</span>
                  </div>
                  <button
                    type="button"
                    className="xp-col2-back-btn"
                    onClick={() => setActiveCategory('all')}
                    title="Back to All Notes"
                  >
                    <ChevronLeft size={12} />
                    <span>Notes</span>
                  </button>
                </div>

                <div className="xp-col2-list">
                  {PRESET_PERSONAS.map((p) => {
                    const isCurrent = currentName === p.name;
                    return (
                      <button
                        key={p.name}
                        type="button"
                        className={`xp-col2-item ${isCurrent ? 'active' : ''}`}
                        onClick={() => {
                          if (onUpdateProfile) {
                            onUpdateProfile({
                              name: p.name,
                              role: p.role,
                              avatarType: p.avatarType,
                              avatarValue: p.avatarValue,
                              mood: p.mood,
                              bio: p.bio
                            });
                          }
                        }}
                      >
                        <span style={{ fontSize: '15px', flexShrink: 0 }}>{p.avatarValue}</span>
                        <div className="xp-col2-text">
                          <strong>{p.name}</strong>
                          <span>{p.role} · {p.mood}</span>
                        </div>
                        {isCurrent && <span className="xp-persona-active-badge">Active</span>}
                      </button>
                    );
                  })}

                  <div className="xp-pane-divider" style={{ margin: '4px 0' }} />

                  <button
                    type="button"
                    className="xp-col2-item"
                    onClick={() => handleAction(() => onOpenSettings?.('profile'))}
                  >
                    <User size={14} color="#6366f1" />
                    <div className="xp-col2-text">
                      <strong>Identity & Profile</strong>
                      <span>Edit bio, avatar, and work mode</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="xp-col2-item"
                    onClick={() => handleAction(() => onOpenSettings?.('security'))}
                  >
                    <ShieldCheck size={14} color="#10b981" />
                    <div className="xp-col2-text">
                      <strong>Accounts & Security</strong>
                      <span>Personas, PIN lock, zero-knowledge</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 10: Themes */}
            {activeCategory === 'appearance' && (
              <div className="xp-pane-column-view">
                <div className="xp-col2-header">
                  <div className="xp-col2-title">
                    <span>Select Theme</span>
                  </div>
                  <button
                    type="button"
                    className="xp-col2-back-btn"
                    onClick={() => setActiveCategory('all')}
                    title="Back to All Notes"
                  >
                    <ChevronLeft size={12} />
                    <span>Notes</span>
                  </button>
                </div>

                <div className="xp-col2-list">
                  <button
                    type="button"
                    className={`xp-col2-item ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => handleAction(() => onChangeTheme?.('dark'))}
                  >
                    <Moon size={14} color="#6366f1" />
                    <div className="xp-col2-text">
                      <strong>Dark Mode</strong>
                      <span>Midnight obsidian aesthetic</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`xp-col2-item ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => handleAction(() => onChangeTheme?.('light'))}
                  >
                    <Sun size={14} color="#f59e0b" />
                    <div className="xp-col2-text">
                      <strong>Light Mode</strong>
                      <span>Clean paper daylight aesthetic</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 11: Control Panel / Settings */}
            {activeCategory === 'settings' && (
              <div className="xp-pane-column-view">
                <div className="xp-col2-header">
                  <div className="xp-col2-title">
                    <Settings size={13} color="#6366f1" />
                    <span>Control Panel</span>
                  </div>
                  <button
                    type="button"
                    className="xp-col2-back-btn"
                    onClick={() => setActiveCategory('all')}
                    title="Back to All Notes"
                  >
                    <ChevronLeft size={12} />
                    <span>Notes</span>
                  </button>
                </div>

                <div className="xp-col2-list">
                  <button
                    type="button"
                    className="xp-col2-item"
                    onClick={() => handleAction(() => onOpenSettings?.('profile'))}
                  >
                    <User size={14} color="#6366f1" />
                    <div className="xp-col2-text">
                      <strong>Identity & Profile</strong>
                      <span>Name, bio, avatar, and work mode</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="xp-col2-item"
                    onClick={() => handleAction(() => onOpenSettings?.('security'))}
                  >
                    <ShieldCheck size={14} color="#10b981" />
                    <div className="xp-col2-text">
                      <strong>Accounts & Security</strong>
                      <span>Personas, PIN lock, zero-knowledge</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="xp-col2-item"
                    onClick={() => handleAction(() => onOpenSettings?.('appearance'))}
                  >
                    <Sun size={14} color="#f59e0b" />
                    <div className="xp-col2-text">
                      <strong>Themes & Typography</strong>
                      <span>Colors, fonts, and UI layout</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="xp-col2-item"
                    onClick={() => handleAction(() => onOpenSettings?.('controls'))}
                  >
                    <Keyboard size={14} color="#3b82f6" />
                    <div className="xp-col2-text">
                      <strong>Hotkeys & Mouse</strong>
                      <span>Keyboard shortcuts and navigation</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="xp-col2-item"
                    onClick={() => handleAction(() => onOpenSettings?.('backup'))}
                  >
                    <HardDrive size={14} color="#8b5cf6" />
                    <div className="xp-col2-text">
                      <strong>Backup & Vault</strong>
                      <span>Export, import, and data safety</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="xp-col2-item"
                    onClick={() => handleAction(() => onOpenSettings?.('tutorial'))}
                  >
                    <HelpCircle size={14} color="#ec4899" />
                    <div className="xp-col2-text">
                      <strong>Tutorial & Help</strong>
                      <span>Workstation guide and FAQ</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM FOOTER (Classic XP Log Off / Shut Down Buttons) */}
        <div className="xp-start-footer">
          <button
            type="button"
            className="xp-footer-btn"
            onClick={() => handleAction(() => onOpenSettings?.('profile'))}
            title="Log off or switch profile"
          >
            <div className="xp-footer-icon-wrap logoff">
              <LogOut size={13} />
            </div>
            <span>Switch Profile</span>
          </button>

          <button
            type="button"
            className="xp-footer-btn"
            onClick={() => {
              onClose();
              if (onToggleCollapse) onToggleCollapse();
            }}
            title="Expand to Full Sidebar"
          >
            <div className="xp-footer-icon-wrap shutdown">
              <PanelLeftOpen size={13} />
            </div>
            <span>Expand Sidebar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
