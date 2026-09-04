import React, { lazy, Suspense } from 'react';
import type { Note, Folder, Workspace, Book, ThemeMode, UserProfile, PomodoroMode } from '../types';
import { ErrorBoundary } from './common/ErrorBoundary';

const KnowledgeBaseModal = lazy(() => import('./KnowledgeBaseModal').then(m => ({ default: m.KnowledgeBaseModal })));
const FolderLinkTreeModal = lazy(() => import('./FolderLinkTreeModal').then(m => ({ default: m.FolderLinkTreeModal })));
const SearchModal = lazy(() => import('./SearchModal').then(m => ({ default: m.SearchModal })));
const SettingsModal = lazy(() => import('./SettingsModal').then(m => ({ default: m.SettingsModal })));
const StudyModeModal = lazy(() => import('./StudyModeModal').then(m => ({ default: m.StudyModeModal })));
const FocusPomodoroModal = lazy(() => import('./FocusPomodoroModal').then(m => ({ default: m.FocusPomodoroModal })));
const InternalMindModal = lazy(() => import('./InternalMindModal').then(m => ({ default: m.InternalMindModal })));
const TypingMetricsModal = lazy(() => import('./TypingMetricsModal').then(m => ({ default: m.TypingMetricsModal })));
const DictionaryAbbreviationsModal = lazy(() => import('./DictionaryAbbreviationsModal').then(m => ({ default: m.DictionaryAbbreviationsModal })));
const LibraryFileManager = lazy(() => import('./LibraryFileManager').then(m => ({ default: m.LibraryFileManager })));

export interface AppModalsProps {
  // Settings
  isSettingsOpen: boolean;
  onCloseSettings: () => void;
  theme: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
  activeWorkspace?: Workspace;
  allNotes: Note[];
  allFolders: Folder[];
  allBooks: Book[];
  isMicEnabled: boolean;
  onToggleMic: (enabled: boolean) => void;
  onExportVault: () => void;
  onImportVault: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReseedTutorialVault: () => Promise<void>;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;

  // Knowledge Base
  isKnowledgeBaseOpen: boolean;
  onCloseKnowledgeBase: () => void;

  // Link Tree
  isLinkTreeOpen: boolean;
  onCloseLinkTree: () => void;
  onSelectFolder: (folderId: string) => void;

  // Search
  isSearchOpen: boolean;
  onCloseSearch: () => void;

  // Study Mode
  isStudyModeOpen: boolean;
  onCloseStudyMode: () => void;
  currentNote: Note | null;

  // Focus Pomodoro
  isPomodoroOpen: boolean;
  onClosePomodoro: () => void;
  onTimerTick: (seconds: number, isRunning: boolean, mode: PomodoroMode) => void;

  // Internal Mind
  isInternalMindOpen: boolean;
  onCloseInternalMind: () => void;

  // Typing Metrics
  isTypingMetricsOpen: boolean;
  onCloseTypingMetrics: () => void;

  // Dictionary & Abbreviations
  isDictionaryOpen: boolean;
  onCloseDictionary: () => void;

  // Library & File Manager
  isLibraryOpen: boolean;
  onCloseLibrary: () => void;
  workspaceNotes: Note[];
  workspaceFolders: Folder[];
  workspaceBooks: Book[];
  onSelectNote: (noteId: string) => void;
  onSelectNoteSplit: (noteId: string) => void;
  onCreateBook: (title: string, icon: string, color: string) => void;
  onDeleteBook: (bookId: string) => void;
  onDuplicateBook?: (sourceBook: Book) => void;
  onCreateFolder: (name: string, parentId?: string | null) => void;
  onDeleteFolder: (folderId: string) => void;
  onMoveNote: (noteId: string, folderId: string | null, bookId: string | null) => void;
  onDuplicateNote: (sourceNote: Note) => void;
  onAddPageToBook: (bookId: string) => void;
  onCreateNote: () => void;
}

export const AppModals: React.FC<AppModalsProps> = ({
  isSettingsOpen,
  onCloseSettings,
  theme,
  onChangeTheme,
  activeWorkspace,
  allNotes,
  allFolders,
  allBooks,
  isMicEnabled,
  onToggleMic,
  onExportVault,
  onImportVault,
  onReseedTutorialVault,
  userProfile,
  onUpdateProfile,

  isKnowledgeBaseOpen,
  onCloseKnowledgeBase,

  isLinkTreeOpen,
  onCloseLinkTree,
  onSelectFolder,

  isSearchOpen,
  onCloseSearch,

  isStudyModeOpen,
  onCloseStudyMode,
  currentNote,

  isPomodoroOpen,
  onClosePomodoro,
  onTimerTick,

  isInternalMindOpen,
  onCloseInternalMind,

  isTypingMetricsOpen,
  onCloseTypingMetrics,

  isDictionaryOpen,
  onCloseDictionary,

  isLibraryOpen,
  onCloseLibrary,
  workspaceNotes,
  workspaceFolders,
  workspaceBooks,
  onSelectNote,
  onSelectNoteSplit,
  onCreateBook,
  onDeleteBook,
  onDuplicateBook,
  onCreateFolder,
  onDeleteFolder,
  onMoveNote,
  onDuplicateNote,
  onAddPageToBook,
  onCreateNote,
}) => {
  const filteredWorkspaceNotes = workspaceNotes.filter((n) => !n.isTrashed);
  const resolvedWorkspace: Workspace = activeWorkspace || {
    id: 'ws-personal',
    name: 'Personal',
    icon: 'user',
    color: '#6366f1',
    createdAt: new Date().toISOString()
  };

  return (
    <Suspense fallback={null}>
      {/* Settings, Backup, Security, Hotkeys & Identity Hub */}
      {isSettingsOpen && (
        <ErrorBoundary name="Settings Modal">
          <SettingsModal
            isOpen={isSettingsOpen}
            theme={theme}
            onChangeTheme={onChangeTheme}
            activeWorkspace={resolvedWorkspace}
            allNotes={allNotes}
            allFolders={allFolders}
            allBooks={allBooks}
            isMicEnabled={isMicEnabled}
            onToggleMic={onToggleMic}
            onExportVault={onExportVault}
            onImportVault={onImportVault}
            onReseedTutorialVault={onReseedTutorialVault}
            onSelectNote={onSelectNote}
            onClose={onCloseSettings}
            userProfile={userProfile}
            onUpdateProfile={onUpdateProfile}
          />
        </ErrorBoundary>
      )}

      {/* Knowledge Base Modal: Infinite Galaxy Force-Directed Graph */}
      {isKnowledgeBaseOpen && (
        <ErrorBoundary name="Knowledge Base Modal">
          <KnowledgeBaseModal
            isOpen={isKnowledgeBaseOpen}
            notes={filteredWorkspaceNotes}
            folders={workspaceFolders}
            onClose={onCloseKnowledgeBase}
            onSelectNote={onSelectNote}
          />
        </ErrorBoundary>
      )}

      {/* Folder Link Tree Modal: Hierarchical Tree & Link Cards */}
      {isLinkTreeOpen && (
        <ErrorBoundary name="Folder Link Tree Modal">
          <FolderLinkTreeModal
            isOpen={isLinkTreeOpen}
            folders={workspaceFolders}
            notes={filteredWorkspaceNotes}
            onClose={onCloseLinkTree}
            onSelectFolder={onSelectFolder}
            onSelectNote={onSelectNote}
          />
        </ErrorBoundary>
      )}

      {/* Global Quick Search Modal (Cmd+K) */}
      {isSearchOpen && (
        <ErrorBoundary name="Search Modal">
          <SearchModal
            isOpen={isSearchOpen}
            notes={filteredWorkspaceNotes}
            folders={workspaceFolders}
            onClose={onCloseSearch}
            onSelectNote={onSelectNote}
          />
        </ErrorBoundary>
      )}

      {/* Interactive Flashcards & Spaced Repetition (Study Mode) */}
      {isStudyModeOpen && (
        <ErrorBoundary name="Study Mode Modal">
          <StudyModeModal
            isOpen={isStudyModeOpen}
            notes={filteredWorkspaceNotes}
            currentNote={currentNote}
            onClose={onCloseStudyMode}
          />
        </ErrorBoundary>
      )}

      {/* Focus Pomodoro & Ambient Soundscapes Modal */}
      {isPomodoroOpen && (
        <ErrorBoundary name="Focus Pomodoro Modal">
          <FocusPomodoroModal
            isOpen={isPomodoroOpen}
            onClose={onClosePomodoro}
            onTimerTick={onTimerTick}
          />
        </ErrorBoundary>
      )}

      {/* Internal Mind / Knowledge Dictionary Modal */}
      {isInternalMindOpen && (
        <ErrorBoundary name="Internal Mind Modal">
          <InternalMindModal
            isOpen={isInternalMindOpen}
            notes={filteredWorkspaceNotes}
            onNavigateToNote={onSelectNote}
            onClose={onCloseInternalMind}
          />
        </ErrorBoundary>
      )}

      {/* Typing Metrics & Keystroke Dynamics Modal */}
      {isTypingMetricsOpen && (
        <ErrorBoundary name="Typing Metrics Modal">
          <TypingMetricsModal
            isOpen={isTypingMetricsOpen}
            onClose={onCloseTypingMetrics}
          />
        </ErrorBoundary>
      )}

      {/* English Dictionary & Abbreviations Modal */}
      {isDictionaryOpen && (
        <ErrorBoundary name="Dictionary Modal">
          <DictionaryAbbreviationsModal
            isOpen={isDictionaryOpen}
            onClose={onCloseDictionary}
          />
        </ErrorBoundary>
      )}

      {/* Full Library & File Manager Modal Overlay */}
      {isLibraryOpen && (
        <ErrorBoundary name="Library File Manager">
          <LibraryFileManager
            isOpen={isLibraryOpen}
            onClose={onCloseLibrary}
            books={workspaceBooks}
            folders={workspaceFolders}
            notes={workspaceNotes}
            activeWorkspace={activeWorkspace}
            onSelectNote={(noteId) => {
              onSelectNote(noteId);
              onCloseLibrary();
            }}
            onSelectNoteSplit={(noteId) => {
              onSelectNoteSplit(noteId);
              onCloseLibrary();
            }}
            onCreateBook={onCreateBook}
            onDeleteBook={onDeleteBook}
            onDuplicateBook={onDuplicateBook}
            onCreateFolder={onCreateFolder}
            onDeleteFolder={onDeleteFolder}
            onMoveNote={onMoveNote}
            onDuplicateNote={onDuplicateNote}
            onAddPageToBook={onAddPageToBook}
            onCreateNote={onCreateNote}
          />
        </ErrorBoundary>
      )}
    </Suspense>
  );
};
