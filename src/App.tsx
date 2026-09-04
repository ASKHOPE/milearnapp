import React, { useState, useEffect, useMemo } from 'react';
import { type Note, type Folder, type ViewFilter, type ThemeMode, type Workspace, type Book, type PomodoroMode, type UserProfile, DEFAULT_USER_PROFILE } from './types';
import { storage } from './services/storage';
import { inactivityLockManager } from './services/inactivityLock';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { InactivityOverlay } from './components/InactivityOverlay';
import { SplitWindowManager } from './components/editor/SplitWindowManager';
import { NOTE_TEMPLATES } from './services/templates';
import { AppModals } from './components/AppModals';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import './styles/main.css';

const generateNoteId = (): string => 'n-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

export const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [books, setBooks] = useState<Book[]>([]);

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('ws-personal');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [secondaryNoteId, setSecondaryNoteId] = useState<string | null>(null);
  const [openNoteIds, setOpenNoteIds] = useState<string[]>([]);
  const [rightOpenNoteIds, setRightOpenNoteIds] = useState<string[]>([]);
  const [activeSplitSide, setActiveSplitSide] = useState<'left' | 'right'>('left');

  // Filters & Navigation
  const [currentFilter, setCurrentFilter] = useState<ViewFilter>('all');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isNotesCollapsed, setIsNotesCollapsed] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Modals, Study, Inactivity & Focus
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isKnowledgeBaseOpen, setIsKnowledgeBaseOpen] = useState(false);
  const [isInternalMindOpen, setIsInternalMindOpen] = useState(false);
  const [isLinkTreeOpen, setIsLinkTreeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<string>('profile');
  const [isStudyModeOpen, setIsStudyModeOpen] = useState(false);
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [isTypingMetricsOpen, setIsTypingMetricsOpen] = useState(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [isWebClipperOpen, setIsWebClipperOpen] = useState(false);
  const [isVaultLockedDueToInactivity, setIsVaultLockedDueToInactivity] = useState(false);
  const [pomodoroSecondsLeft, setPomodoroSecondsLeft] = useState(25 * 60);
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<PomodoroMode>('work');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const notesCountByWorkspace = useMemo(() => {
    const map = new Map<string, number>();
    notes.forEach((n) => {
      if (!n.isTrashed) {
        const wsId = n.workspaceId || 'ws-personal';
        map.set(wsId, (map.get(wsId) || 0) + 1);
      }
    });
    return map;
  }, [notes]);

  // Initialize DB & Seed Data
  useEffect(() => {
    async function loadData() {
      try {
        const savedTheme = storage.getTheme();
        setTheme(savedTheme);
        storage.setTheme(savedTheme);

        const savedTypography = storage.getTypographySettings();
        storage.setTypographySettings(savedTypography);

        const savedProfile = storage.getUserProfile();
        setUserProfile(savedProfile);

        const micPref = storage.isMicEnabled();
        setIsMicEnabled(micPref);

        const savedWsId = storage.getActiveWorkspaceId();
        setActiveWorkspaceId(savedWsId);

        const data = await storage.init();
        setNotes(data.notes);
        setFolders(data.folders);
        setWorkspaces(data.workspaces);
        setBooks(data.books);

        // Pick initial note belonging to active workspace
        const wsNotes = data.notes.filter((n) => (n.workspaceId || 'ws-personal') === savedWsId && !n.isTrashed);
        if (wsNotes.length > 0) {
          setSelectedNoteId(wsNotes[0].id);
          setOpenNoteIds([wsNotes[0].id]);
        }
      } catch (err) {
        console.error('Failed to initialize Noteflow database:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // System Dark Theme Auto-Sync Listener
  useEffect(() => {
    if (theme !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMql = () => {
      storage.setTheme('system');
    };
    mql.addEventListener('change', handleMql);
    return () => mql.removeEventListener('change', handleMql);
  }, [theme]);

  // Inactivity Auto-Lock Listener
  useEffect(() => {
    inactivityLockManager.start(() => {
      setIsVaultLockedDueToInactivity(true);
    });
    return () => inactivityLockManager.stop();
  }, []);

  // Dynamic Keyboard Shortcuts via useGlobalShortcuts
  useGlobalShortcuts({
    onToggleSearch: () => setIsSearchOpen((prev) => !prev),
    onCreateNote: () => { handleCreateNote(); },
    onCloseTab: () => {
      if (selectedNoteId) handleCloseTab(selectedNoteId);
    },
    onToggleStudyMode: () => setIsStudyModeOpen((prev) => !prev),
    onTogglePomodoro: () => setIsPomodoroOpen((prev) => !prev),
    onToggleZenMode: () => setIsZenMode((prev) => !prev),
    onToggleSettings: () => setIsSettingsOpen((prev) => !prev),
    onCreateQuickNote: () => { handleCreateQuickNote(); },
    onEscape: () => {
      setIsSearchOpen(false);
      setIsKnowledgeBaseOpen(false);
      setIsInternalMindOpen(false);
      setIsLinkTreeOpen(false);
      setIsSettingsOpen(false);
      setIsStudyModeOpen(false);
      setIsPomodoroOpen(false);
      setIsLibraryOpen(false);
      setIsWebClipperOpen(false);
      setIsZenMode(false);
    },
  });

  // Multi-Theme Toggle: System -> Day -> Night -> OLED Obsidian -> Tokyo Midnight -> Nordic Frost -> Warm Editorial
  const handleToggleTheme = () => {
    const themes: ThemeMode[] = ['system', 'light', 'dark', 'oled', 'tokyo', 'nordic', 'editorial'];
    const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    setTheme(nextTheme);
    storage.setTheme(nextTheme);
  };

  const handleChangeTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    storage.setTheme(newTheme);
  };

  // Mic Privacy Handler
  const handleToggleMic = (enabled: boolean) => {
    setIsMicEnabled(enabled);
    storage.setMicEnabled(enabled);
  };

  // Open note in tab (left pane / primary)
  const handleOpenNote = (noteId: string) => {
    setSelectedNoteId(noteId);
    setOpenNoteIds((prev) => (prev.includes(noteId) ? prev : [...prev, noteId]));
    setActiveSplitSide('left');
  };

  // Open note targeting currently active pane in split mode
  const handleOpenNoteInActivePane = (noteId: string) => {
    if (secondaryNoteId && activeSplitSide === 'right') {
      setSecondaryNoteId(noteId);
      setRightOpenNoteIds((prev) => (prev.includes(noteId) ? prev : [...prev, noteId]));
    } else {
      setSelectedNoteId(noteId);
      setOpenNoteIds((prev) => (prev.includes(noteId) ? prev : [...prev, noteId]));
      setActiveSplitSide('left');
    }
  };

  // Close tab on Left Pane
  const handleCloseLeftTab = (noteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextTabs = openNoteIds.filter((id) => id !== noteId);
    setOpenNoteIds(nextTabs);
    if (selectedNoteId === noteId) {
      setSelectedNoteId(nextTabs.length > 0 ? nextTabs[nextTabs.length - 1] : null);
    }
  };

  // Close tab from both/active panes (used by shortcuts, trash, delete)
  const handleCloseTab = (noteId: string, e?: React.MouseEvent) => {
    handleCloseLeftTab(noteId, e);
    handleCloseRightTab(noteId, e);
  };

  // Select tab on Right Pane
  const handleSelectRightTab = (noteId: string) => {
    setSecondaryNoteId(noteId);
    setRightOpenNoteIds((prev) => (prev.includes(noteId) ? prev : [...prev, noteId]));
    setActiveSplitSide('right');
  };

  // Close tab on Right Pane
  const handleCloseRightTab = (noteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextTabs = rightOpenNoteIds.filter((id) => id !== noteId);
    setRightOpenNoteIds(nextTabs);
    if (secondaryNoteId === noteId) {
      if (nextTabs.length > 0) {
        setSecondaryNoteId(nextTabs[nextTabs.length - 1]);
      } else {
        setSecondaryNoteId(null);
        setActiveSplitSide('left');
      }
    }
  };

  // Move Tab from Left Pane to Right Pane (or open Split View)
  const handleMoveLeftTabToRight = (noteId: string, targetIndex?: number) => {
    const nextLeftTabs = openNoteIds.filter((id) => id !== noteId);
    setOpenNoteIds(nextLeftTabs);
    if (selectedNoteId === noteId) {
      setSelectedNoteId(nextLeftTabs.length > 0 ? nextLeftTabs[nextLeftTabs.length - 1] : null);
    }

    setRightOpenNoteIds((prev) => {
      const filtered = prev.filter((id) => id !== noteId);
      if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= filtered.length) {
        const copy = [...filtered];
        copy.splice(targetIndex, 0, noteId);
        return copy;
      }
      return [...filtered, noteId];
    });
    setSecondaryNoteId(noteId);
    setActiveSplitSide('right');
  };

  // Move Tab from Right Pane to Left Pane
  const handleMoveRightTabToLeft = (noteId: string, targetIndex?: number) => {
    const nextRightTabs = rightOpenNoteIds.filter((id) => id !== noteId);
    setRightOpenNoteIds(nextRightTabs);
    if (secondaryNoteId === noteId) {
      if (nextRightTabs.length > 0) {
        setSecondaryNoteId(nextRightTabs[nextRightTabs.length - 1]);
      } else {
        setSecondaryNoteId(null);
        setActiveSplitSide('left');
      }
    }

    setOpenNoteIds((prev) => {
      const filtered = prev.filter((id) => id !== noteId);
      if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= filtered.length) {
        const copy = [...filtered];
        copy.splice(targetIndex, 0, noteId);
        return copy;
      }
      return [...filtered, noteId];
    });
    setSelectedNoteId(noteId);
    setActiveSplitSide('left');
  };

  // Create new note on Right Pane
  const handleNewRightTab = async () => {
    let targetFolder = currentFolderId;
    if (!targetFolder) {
      targetFolder = await ensureUncategorizedFolder(activeWorkspaceId);
    }

    const newNote: Note = {
      id: generateNoteId(),
      title: 'Untitled Note',
      content: '',
      folderId: targetFolder,
      workspaceId: activeWorkspaceId,
      tags: selectedTag ? [selectedTag] : [],
      isFavorite: false,
      isPinned: false,
      isArchived: false,
      isTrashed: false,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setNotes((prev) => [newNote, ...prev]);
    setSecondaryNoteId(newNote.id);
    setRightOpenNoteIds((prev) => (prev.includes(newNote.id) ? prev : [...prev, newNote.id]));
    setActiveSplitSide('right');
    await storage.saveNote(newNote);
  };

  // Switch Active Workspace
  const handleSelectWorkspace = (wsId: string) => {
    setActiveWorkspaceId(wsId);
    storage.setActiveWorkspaceId(wsId);
    setCurrentFolderId(null);
    setSelectedTag(null);
    setCurrentFilter('all');

    // Pick first note in the selected workspace
    const wsNotes = notes.filter((n) => (n.workspaceId || 'ws-personal') === wsId && !n.isTrashed);
    if (wsNotes.length > 0) {
      setSelectedNoteId(wsNotes[0].id);
      setOpenNoteIds([wsNotes[0].id]);
    } else {
      setSelectedNoteId(null);
      setOpenNoteIds([]);
    }
    setSecondaryNoteId(null);
    setRightOpenNoteIds([]);
    setActiveSplitSide('left');
  };

  // Create New Workspace
  const handleCreateWorkspace = async (name: string, icon: string, color: string, description: string) => {
    const newWs: Workspace = {
      id: 'ws-' + Date.now().toString(36),
      name,
      icon,
      color,
      description,
      createdAt: new Date().toISOString()
    };
    const updated = [...workspaces, newWs];
    setWorkspaces(updated);
    await storage.saveWorkspace(newWs);
    handleSelectWorkspace(newWs.id);
  };

  // Delete Workspace
  const handleDeleteWorkspace = async (id: string) => {
    if (workspaces.length <= 1) return;
    const remaining = workspaces.filter((w) => w.id !== id);
    setWorkspaces(remaining);
    await storage.deleteWorkspace(id);
    handleSelectWorkspace(remaining[0].id);
  };

  // Books Handlers
  const handleCreateBook = async (title: string, icon: string, color: string) => {
    const newBook: Book = {
      id: 'book-' + Date.now().toString(36),
      workspaceId: activeWorkspaceId,
      title,
      icon,
      color,
      createdAt: new Date().toISOString()
    };
    setBooks((prev) => [...prev, newBook]);
    await storage.saveBook(newBook);
  };

  const handleDeleteBook = async (bookId: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    // Clear bookId from notes
    setNotes((prev) => prev.map((n) => (n.bookId === bookId ? { ...n, bookId: null } : n)));
    await storage.deleteBook(bookId);
  };

  const handleAddPageToBook = async (bookId: string) => {
    const bookObj = books.find((b) => b.id === bookId);
    const existingPages = notes.filter((n) => n.bookId === bookId);
    const pageNum = existingPages.length + 1;

    const newPageNote: Note = {
      id: 'n-page-' + Date.now().toString(36),
      title: `${bookObj?.title || 'Book'} — Chapter ${pageNum}`,
      content: `# Chapter ${pageNum}: [Title]\n\nWrite chapter content here...`,
      folderId: null,
      workspaceId: activeWorkspaceId,
      bookId,
      pageOrder: pageNum,
      tags: ['book', 'page'],
      isFavorite: false,
      isPinned: false,
      isArchived: false,
      isTrashed: false,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setNotes((prev) => [newPageNote, ...prev]);
    handleOpenNote(newPageNote.id);
    await storage.saveNote(newPageNote);
  };

  // Note Handlers: Auto-assign unassigned notes to "Uncategorized" folder
  const ensureUncategorizedFolder = async (wsId: string): Promise<string> => {
    let uncatFolder = folders.find(
      (f) => (f.workspaceId || 'ws-personal') === wsId && f.name.toLowerCase() === 'uncategorized'
    );
    if (!uncatFolder) {
      uncatFolder = {
        id: 'f-uncat-' + wsId,
        workspaceId: wsId,
        name: 'Uncategorized',
        parentId: null,
        color: '#64748b',
        icon: 'folder',
        createdAt: new Date().toISOString()
      };
      setFolders((prev) => [...prev, uncatFolder!]);
      await storage.saveFolder(uncatFolder);
    }
    return uncatFolder.id;
  };

  const handleCreateNote = async () => {
    let targetFolder = currentFolderId;
    if (!targetFolder) {
      targetFolder = await ensureUncategorizedFolder(activeWorkspaceId);
    }

    const newNote: Note = {
      id: 'n-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      title: 'Untitled Note',
      content: '',
      folderId: targetFolder,
      workspaceId: activeWorkspaceId,
      tags: selectedTag ? [selectedTag] : [],
      isFavorite: false,
      isPinned: false,
      isArchived: false,
      isTrashed: false,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setNotes((prev) => [newNote, ...prev]);
    handleOpenNote(newNote.id);
    await storage.saveNote(newNote);
  };

  // Instant Quick Note Scratchpad
  const handleCreateQuickNote = async () => {
    const timeStr = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const targetFolder = await ensureUncategorizedFolder(activeWorkspaceId);

    const quickNote: Note = {
      id: 'n-quick-' + Date.now().toString(36),
      title: `⚡ Quick Scratchpad (${dateStr}, ${timeStr})`,
      content: `# ⚡ Quick Scratchpad\n\n- [ ] `,
      folderId: targetFolder,
      workspaceId: activeWorkspaceId,
      tags: ['quick-note'],
      isFavorite: false,
      isPinned: false,
      isArchived: false,
      isTrashed: false,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setNotes((prev) => [quickNote, ...prev]);
    handleOpenNote(quickNote.id);
    await storage.saveNote(quickNote);
  };

  // Duplicate Note Handler
  const handleDuplicateNote = async (sourceNote: Note) => {
    const cloned: Note = {
      ...sourceNote,
      id: 'n-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      title: `${sourceNote.title || 'Untitled Note'} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setNotes((prev) => [cloned, ...prev]);
    handleOpenNote(cloned.id);
    await storage.saveNote(cloned);
  };

  // Move Note Handler
  const handleMoveNote = async (noteId: string, folderId: string | null, bookId: string | null) => {
    const updatedNotes = notes.map((n) =>
      n.id === noteId ? { ...n, folderId, bookId, updatedAt: new Date().toISOString() } : n
    );
    setNotes(updatedNotes);
    const target = updatedNotes.find((n) => n.id === noteId);
    if (target) await storage.saveNote(target);
  };

  // Duplicate Book Handler
  const handleDuplicateBook = async (sourceBook: Book) => {
    const newBookId = 'b-' + Date.now().toString(36);
    const clonedBook: Book = {
      ...sourceBook,
      id: newBookId,
      title: `${sourceBook.title} (Copy)`,
      createdAt: new Date().toISOString()
    };
    setBooks((prev) => [...prev, clonedBook]);
    await storage.saveBook(clonedBook);

    // Also clone all pages belonging to the book
    const pages = notes.filter((n) => n.bookId === sourceBook.id);
    for (const page of pages) {
      const clonedPage: Note = {
        ...page,
        id: 'n-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
        bookId: newBookId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setNotes((prev) => [clonedPage, ...prev]);
      await storage.saveNote(clonedPage);
    }
  };

  // Split View Handlers
  const handleOpenNoteSplit = (noteId: string) => {
    setSecondaryNoteId(noteId);
    setRightOpenNoteIds((prev) => (prev.includes(noteId) ? prev : [...prev, noteId]));
    setActiveSplitSide('right');
  };

  const handleCloseSplit = () => {
    // Combine all open tabs from the right pane into the primary openNoteIds without duplicates
    setOpenNoteIds((prev) => {
      const combined = [...prev];
      for (const id of rightOpenNoteIds) {
        if (!combined.includes(id)) {
          combined.push(id);
        }
      }
      return combined;
    });

    // If right pane was actively focused, make that note active in the single editor view
    if (activeSplitSide === 'right' && secondaryNoteId) {
      setSelectedNoteId(secondaryNoteId);
    }

    setSecondaryNoteId(null);
    setRightOpenNoteIds([]);
    setActiveSplitSide('left');
  };

  // Exit Note Handler
  const handleCloseNote = () => {
    setSelectedNoteId(null);
  };

  const handleOpenTodayNote = async () => {
    const todayFormatted = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const todayTitle = `📅 Daily Focus — ${todayFormatted}`;
    const todayDatePrefix = new Date().toISOString().slice(0, 10);

    const existing = notes.find((n) => 
      (n.workspaceId || 'ws-personal') === activeWorkspaceId && 
      !n.isTrashed &&
      (n.title.includes(todayDatePrefix) || n.title.includes(todayFormatted))
    );

    if (existing) {
      handleOpenNote(existing.id);
      return;
    }

    const templateContent = NOTE_TEMPLATES.find((t) => t.id === 'daily')?.content || '';
    const newDailyNote: Note = {
      id: 'n-daily-' + Date.now().toString(36),
      title: todayTitle,
      content: templateContent,
      folderId: currentFolderId || null,
      workspaceId: activeWorkspaceId,
      tags: ['daily', 'journal'],
      isFavorite: true,
      isPinned: true,
      isArchived: false,
      isTrashed: false,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setNotes((prev) => [newDailyNote, ...prev]);
    handleOpenNote(newDailyNote.id);
    await storage.saveNote(newDailyNote);
  };

  const handleSelectDate = (dateStr: string) => {
    const found = notes.find((n) => 
      (n.workspaceId || 'ws-personal') === activeWorkspaceId && 
      !n.isTrashed && 
      (n.createdAt.startsWith(dateStr) || n.title.includes(dateStr))
    );
    if (found) {
      handleOpenNote(found.id);
    } else {
      setCurrentFilter('all');
      setCurrentFolderId(null);
    }
  };

  const handleUpdateNote = async (updatedNote: Note) => {
    setNotes((prevNotes) =>
      prevNotes.map((n) => (n.id === updatedNote.id ? updatedNote : n))
    );
    await storage.saveNote(updatedNote);
  };

  // Lifecycle: Soft Delete to Trash
  const handleSoftDeleteNote = async (noteId: string) => {
    const target = notes.find((n) => n.id === noteId);
    if (!target) return;

    if (target.isTrashed) {
      handlePermanentDeleteNote(noteId);
      return;
    }

    const updated = {
      ...target,
      isTrashed: true,
      trashedAt: new Date().toISOString()
    };
    handleUpdateNote(updated);
    handleCloseTab(noteId);
  };

  // Lifecycle: Restore Note from Trash
  const handleRestoreNote = async (noteId: string) => {
    const target = notes.find((n) => n.id === noteId);
    if (!target) return;

    const updated = {
      ...target,
      isTrashed: false,
      trashedAt: null
    };
    handleUpdateNote(updated);
    handleOpenNote(noteId);
  };

  // Lifecycle: Permanent Delete
  const handlePermanentDeleteNote = async (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    handleCloseTab(noteId);
    await storage.deleteNote(noteId);
  };

  // Lifecycle: Empty Trash
  const handleEmptyTrash = async () => {
    if (!confirm('Are you sure you want to permanently delete all notes in the Trash?')) return;
    setNotes((prev) => prev.filter((n) => !n.isTrashed));
    await storage.emptyTrash();
  };

  // Lifecycle: Archive / Unarchive
  const handleToggleArchiveNote = async (noteId: string) => {
    const target = notes.find((n) => n.id === noteId);
    if (!target) return;

    const updated = {
      ...target,
      isArchived: !target.isArchived
    };
    handleUpdateNote(updated);
  };

  const handleToggleFavorite = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = notes.find((n) => n.id === noteId);
    if (!target) return;

    const updated = { ...target, isFavorite: !target.isFavorite };
    handleUpdateNote(updated);
  };

  // Navigation Wiki-link Handler
  const handleNavigateToNote = (noteTitle: string) => {
    const target = notes.find(
      (n) => (n.workspaceId || 'ws-personal') === activeWorkspaceId &&
             !n.isTrashed &&
             n.title.trim().toLowerCase() === noteTitle.trim().toLowerCase()
    );
    if (target) {
      handleOpenNote(target.id);
    } else {
      const newLinkedNote: Note = {
        id: 'n-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
        title: noteTitle,
        content: `# ${noteTitle}\n\nConnected from previous note.`,
        folderId: currentFolderId || null,
        workspaceId: activeWorkspaceId,
        tags: [],
        isFavorite: false,
        isPinned: false,
        isArchived: false,
        isTrashed: false,
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setNotes((prev) => [newLinkedNote, ...prev]);
      handleOpenNote(newLinkedNote.id);
      storage.saveNote(newLinkedNote);
    }
  };

  // Folder Handlers
  const handleCreateFolder = async (name: string, parentId: string | null = null) => {
    const colors = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newFolder: Folder = {
      id: 'f-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      workspaceId: activeWorkspaceId,
      name,
      parentId,
      color: randomColor,
      icon: 'folder',
      createdAt: new Date().toISOString()
    };

    setFolders((prev) => [...prev, newFolder]);
    await storage.saveFolder(newFolder);
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    const updatedFolders = folders.map((f) =>
      f.id === folderId ? { ...f, name: newName } : f
    );
    setFolders(updatedFolders);
    const target = updatedFolders.find((f) => f.id === folderId);
    if (target) await storage.saveFolder(target);
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Delete this folder? Notes inside will become unfiled.')) return;

    setNotes((prev) =>
      prev.map((n) => (n.folderId === folderId ? { ...n, folderId: null } : n))
    );

    setFolders((prev) => prev.filter((f) => f.id !== folderId && f.parentId !== folderId));
    if (currentFolderId === folderId) setCurrentFolderId(null);
    await storage.deleteFolder(folderId);
  };

  // Export / Backup & Import (.noteflow)
  const handleExportData = async () => {
    const dataStr = await storage.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `noteflow-vault-${new Date().toISOString().slice(0, 10)}.noteflow`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const restored = await storage.importAllData(text);
      setNotes(restored.notes);
      setFolders(restored.folders);
      setWorkspaces(restored.workspaces);
      setBooks(restored.books);
      if (restored.notes.length > 0) {
        handleOpenNote(restored.notes[0].id);
      }
      alert('Local vault restored successfully!');
    } catch (err: any) {
      alert('Failed to import file: ' + err.message);
    }
  };

  const handleReseedTutorialVault = async () => {
    const seeded = await storage.reseedTutorialVault();
    setNotes(seeded.notes);
    setFolders(seeded.folders);
    setWorkspaces(seeded.workspaces);
    setBooks(seeded.books);
    setActiveWorkspaceId('ws-personal');
    setSelectedNoteId('n-welcome');
    setOpenNoteIds(['n-welcome']);
    setCurrentFolderId(null);
    setCurrentFilter('all');
  };

  // Active Workspace Filtering
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const workspaceNotes = notes.filter((n) => (n.workspaceId || 'ws-personal') === activeWorkspaceId);
  const workspaceFolders = folders.filter((f) => (f.workspaceId || 'ws-personal') === activeWorkspaceId);
  const workspaceBooks = books.filter((b) => (b.workspaceId || 'ws-work') === activeWorkspaceId);

  const currentNote = notes.find((n) => n.id === selectedNoteId) || null;

  if (isLoading) {
    return (
      <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading MiLEARNAPP...</p>
      </div>
    );
  }

  return (
    <div className={`app-container ${isZenMode ? 'zen-mode' : ''}`}>
      {/* Top Header Navigation */}
      <Header
        theme={theme}
        activeWorkspace={activeWorkspace}
        userProfile={userProfile}
        pomodoroSecondsLeft={pomodoroSecondsLeft}
        isPomodoroRunning={isPomodoroRunning}
        pomodoroMode={pomodoroMode}
        onToggleTheme={handleToggleTheme}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenKnowledgeBase={() => setIsKnowledgeBaseOpen(true)}
        onOpenInternalMind={() => setIsInternalMindOpen(true)}
        onOpenLinkTree={() => setIsLinkTreeOpen(true)}
        onOpenProfile={() => { setSettingsInitialTab('profile'); setIsSettingsOpen(true); }}
        onOpenSettings={(tab) => { setSettingsInitialTab(tab || 'profile'); setIsSettingsOpen(true); }}
        onOpenStudyMode={() => setIsStudyModeOpen(true)}
        onOpenPomodoro={() => setIsPomodoroOpen(true)}
        onOpenTypingMetrics={() => setIsTypingMetricsOpen(true)}
        onOpenDictionary={() => setIsDictionaryOpen(true)}
        onOpenWebClipper={() => setIsWebClipperOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onQuickNote={handleCreateQuickNote}
      />

      {/* 3-Pane Main Application Layout */}
      <div className="app-main">
        {/* Pane 1: Sidebar with Books, Folders, Quick Views, Calendar Accordion & Archive/Bin Footer */}
        <Sidebar
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          notesCountByWorkspace={notesCountByWorkspace}
          books={workspaceBooks}
          folders={workspaceFolders}
          notes={workspaceNotes}
          selectedNoteId={selectedNoteId}
          currentFilter={currentFilter}
          currentFolderId={currentFolderId}
          selectedTag={selectedTag}
          isOpenMobile={isMobileSidebarOpen}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onSelectWorkspace={handleSelectWorkspace}
          onCreateWorkspace={handleCreateWorkspace}
          onDeleteWorkspace={handleDeleteWorkspace}
          onCreateBook={handleCreateBook}
          onDeleteBook={handleDeleteBook}
          onAddPageToBook={handleAddPageToBook}
          onSelectNote={handleOpenNoteInActivePane}
          onOpenLibrary={() => setIsLibraryOpen(true)}
          isLibraryOpen={isLibraryOpen}
          onSelectFilter={(filter) => {
            setCurrentFilter(filter);
            setCurrentFolderId(null);
            setSelectedTag(null);
          }}
          onSelectFolder={(folderId) => {
            setCurrentFolderId(folderId);
            setCurrentFilter('all');
            setSelectedTag(null);
          }}
          onSelectTag={(tag) => setSelectedTag(tag)}
          onSelectDate={handleSelectDate}
          onOpenTodayNote={handleOpenTodayNote}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        {/* Pane 2: Notes List with Search, Sorting & Compact Hover Preview Cards */}
        <NoteList
          notes={workspaceNotes}
          folders={workspaceFolders}
          selectedNoteId={secondaryNoteId && activeSplitSide === 'right' ? secondaryNoteId : selectedNoteId}
          currentFilter={currentFilter}
          currentFolderId={currentFolderId}
          selectedTag={selectedTag}
          isCollapsed={isNotesCollapsed}
          onToggleCollapse={() => setIsNotesCollapsed(!isNotesCollapsed)}
          onSelectNote={handleOpenNoteInActivePane}
          onSelectNoteSplit={handleOpenNoteSplit}
          onCreateNote={handleCreateNote}
          onToggleFavorite={handleToggleFavorite}
          onEmptyTrash={handleEmptyTrash}
          onRestoreNote={handleRestoreNote}
          onArchiveNote={handleToggleArchiveNote}
          onDeleteNote={handleSoftDeleteNote}
          onPermanentDeleteNote={handlePermanentDeleteNote}
        />

        {/* Pane 3: Rich Note Editor / Dual Side-by-Side Split View */}
        {secondaryNoteId && notes.find((n) => n.id === secondaryNoteId) ? (
          <SplitWindowManager
            leftTitle={currentNote?.title || 'Left Note'}
            rightTitle={notes.find((n) => n.id === secondaryNoteId)?.title || 'Right Note'}
            activePane={activeSplitSide}
            onFocusLeft={() => setActiveSplitSide('left')}
            onFocusRight={() => setActiveSplitSide('right')}
            onCloseSplit={handleCloseSplit}
            onSwapPanes={() => {
              const tempActive = selectedNoteId;
              const tempTabs = openNoteIds;
              setSelectedNoteId(secondaryNoteId);
              setOpenNoteIds(rightOpenNoteIds.length > 0 ? rightOpenNoteIds : (secondaryNoteId ? [secondaryNoteId] : []));
              setSecondaryNoteId(tempActive);
              setRightOpenNoteIds(tempTabs.length > 0 ? tempTabs : (tempActive ? [tempActive] : []));
              setActiveSplitSide((prev) => (prev === 'left' ? 'right' : 'left'));
            }}
            leftPane={
              <NoteEditor
                note={currentNote}
                folders={workspaceFolders}
                allNotes={workspaceNotes}
                books={workspaceBooks}
                activeWorkspace={activeWorkspace}
                openNoteIds={openNoteIds}
                activeNoteId={selectedNoteId}
                isMicEnabled={isMicEnabled}
                paneSide="left"
                onSelectTab={(id) => {
                  setSelectedNoteId(id);
                  setOpenNoteIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
                  setActiveSplitSide('left');
                }}
                onCloseTab={handleCloseLeftTab}
                onNewTab={handleCreateNote}
                onMoveTabToOtherPane={handleMoveLeftTabToRight}
                onReorderTabs={(newOrder) => setOpenNoteIds(newOrder)}
                onDropTabFromOtherPane={handleMoveRightTabToLeft}
                isZenMode={isZenMode}
                onToggleZenMode={() => setIsZenMode((z) => !z)}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleSoftDeleteNote}
                onRestoreNote={handleRestoreNote}
                onPermanentDeleteNote={handlePermanentDeleteNote}
                onToggleArchiveNote={handleToggleArchiveNote}
                onAddPageToBook={handleAddPageToBook}
                onNavigateToNote={handleNavigateToNote}
                onBackMobile={() => setSelectedNoteId(null)}
                isSplitView={true}
                onCloseSplit={handleCloseSplit}
                onCloseNote={handleCloseNote}
                onDuplicateNote={handleDuplicateNote}
                onMoveNote={handleMoveNote}
              />
            }
            rightPane={
              <NoteEditor
                note={notes.find((n) => n.id === secondaryNoteId) || null}
                folders={workspaceFolders}
                allNotes={workspaceNotes}
                books={workspaceBooks}
                activeWorkspace={activeWorkspace}
                openNoteIds={rightOpenNoteIds.length > 0 ? rightOpenNoteIds : [secondaryNoteId]}
                activeNoteId={secondaryNoteId}
                isMicEnabled={isMicEnabled}
                paneSide="right"
                onSelectTab={handleSelectRightTab}
                onCloseTab={handleCloseRightTab}
                onNewTab={handleNewRightTab}
                onMoveTabToOtherPane={handleMoveRightTabToLeft}
                onReorderTabs={(newOrder) => setRightOpenNoteIds(newOrder)}
                onDropTabFromOtherPane={handleMoveLeftTabToRight}
                isZenMode={isZenMode}
                onToggleZenMode={() => setIsZenMode((z) => !z)}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleSoftDeleteNote}
                onRestoreNote={handleRestoreNote}
                onPermanentDeleteNote={handlePermanentDeleteNote}
                onToggleArchiveNote={handleToggleArchiveNote}
                onAddPageToBook={handleAddPageToBook}
                onNavigateToNote={handleNavigateToNote}
                onBackMobile={handleCloseSplit}
                isSplitView={true}
                onCloseSplit={handleCloseSplit}
                onCloseNote={handleCloseSplit}
                onDuplicateNote={handleDuplicateNote}
                onMoveNote={handleMoveNote}
              />
            }
          />
        ) : (
          <NoteEditor
            note={currentNote}
            folders={workspaceFolders}
            allNotes={workspaceNotes}
            books={workspaceBooks}
            activeWorkspace={activeWorkspace}
            openNoteIds={openNoteIds}
            activeNoteId={selectedNoteId}
            isMicEnabled={isMicEnabled}
            paneSide="left"
            onSelectTab={handleOpenNote}
            onCloseTab={handleCloseTab}
            onNewTab={handleCreateNote}
            onMoveTabToOtherPane={handleOpenNoteSplit}
            onReorderTabs={(newOrder) => setOpenNoteIds(newOrder)}
            onDropTabFromOtherPane={handleMoveRightTabToLeft}
            isZenMode={isZenMode}
            onToggleZenMode={() => setIsZenMode((z) => !z)}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleSoftDeleteNote}
            onRestoreNote={handleRestoreNote}
            onPermanentDeleteNote={handlePermanentDeleteNote}
            onToggleArchiveNote={handleToggleArchiveNote}
            onAddPageToBook={handleAddPageToBook}
            onNavigateToNote={handleNavigateToNote}
            onBackMobile={() => setSelectedNoteId(null)}
            isSplitView={false}
            onOpenSplit={handleOpenNoteSplit}
            onCloseNote={handleCloseNote}
            onDuplicateNote={handleDuplicateNote}
            onMoveNote={handleMoveNote}
          />
        )}
      </div>

      {/* Application Modals Hub */}
      <AppModals
        isSettingsOpen={isSettingsOpen}
        onCloseSettings={() => setIsSettingsOpen(false)}
        theme={theme}
        onChangeTheme={handleChangeTheme}
        activeWorkspace={activeWorkspace}
        allNotes={notes}
        allFolders={folders}
        allBooks={books}
        isMicEnabled={isMicEnabled}
        onToggleMic={handleToggleMic}
        onExportVault={handleExportData}
        onImportVault={handleImportData}
        onReseedTutorialVault={handleReseedTutorialVault}
        userProfile={userProfile}
        onUpdateProfile={setUserProfile}
        settingsInitialTab={settingsInitialTab}
        isKnowledgeBaseOpen={isKnowledgeBaseOpen}
        onCloseKnowledgeBase={() => setIsKnowledgeBaseOpen(false)}
        isLinkTreeOpen={isLinkTreeOpen}
        onCloseLinkTree={() => setIsLinkTreeOpen(false)}
        onSelectFolder={(folderId) => {
          setCurrentFolderId(folderId);
          setCurrentFilter('all');
        }}
        isSearchOpen={isSearchOpen}
        onCloseSearch={() => setIsSearchOpen(false)}
        isStudyModeOpen={isStudyModeOpen}
        onCloseStudyMode={() => setIsStudyModeOpen(false)}
        currentNote={currentNote}
        isPomodoroOpen={isPomodoroOpen}
        onClosePomodoro={() => setIsPomodoroOpen(false)}
        onTimerTick={(seconds, running, m) => {
          setPomodoroSecondsLeft(seconds);
          setIsPomodoroRunning(running);
          setPomodoroMode(m);
        }}
        isInternalMindOpen={isInternalMindOpen}
        onCloseInternalMind={() => setIsInternalMindOpen(false)}
        isTypingMetricsOpen={isTypingMetricsOpen}
        onCloseTypingMetrics={() => setIsTypingMetricsOpen(false)}
        isDictionaryOpen={isDictionaryOpen}
        onCloseDictionary={() => setIsDictionaryOpen(false)}
        isLibraryOpen={isLibraryOpen}
        onCloseLibrary={() => setIsLibraryOpen(false)}
        workspaceNotes={workspaceNotes}
        workspaceFolders={workspaceFolders}
        workspaceBooks={workspaceBooks}
        onSelectNote={handleOpenNote}
        onSelectNoteSplit={handleOpenNoteSplit}
        onCreateBook={handleCreateBook}
        onDeleteBook={handleDeleteBook}
        onDuplicateBook={handleDuplicateBook}
        onCreateFolder={handleCreateFolder}
        onDeleteFolder={handleDeleteFolder}
        onMoveNote={handleMoveNote}
        onDuplicateNote={handleDuplicateNote}
        onAddPageToBook={handleAddPageToBook}
        onCreateNote={handleCreateNote}
        isWebClipperOpen={isWebClipperOpen}
        onCloseWebClipper={() => setIsWebClipperOpen(false)}
        onSaveClippedNote={(clippedNote) => {
          setNotes((prev) => [clippedNote, ...prev]);
          handleOpenNote(clippedNote.id);
        }}
      />

      {/* Inactivity Security Screen Lock */}
      <InactivityOverlay
        isLocked={isVaultLockedDueToInactivity}
        profileName={userProfile.name}
        profileAvatar={userProfile.avatarValue}
        avatarType={userProfile.avatarType}
        onUnlock={() => setIsVaultLockedDueToInactivity(false)}
      />
    </div>
  );
};

export default App;
