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
  ChevronDown,
  Pin,
  PinOff
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
  pomodoroMode = 'work',
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
  const [pinnedTools, setPinnedTools] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('milearnapp_pinned_tools');
      return saved ? JSON.parse(saved) : ['pomodoro', 'study'];
    } catch {
      return ['pomodoro', 'study'];
    }
  });

  const togglePin = (toolId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedTools((prev) => {
      const next = prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId];
      try {
        localStorage.setItem('milearnapp_pinned_tools', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const formattedPomoTime = pomodoroSecondsLeft !== undefined
    ? `${Math.floor(pomodoroSecondsLeft / 60).toString().padStart(2, '0')}:${(pomodoroSecondsLeft % 60).toString().padStart(2, '0')}`
    : '25:00';

  return (
    <header className="app-header">
      {/* Left: Sidebar Toggle, MiLEARNAPP Brand & Persona Switcher */}
      <div className="header-left">
        <button 
          className="mobile-only-btn editor-icon-btn" 
          onClick={onToggleMobileSidebar}
          title="Toggle Sidebar Navigation"
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
            title={isSidebarCollapsed ? 'Expand Sidebar (Cmd+\\)' : 'Collapse Sidebar (Cmd+\\)'}
            aria-label={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}

        <div className="app-brand-text">
          <span className="brand-title-logo" title="MiLEARNAPP - Knowledge & Learning Hub">MiLEARNAPP</span>
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
          title="Global Spotlight Search across all notes, tags, books & media (Cmd+K)"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={14} />
            <span>Search notes, tags, files...</span>
          </div>
          <span className="kbd-shortcut">⌘K</span>
        </button>
      </div>

      {/* Right: Quick Note (Moved here next to Tools), Pinned Tools, Tools Tray, Theme, Profile Tablet */}
      <div className="header-right">

        {/* ⚡ Quick Note Button (Moved to right next to tools) */}
        {onQuickNote && (
          <button
            type="button"
            className="header-quick-note-btn"
            onClick={onQuickNote}
            title="Instant Quick Scratchpad (Alt+Q or Option+Q)"
          >
            <Zap size={13} color="#f59e0b" />
            <span>Quick Note</span>
          </button>
        )}

        {/* Pinned Nav Quick Access Tools */}
        <div className="header-pinned-tools">
          {pinnedTools.includes('pomodoro') && (
            <button
              type="button"
              className={`header-pinned-tool-btn ${isPomodoroRunning ? 'running' : ''}`}
              onClick={onOpenPomodoro}
              title={`Focus Pomodoro (${isPomodoroRunning ? formattedPomoTime : '25m Timer'})`}
            >
              <Timer size={14} color="#ef4444" />
              {isPomodoroRunning && (
                <span className="pinned-pomo-text">{formattedPomoTime}</span>
              )}
            </button>
          )}

          {pinnedTools.includes('study') && (
            <button
              type="button"
              className="header-pinned-tool-btn"
              onClick={onOpenStudyMode}
              title="Study Cards (Spaced Repetition Flashcards)"
            >
              <GraduationCap size={14} color="var(--accent-primary)" />
            </button>
          )}

          {pinnedTools.includes('knowledge') && (
            <button
              type="button"
              className="header-pinned-tool-btn"
              onClick={onOpenKnowledgeBase}
              title="Knowledge Base Graph (Galaxy View)"
            >
              <Network size={14} color="#0ea5e9" />
            </button>
          )}

          {pinnedTools.includes('mind') && onOpenInternalMind && (
            <button
              type="button"
              className="header-pinned-tool-btn"
              onClick={onOpenInternalMind}
              title="Internal Mind Lexicon (Autonomous Dictionary)"
            >
              <Brain size={14} color="#8b5cf6" />
            </button>
          )}

          {pinnedTools.includes('linktree') && (
            <button
              type="button"
              className="header-pinned-tool-btn"
              onClick={onOpenLinkTree}
              title="Folder Link Tree Visualizer"
            >
              <GitFork size={14} color="#10b981" />
            </button>
          )}
        </div>

        {/* Collapsible Tools Tray (Windows / Mac Taskbar Tray style) */}
        <div className="tools-tray-container">
          <button
            type="button"
            className={`tools-tray-trigger-btn ${isToolsTrayOpen ? 'active' : ''} ${isPomodoroRunning ? 'running' : ''}`}
            onClick={() => setIsToolsTrayOpen(!isToolsTrayOpen)}
            title="Open Power Tools, Study Hub & Utilities"
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
                  <span className="tray-pin-hint">Pin to Nav</span>
                </div>

                <div className="tray-item-row-wrap">
                  <button
                    type="button"
                    className="tray-item-btn"
                    onClick={() => { onOpenPomodoro(); setIsToolsTrayOpen(false); }}
                    title="Open Focus Pomodoro & Ambient Soundscapes"
                  >
                    <Timer size={15} color="#ef4444" />
                    <div className="tray-item-text">
                      <strong>Focus Pomodoro</strong>
                      <span>{isPomodoroRunning ? `Running · ${formattedPomoTime}` : '25m Timer & Soundscapes'}</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`btn-tool-pin ${pinnedTools.includes('pomodoro') ? 'pinned' : ''}`}
                    onClick={(e) => togglePin('pomodoro', e)}
                    title={pinnedTools.includes('pomodoro') ? 'Unpin from top navigation' : 'Pin to top navigation'}
                  >
                    {pinnedTools.includes('pomodoro') ? <PinOff size={13} /> : <Pin size={13} />}
                  </button>
                </div>

                <div className="tray-item-row-wrap">
                  <button
                    type="button"
                    className="tray-item-btn"
                    onClick={() => { onOpenStudyMode(); setIsToolsTrayOpen(false); }}
                    title="Open Study Flashcards & SuperMemo-2 Spaced Repetition"
                  >
                    <GraduationCap size={15} color="var(--accent-primary)" />
                    <div className="tray-item-text">
                      <strong>Study Cards</strong>
                      <span>Spaced repetition & flashcards</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`btn-tool-pin ${pinnedTools.includes('study') ? 'pinned' : ''}`}
                    onClick={(e) => togglePin('study', e)}
                    title={pinnedTools.includes('study') ? 'Unpin from top navigation' : 'Pin to top navigation'}
                  >
                    {pinnedTools.includes('study') ? <PinOff size={13} /> : <Pin size={13} />}
                  </button>
                </div>

                <div className="tray-item-row-wrap">
                  <button
                    type="button"
                    className="tray-item-btn"
                    onClick={() => { onOpenKnowledgeBase(); setIsToolsTrayOpen(false); }}
                    title="Open Visual Knowledge Graph of all note connections"
                  >
                    <Network size={15} color="#0ea5e9" />
                    <div className="tray-item-text">
                      <strong>Knowledge Base Graph</strong>
                      <span>Visual connections & cluster map</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`btn-tool-pin ${pinnedTools.includes('knowledge') ? 'pinned' : ''}`}
                    onClick={(e) => togglePin('knowledge', e)}
                    title={pinnedTools.includes('knowledge') ? 'Unpin from top navigation' : 'Pin to top navigation'}
                  >
                    {pinnedTools.includes('knowledge') ? <PinOff size={13} /> : <Pin size={13} />}
                  </button>
                </div>

                {onOpenInternalMind && (
                  <div className="tray-item-row-wrap">
                    <button
                      type="button"
                      className="tray-item-btn"
                      onClick={() => { onOpenInternalMind(); setIsToolsTrayOpen(false); }}
                      title="Open Autonomous Internal Mind Lexicon & Concept Index"
                    >
                      <Brain size={15} color="#8b5cf6" />
                      <div className="tray-item-text">
                        <strong>Internal Mind Lexicon</strong>
                        <span>Autonomous dictionary & concept index</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className={`btn-tool-pin ${pinnedTools.includes('mind') ? 'pinned' : ''}`}
                      onClick={(e) => togglePin('mind', e)}
                      title={pinnedTools.includes('mind') ? 'Unpin from top navigation' : 'Pin to top navigation'}
                    >
                      {pinnedTools.includes('mind') ? <PinOff size={13} /> : <Pin size={13} />}
                    </button>
                  </div>
                )}

                <div className="tray-item-row-wrap">
                  <button
                    type="button"
                    className="tray-item-btn"
                    onClick={() => { onOpenLinkTree(); setIsToolsTrayOpen(false); }}
                    title="Open Directory Hierarchy & Link Tree"
                  >
                    <GitFork size={15} color="#10b981" />
                    <div className="tray-item-text">
                      <strong>Folder Link Tree</strong>
                      <span>Directory tree structure graph</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`btn-tool-pin ${pinnedTools.includes('linktree') ? 'pinned' : ''}`}
                    onClick={(e) => togglePin('linktree', e)}
                    title={pinnedTools.includes('linktree') ? 'Unpin from top navigation' : 'Pin to top navigation'}
                  >
                    {pinnedTools.includes('linktree') ? <PinOff size={13} /> : <Pin size={13} />}
                  </button>
                </div>
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
              ? 'Theme: Day Theme (Click for Night Theme)'
              : 'Theme: Night Theme (Click for System Default)'
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
          title="Account, Identity & Settings (Cmd+,)"
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
          <div className="profile-tablet-gear-box" title="Open Settings (Cmd+,)">
            <Settings size={13} className="profile-tablet-gear" />
          </div>
        </div>

      </div>
    </header>
  );
};
