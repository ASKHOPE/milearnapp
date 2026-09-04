import { useEffect, useRef } from 'react';
import { shortcutManager } from '../services/shortcutManager';

export interface GlobalShortcutsHandlers {
  onToggleSearch: () => void;
  onCreateNote: () => void;
  onCloseTab: () => void;
  onToggleStudyMode: () => void;
  onTogglePomodoro: () => void;
  onToggleZenMode: () => void;
  onToggleSettings: () => void;
  onCreateQuickNote: () => void;
  onEscape: () => void;
}

/**
 * useGlobalShortcuts hook
 * Provides centralized keyboard shortcuts management using shortcutManager
 * and ref-based handler invocation to prevent listener thrashing and TDZ issues.
 */
export function useGlobalShortcuts(handlers: GlobalShortcutsHandlers): void {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const hotkeys = shortcutManager.getHotkeys();
      const currentHandlers = handlersRef.current;

      if (shortcutManager.matchesEvent(e, hotkeys.search)) {
        e.preventDefault();
        currentHandlers.onToggleSearch();
      } else if (shortcutManager.matchesEvent(e, hotkeys.newNote)) {
        e.preventDefault();
        currentHandlers.onCreateNote();
      } else if (shortcutManager.matchesEvent(e, hotkeys.closeTab)) {
        e.preventDefault();
        currentHandlers.onCloseTab();
      } else if (shortcutManager.matchesEvent(e, hotkeys.studyMode)) {
        e.preventDefault();
        currentHandlers.onToggleStudyMode();
      } else if (shortcutManager.matchesEvent(e, hotkeys.pomodoro)) {
        e.preventDefault();
        currentHandlers.onTogglePomodoro();
      } else if (shortcutManager.matchesEvent(e, hotkeys.zenMode)) {
        e.preventDefault();
        currentHandlers.onToggleZenMode();
      } else if (shortcutManager.matchesEvent(e, hotkeys.settings)) {
        e.preventDefault();
        currentHandlers.onToggleSettings();
      } else if ((e.altKey || e.metaKey) && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        currentHandlers.onCreateQuickNote();
      }

      if (e.key === 'Escape') {
        currentHandlers.onEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
