import React from 'react';
import { 
  FileText, 
  Search, 
  Network, 
  GitFork, 
  Sun, 
  Moon, 
  Menu,
  GraduationCap,
  Timer,
  Settings
} from 'lucide-react';
import type { ThemeMode, Workspace, PomodoroMode } from '../types';

interface HeaderProps {
  theme: ThemeMode;
  activeWorkspace?: Workspace;
  pomodoroSecondsLeft?: number;
  isPomodoroRunning?: boolean;
  pomodoroMode?: PomodoroMode;
  onToggleTheme: () => void;
  onOpenSearch: () => void;
  onOpenKnowledgeBase: () => void;
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
  pomodoroSecondsLeft,
  isPomodoroRunning,
  pomodoroMode,
  onToggleTheme,
  onOpenSearch,
  onOpenKnowledgeBase,
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

        <div className="mac-traffic-lights" title="Noteflow Mac Controls">
          <span className="traffic-light close" />
          <span className="traffic-light minimize" />
          <span className="traffic-light maximize" />
        </div>

        <div className="app-brand">
          <div className="brand-icon">
            <FileText size={16} />
          </div>
          <span>Noteflow</span>
        </div>
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

        {/* Link Tree Button */}
        <button 
          className="header-btn"
          onClick={onOpenLinkTree}
          title="Open Folder Link Tree Visualizer"
        >
          <GitFork size={15} />
          <span>Link Tree</span>
        </button>

        {/* Day / Night Theme Toggle */}
        <button 
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Day Theme' : 'Switch to Night Theme'}
          aria-label="Toggle Day and Night Theme"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
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
          title={`Persona: ${activeWorkspace?.name || 'Personal Vault'} (Click for Settings, Privacy & Storage)`}
        >
          <span style={{ fontSize: '15px' }}>{activeWorkspace?.icon || '🏠'}</span>
          <span className="header-profile-name">{activeWorkspace?.name || 'Personal'}</span>
        </button>
      </div>
    </header>
  );
};
