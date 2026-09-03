import React from 'react';
import { 
  Search, 
  Network, 
  GitFork, 
  Sun, 
  Moon, 
  Menu,
  GraduationCap,
  Timer,
  Settings,
  Brain,
  Monitor,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import type { ThemeMode, Workspace, PomodoroMode, UserProfile } from '../types';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';

interface HeaderProps {
  theme: ThemeMode;
  activeWorkspace?: Workspace;
  userProfile?: UserProfile;
  workspaces?: Workspace[];
  activeWorkspaceId?: string;
  notesCountByWorkspace?: Map<string, number>;
  onSelectWorkspace?: (id: string) => void;
  onCreateWorkspace?: (name: string, icon: string, color: string, description: string) => void;
  onDeleteWorkspace?: (id: string) => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  pomodoroSecondsLeft?: number;
  isPomodoroRunning?: boolean;
  pomodoroMode?: PomodoroMode;
  onToggleTheme: () => void;
  onOpenSearch: () => void;
  onOpenKnowledgeBase: () => void;
  onOpenInternalMind?: () => void;
  onOpenLinkTree: () => void;
  onOpenProfile: () => void;
  onOpenSettings?: () => void;
  onOpenStudyMode: () => void;
  onOpenPomodoro: () => void;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  activeWorkspace,
  userProfile,
  workspaces,
  activeWorkspaceId,
  notesCountByWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
  onDeleteWorkspace,
  isSidebarCollapsed = false,
  onToggleSidebar,
  pomodoroSecondsLeft,
  isPomodoroRunning,
  pomodoroMode,
  onToggleTheme,
  onOpenSearch,
  onOpenKnowledgeBase,
  onOpenInternalMind,
  onOpenLinkTree,
  onOpenProfile,
  onOpenSettings,
  onOpenStudyMode,
  onOpenPomodoro,
  onToggleMobileSidebar
}) => {
  return (
    <header className="app-header">
      {/* Left: Mac Traffic Lights & App Brand */}
      <div className="header-left">
        <button 
          className="mobile-only-btn editor-icon-btn" 
          onClick={onToggleMobileSidebar}
          title="Toggle Sidebar"
          aria-label="Toggle Sidebar"
          style={{ display: 'none' }}
        >
          <Menu size={18} />
        </button>

        {onToggleSidebar && (
          <button 
            type="button"
            className="header-sidebar-toggle-btn"
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}

        <div className="app-brand-text">
          <span className="brand-title-logo">MiLEARNAPP</span>
        </div>

        {workspaces && activeWorkspaceId && onSelectWorkspace && onCreateWorkspace && onDeleteWorkspace && (
          <div className="header-workspace-wrapper">
            <WorkspaceSwitcher
              workspaces={workspaces}
              activeWorkspaceId={activeWorkspaceId}
              notesCountByWorkspace={notesCountByWorkspace || new Map()}
              onSelectWorkspace={onSelectWorkspace}
              onCreateWorkspace={onCreateWorkspace}
              onDeleteWorkspace={onDeleteWorkspace}
            />
          </div>
        )}
      </div>

      {/* Center: Global Search Trigger */}
      <div className="header-center">
        <button 
          className="search-trigger-btn" 
          onClick={onOpenSearch}
          title="Search all notes, tags, attachments (Cmd+K)"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={14} />
            <span>Search notes, tags, files...</span>
          </div>
          <span className="kbd-shortcut">⌘K</span>
        </button>
      </div>

      {/* Right: Study Mode, Focus Pomodoro, Knowledge Base, Link Tree, Day/Night Theme */}
      <div className="header-right">
        {/* Pomodoro Focus Chip */}
        <button
          className={`header-pomo-btn ${isPomodoroRunning ? 'running' : ''}`}
          onClick={onOpenPomodoro}
          title={`Focus Pomodoro (${pomodoroMode || 'work'}) & Ambient Soundscapes`}
        >
          <Timer size={14} />
          <span>
            {pomodoroSecondsLeft !== undefined
              ? `${Math.floor(pomodoroSecondsLeft / 60).toString().padStart(2, '0')}:${(pomodoroSecondsLeft % 60).toString().padStart(2, '0')}`
              : '25:00'}
          </span>
        </button>

        {/* Study Cards Button */}
        <button 
          className="header-btn highlight-study"
          onClick={onOpenStudyMode}
          title="Interactive Flashcards & Spaced Repetition (Study Mode)"
        >
          <GraduationCap size={15} />
          <span>Study Cards</span>
        </button>

        {/* Knowledge Base Button */}
        <button 
          className="header-btn highlight"
          onClick={onOpenKnowledgeBase}
          title="Open Knowledge Base Graph & Insights"
        >
          <Network size={15} />
          <span>Knowledge Base</span>
        </button>

        {/* Internal Mind Lexicon Dictionary Button */}
        {onOpenInternalMind && (
          <button 
            className="header-btn highlight-mind"
            onClick={onOpenInternalMind}
            title="Internal Mind: Autonomous Lexicon & Word Frequency Dictionary"
          >
            <Brain size={15} color="var(--color-purple)" />
            <span>Mind</span>
          </button>
        )}

        {/* Link Tree Button */}
        <button 
          className="header-btn"
          onClick={onOpenLinkTree}
          title="Open Folder Link Tree Visualizer"
        >
          <GitFork size={15} />
          <span>Link Tree</span>
        </button>

        {/* 3-Way Theme Toggle: System -> Day -> Night */}
        <button 
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={
            theme === 'system'
              ? 'Theme: System Default (Click for Day Theme)'
              : theme === 'light'
              ? 'Theme: Day (Click for Night Theme)'
              : 'Theme: Night (Click for System Default)'
          }
          aria-label="Toggle Theme"
        >
          {theme === 'system' ? (
            <Monitor size={16} />
          ) : theme === 'light' ? (
            <Sun size={16} color="#f59e0b" />
          ) : (
            <Moon size={16} color="#8b5cf6" />
          )}
        </button>

        {/* Settings & Vault Hub Button */}
        <button 
          className="header-btn"
          onClick={onOpenSettings || onOpenProfile}
          title="Settings, Vault Backup & Tutorial"
        >
          <Settings size={15} />
          <span>Settings</span>
        </button>

        {/* Local Persona / Profile Settings Button */}
        <button 
          className="header-profile-btn"
          onClick={onOpenProfile}
          title={`Profile: ${userProfile?.name || activeWorkspace?.name || 'Personal'} (Click for Settings)`}
        >
          {userProfile?.avatarType === 'image' || userProfile?.avatarType === 'gif' ? (
            <img
              src={userProfile.avatarValue}
              alt="Avatar"
              className="header-avatar-mini"
            />
          ) : (
            <span style={{ fontSize: '15px' }}>
              {userProfile?.avatarValue || activeWorkspace?.icon || '⚡'}
            </span>
          )}
          <span className="header-profile-name">
            {userProfile?.name || activeWorkspace?.name || 'Personal'}
          </span>
        </button>
      </div>
    </header>
  );
};
