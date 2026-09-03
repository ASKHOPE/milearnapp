import React, { useState } from 'react';
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
  PanelLeftOpen,
  Zap,
  Sparkles,
  ChevronDown
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
  onQuickNote?: () => void;
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
  onToggleMobileSidebar,
  onQuickNote
}) => {
  const [isToolsTrayOpen, setIsToolsTrayOpen] = useState(false);

  const formattedPomoTime = pomodoroSecondsLeft !== undefined
    ? `${Math.floor(pomodoroSecondsLeft / 60).toString().padStart(2, '0')}:${(pomodoroSecondsLeft % 60).toString().padStart(2, '0')}`
    : '25:00';

  return (
    <header className="app-header">
      {/* Left: Sidebar Toggle, MiLEARNAPP Brand, Persona Switcher & Quick Note */}
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

        {onQuickNote && (
          <button
            type="button"
            className="header-quick-note-btn"
            onClick={onQuickNote}
            title="Instant Quick Scratchpad (Alt+Q)"
          >
            <Zap size={13} color="#f59e0b" />
            <span>Quick Note</span>
          </button>
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

      {/* Right: Collapsible Tools Tray, 3-Way Theme, Combined Profile Tablet with Settings */}
      <div className="header-right">

        {/* Collapsible Tools Tray (Windows / Mac Taskbar Tray style) */}
        <div className="tools-tray-container">
          <button
            type="button"
            className={`tools-tray-trigger-btn ${isToolsTrayOpen ? 'active' : ''} ${isPomodoroRunning ? 'running' : ''}`}
            onClick={() => setIsToolsTrayOpen(!isToolsTrayOpen)}
            title="Open Power Tools & Study Hub"
          >
            <Sparkles size={14} color="var(--accent-primary)" />
            <span>Tools</span>
            {isPomodoroRunning && (
              <span className="pomo-tray-chip" title={`Pomodoro: ${pomodoroMode}`}>
                <Timer size={11} />
                {pomodoroMode === 'work' ? '' : '☕ '}{formattedPomoTime}
              </span>
            )}
            <ChevronDown size={12} className={`tray-chevron ${isToolsTrayOpen ? 'rotated' : ''}`} />
          </button>

          {/* Floating Tray Dropdown Menu */}
          {isToolsTrayOpen && (
            <>
              <div className="dropdown-backdrop" onClick={() => setIsToolsTrayOpen(false)} />
              <div className="tools-tray-dropdown-menu">
                <div className="tray-menu-header">
                  <span>Workspace Utilities</span>
                </div>

                <button
                  type="button"
                  className="tray-item-btn"
                  onClick={() => { onOpenPomodoro(); setIsToolsTrayOpen(false); }}
                >
                  <Timer size={15} color="#ef4444" />
                  <div className="tray-item-text">
                    <strong>Focus Pomodoro</strong>
                    <span>{isPomodoroRunning ? `Running · ${formattedPomoTime}` : '25m Timer & Soundscapes'}</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="tray-item-btn"
                  onClick={() => { onOpenStudyMode(); setIsToolsTrayOpen(false); }}
                >
                  <GraduationCap size={15} color="var(--accent-primary)" />
                  <div className="tray-item-text">
                    <strong>Study Cards</strong>
                    <span>Spaced repetition & flashcards</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="tray-item-btn"
                  onClick={() => { onOpenKnowledgeBase(); setIsToolsTrayOpen(false); }}
                >
                  <Network size={15} color="#0ea5e9" />
                  <div className="tray-item-text">
                    <strong>Knowledge Base Graph</strong>
                    <span>Visual connections & cluster map</span>
                  </div>
                </button>

                {onOpenInternalMind && (
                  <button
                    type="button"
                    className="tray-item-btn"
                    onClick={() => { onOpenInternalMind(); setIsToolsTrayOpen(false); }}
                  >
                    <Brain size={15} color="#8b5cf6" />
                    <div className="tray-item-text">
                      <strong>Internal Mind Lexicon</strong>
                      <span>Autonomous dictionary & concept index</span>
                    </div>
                  </button>
                )}

                <button
                  type="button"
                  className="tray-item-btn"
                  onClick={() => { onOpenLinkTree(); setIsToolsTrayOpen(false); }}
                >
                  <GitFork size={15} color="#10b981" />
                  <div className="tray-item-text">
                    <strong>Folder Link Tree</strong>
                    <span>Directory tree structure graph</span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

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
            <Monitor size={15} />
          ) : theme === 'light' ? (
            <Sun size={15} color="#f59e0b" />
          ) : (
            <Moon size={15} color="#8b5cf6" />
          )}
        </button>

        {/* Combined Profile & Settings Tablet (Profile Avatar + Name + Settings Gear Icon) */}
        <div 
          className="header-profile-tablet"
          onClick={onOpenSettings || onOpenProfile}
          title="Account, Profile & Settings"
        >
          <div className="profile-tablet-avatar">
            {userProfile?.avatarType === 'image' || userProfile?.avatarType === 'gif' ? (
              <img
                src={userProfile.avatarValue}
                alt="Avatar"
                className="header-avatar-mini"
              />
            ) : (
              <span>{userProfile?.avatarValue || activeWorkspace?.icon || '⚡'}</span>
            )}
          </div>
          <span className="profile-tablet-name">
            {userProfile?.name || activeWorkspace?.name || 'Personal'}
          </span>
          <div className="profile-tablet-gear-box" title="Open Settings">
            <Settings size={13} className="profile-tablet-gear" />
          </div>
        </div>

      </div>
    </header>
  );
};
