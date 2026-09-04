import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Network,
  GitFork,
  Menu,
  GraduationCap,
  Timer,
  Settings,
  Brain,
  Sparkles,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pin,
  PinOff,
  Keyboard,
  BookA,
  Globe,
  Zap
} from 'lucide-react';
import type { ThemeMode, Workspace, PomodoroMode, UserProfile } from '../types';
import { typingMetrics, type TypingSessionStats } from '../services/typingMetrics';

interface HeaderProps {
  theme?: ThemeMode;
  activeWorkspace?: Workspace;
  userProfile?: UserProfile;
  pomodoroSecondsLeft?: number;
  isPomodoroRunning?: boolean;
  pomodoroMode?: PomodoroMode;
  onToggleTheme?: () => void;
  onOpenSearch: () => void;
  onOpenKnowledgeBase: () => void;
  onOpenInternalMind?: () => void;
  onOpenLinkTree: () => void;
  onOpenProfile: () => void;
  onOpenSettings?: (tab?: string) => void;
  onOpenStudyMode: () => void;
  onOpenPomodoro: () => void;
  onOpenTypingMetrics?: () => void;
  onOpenDictionary?: () => void;
  onOpenWebClipper?: () => void;
  onToggleMobileSidebar: () => void;
  onQuickNote?: () => void;
}

const WIDGET_TOOL_IDS = ['pomodoro', 'typing'];

export const Header: React.FC<HeaderProps> = ({
  activeWorkspace,
  userProfile,
  pomodoroSecondsLeft,
  isPomodoroRunning,
  pomodoroMode = 'work',
  onOpenSearch,
  onOpenKnowledgeBase,
  onOpenInternalMind,
  onOpenLinkTree,
  onOpenProfile,
  onOpenSettings,
  onOpenStudyMode,
  onOpenPomodoro,
  onOpenTypingMetrics,
  onOpenDictionary,
  onOpenWebClipper,
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

  // Live on-device Typing Metrics state for pinned visual meter
  const [typingStats, setTypingStats] = useState<TypingSessionStats>(() => 
    typingMetrics.calculateStats()
  );

  useEffect(() => {
    const unsubscribe = typingMetrics.subscribe((stats) => {
      setTypingStats(stats);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Horizontal scroll for pinned tools
  const pinnedScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkPinnedScroll = useCallback(() => {
    const el = pinnedScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkPinnedScroll();
    const el = pinnedScrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkPinnedScroll);
    window.addEventListener('resize', checkPinnedScroll);
    return () => {
      el.removeEventListener('scroll', checkPinnedScroll);
      window.removeEventListener('resize', checkPinnedScroll);
    };
  }, [pinnedTools, typingStats, checkPinnedScroll]);

  const scrollPinned = (direction: 'left' | 'right') => {
    const el = pinnedScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -90 : 90, behavior: 'smooth' });
  };

  /**
   * Enforce Pinning Rules:
   * - Max 3 widget-style pins (Pomodoro timer, live Typing metrics)
   * - Max 2 icon pins if widgets are pinned, or max 5 icons total if no widgets
   */
  const togglePin = (toolId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedTools((prev) => {
      if (prev.includes(toolId)) {
        const next = prev.filter((id) => id !== toolId);
        try { localStorage.setItem('milearnapp_pinned_tools', JSON.stringify(next)); } catch { }
        return next;
      }

      const isWidget = WIDGET_TOOL_IDS.includes(toolId);
      const curWidgets = prev.filter((id) => WIDGET_TOOL_IDS.includes(id));
      const curIcons = prev.filter((id) => !WIDGET_TOOL_IDS.includes(id));

      let nextWidgets = [...curWidgets];
      let nextIcons = [...curIcons];

      if (isWidget) {
        if (nextWidgets.length >= 3) {
          nextWidgets.shift(); // Remove oldest widget to honor max 3
        }
        nextWidgets.push(toolId);
        // If widgets present, icons limited to max 2
        if (nextIcons.length > 2) {
          nextIcons = nextIcons.slice(-2);
        }
      } else {
        const maxIcons = nextWidgets.length > 0 ? 2 : 5;
        if (nextIcons.length >= maxIcons) {
          nextIcons.shift(); // Remove oldest icon to honor max limit
        }
        nextIcons.push(toolId);
      }

      const next = [...nextWidgets, ...nextIcons];
      try { localStorage.setItem('milearnapp_pinned_tools', JSON.stringify(next)); } catch { }
      return next;
    });
  };

  const formattedPomoTime = pomodoroSecondsLeft !== undefined
    ? `${Math.floor(pomodoroSecondsLeft / 60).toString().padStart(2, '0')}:${(pomodoroSecondsLeft % 60).toString().padStart(2, '0')}`
    : '25:00';

  return (
    <header className="app-header">
      {/* Left: Mobile Toggle & MiLEARNAPP Brand Logo */}
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

        <div className="app-brand-text">
          <span className="brand-title-logo" title="MiLEARNAPP - Knowledge & Learning Hub">MiLEARNAPP</span>
        </div>
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

      {/* Right: Quick Note, Pinned Tools (Widget & Icon system), Tools Tray, Theme, Profile */}
      <div className="header-right">

        {/* ⚡ Quick Note Button */}
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

        {/* Pinned Nav Tools with intelligent horizontal scroll & limit management */}
        <div className="pinned-tools-nav-wrapper">
          {canScrollLeft && (
            <button
              type="button"
              className="pinned-nav-scroll-btn prev"
              onClick={() => scrollPinned('left')}
              title="Previous pinned tools"
            >
              <ChevronLeft size={12} />
            </button>
          )}

          <div 
            ref={pinnedScrollRef} 
            className="header-pinned-tools"
            onWheel={(e) => {
              if (pinnedScrollRef.current && e.deltaY !== 0) {
                pinnedScrollRef.current.scrollLeft += e.deltaY;
              }
            }}
          >
            {/* WIDGET 1: Pomodoro Focus Timer Widget */}
            {pinnedTools.includes('pomodoro') && (
              <button
                type="button"
                className={`header-pinned-tool-btn header-pinned-widget ${isPomodoroRunning ? 'running' : ''}`}
                onClick={onOpenPomodoro}
                title={`Focus Pomodoro (${isPomodoroRunning ? formattedPomoTime : '25m Timer'})`}
              >
                <Timer size={14} color="#ef4444" className={isPomodoroRunning ? 'pulse-icon' : ''} />
                <span className="pinned-pomo-text">
                  {isPomodoroRunning ? formattedPomoTime : '25:00'}
                </span>
              </button>
            )}

            {/* WIDGET 2: Live On-Device Typing Practice Meter & Game Launcher */}
            {pinnedTools.includes('typing') && (
              <button
                type="button"
                className="header-pinned-tool-btn header-pinned-widget typing-meter-widget"
                onClick={onOpenTypingMetrics}
                title={`Practice Typing Game: ${typingStats.wpm} WPM · ${typingStats.accuracy}% Accuracy (Click to Play Sprint)`}
              >
                <Keyboard size={13} color="#6366f1" />
                <span className="pinned-widget-text">
                  <strong>{typingStats.wpm}</strong> <span className="pinned-widget-unit">WPM</span>
                  <span className="pinned-widget-dot">·</span>
                  <span className="pinned-widget-acc">{typingStats.accuracy}%</span>
                </span>
              </button>
            )}

            {/* ICON 1: Study Cards (SRS Flashcards) */}
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

            {/* ICON 2: Knowledge Base Graph */}
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

            {/* ICON 3: Internal Mind Knowledge Hub */}
            {pinnedTools.includes('mind') && onOpenInternalMind && (
              <button
                type="button"
                className="header-pinned-tool-btn"
                onClick={onOpenInternalMind}
                title="Internal Mind & Knowledge Dictionary"
              >
                <Brain size={14} color="#8b5cf6" />
              </button>
            )}

            {/* ICON 4: Folder Link Tree */}
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

            {/* ICON 5: English Dictionary */}
            {pinnedTools.includes('dictionary') && onOpenDictionary && (
              <button
                type="button"
                className="header-pinned-tool-btn"
                onClick={onOpenDictionary}
                title="English Dictionary & Word Lookup"
              >
                <BookA size={14} color="#0ea5e9" />
              </button>
            )}

            {/* ICON 6: Web Clipper */}
            {pinnedTools.includes('webclipper') && onOpenWebClipper && (
              <button
                type="button"
                className="header-pinned-tool-btn"
                onClick={onOpenWebClipper}
                title="Web Clipper & Content Structurer"
              >
                <Globe size={14} color="var(--accent-primary, #6366f1)" />
              </button>
            )}
          </div>

          {canScrollRight && (
            <button
              type="button"
              className="pinned-nav-scroll-btn next"
              onClick={() => scrollPinned('right')}
              title="Next pinned tools"
            >
              <ChevronRight size={12} />
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
                  <span>Tools & Widgets</span>
                  <span className="tray-pin-hint">Max 3 widgets · 2 icons</span>
                </div>

                {/* 1. Pomodoro Focus Timer */}
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
                    title={pinnedTools.includes('pomodoro') ? 'Unpin timer from nav' : 'Pin live countdown widget to nav'}
                  >
                    {pinnedTools.includes('pomodoro') ? <PinOff size={13} /> : <Pin size={13} />}
                  </button>
                </div>

                {/* 2. On-Device Typing Metrics */}
                <div className="tray-item-row-wrap">
                  <button
                    type="button"
                    className="tray-item-btn"
                    onClick={() => {
                      if (onOpenTypingMetrics) onOpenTypingMetrics();
                      setIsToolsTrayOpen(false);
                    }}
                    title="View Typing Metrics Analytics"
                  >
                    <Keyboard size={15} color="#6366f1" />
                    <div className="tray-item-text">
                      <strong>Typing Metrics</strong>
                      <span>Live {typingStats.wpm} WPM · {typingStats.accuracy}% Accuracy</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`btn-tool-pin ${pinnedTools.includes('typing') ? 'pinned' : ''}`}
                    onClick={(e) => togglePin('typing', e)}
                    title={pinnedTools.includes('typing') ? 'Unpin live WPM visual from nav' : 'Pin live WPM visual widget to nav'}
                  >
                    {pinnedTools.includes('typing') ? <PinOff size={13} /> : <Pin size={13} />}
                  </button>
                </div>

                {/* 3. Study Flashcards */}
                <div className="tray-item-row-wrap">
                  <button
                    type="button"
                    className="tray-item-btn"
                    onClick={() => { onOpenStudyMode(); setIsToolsTrayOpen(false); }}
                    title="Open Study Flashcards & Spaced Repetition"
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
                    title={pinnedTools.includes('study') ? 'Unpin from top nav' : 'Pin icon to top nav'}
                  >
                    {pinnedTools.includes('study') ? <PinOff size={13} /> : <Pin size={13} />}
                  </button>
                </div>

                {/* 4. Knowledge Base Graph */}
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
                    title={pinnedTools.includes('knowledge') ? 'Unpin from top nav' : 'Pin icon to top nav'}
                  >
                    {pinnedTools.includes('knowledge') ? <PinOff size={13} /> : <Pin size={13} />}
                  </button>
                </div>

                {/* 5. Internal Mind Knowledge Hub */}
                {onOpenInternalMind && (
                  <div className="tray-item-row-wrap">
                    <button
                      type="button"
                      className="tray-item-btn"
                      onClick={() => { onOpenInternalMind(); setIsToolsTrayOpen(false); }}
                      title="Open Internal Mind & Knowledge Dictionary"
                    >
                      <Brain size={15} color="#8b5cf6" />
                      <div className="tray-item-text">
                        <strong>Internal Mind</strong>
                        <span>Autonomous knowledge dictionary & concepts</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className={`btn-tool-pin ${pinnedTools.includes('mind') ? 'pinned' : ''}`}
                      onClick={(e) => togglePin('mind', e)}
                      title={pinnedTools.includes('mind') ? 'Unpin from top nav' : 'Pin icon to top nav'}
                    >
                      {pinnedTools.includes('mind') ? <PinOff size={13} /> : <Pin size={13} />}
                    </button>
                  </div>
                )}

                {/* 6. Folder Link Tree */}
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
                    title={pinnedTools.includes('linktree') ? 'Unpin from top nav' : 'Pin icon to top nav'}
                  >
                    {pinnedTools.includes('linktree') ? <PinOff size={13} /> : <Pin size={13} />}
                  </button>
                </div>

                {/* 7. English Dictionary & Word Lookup */}
                {onOpenDictionary && (
                  <div className="tray-item-row-wrap">
                    <button
                      type="button"
                      className="tray-item-btn"
                      onClick={() => { onOpenDictionary(); setIsToolsTrayOpen(false); }}
                      title="Open English Dictionary & Word Lookup"
                    >
                      <BookA size={15} color="#0ea5e9" />
                      <div className="tray-item-text">
                        <strong>Dictionary & Word Lookup</strong>
                        <span>en-dictionary + custom vocabulary</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className={`btn-tool-pin ${pinnedTools.includes('dictionary') ? 'pinned' : ''}`}
                      onClick={(e) => togglePin('dictionary', e)}
                      title={pinnedTools.includes('dictionary') ? 'Unpin from top nav' : 'Pin icon to top nav'}
                    >
                      {pinnedTools.includes('dictionary') ? <PinOff size={13} /> : <Pin size={13} />}
                    </button>
                  </div>
                )}

                {/* 8. Web Clipper & Content Structurer */}
                {onOpenWebClipper && (
                  <div className="tray-item-row-wrap">
                    <button
                      type="button"
                      className="tray-item-btn"
                      onClick={() => { onOpenWebClipper(); setIsToolsTrayOpen(false); }}
                      title="Open Web Clipper & Content Structurer"
                    >
                      <Globe size={15} color="var(--accent-primary, #6366f1)" />
                      <div className="tray-item-text">
                        <strong>Web Clipper</strong>
                        <span>Structure web content into markdown notes</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className={`btn-tool-pin ${pinnedTools.includes('webclipper') ? 'pinned' : ''}`}
                      onClick={(e) => togglePin('webclipper', e)}
                      title={pinnedTools.includes('webclipper') ? 'Unpin from top nav' : 'Pin icon to top nav'}
                    >
                      {pinnedTools.includes('webclipper') ? <PinOff size={13} /> : <Pin size={13} />}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Combined Profile & Settings Tablet (Profile Avatar + Name + Settings Gear Icon with Live Postgres Indicator) */}
        <div
          className="header-profile-tablet"
          onClick={() => (onOpenSettings ? onOpenSettings('profile') : onOpenProfile())}
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
            <span className="settings-nav-pg-dot connected" title="PostgreSQL: Connected & Synced" />
          </div>
        </div>

      </div>
    </header>
  );
};
