import type { HotkeyBindings, MouseSettings } from '../types';

const HOTKEYS_STORAGE_KEY = 'noteflow_custom_hotkeys';
const MOUSE_STORAGE_KEY = 'noteflow_mouse_settings';

export const DEFAULT_HOTKEYS: HotkeyBindings = {
  search: 'Meta+k',
  newNote: 'Meta+n',
  closeTab: 'Meta+w',
  findReplace: 'Meta+f',
  studyMode: 'Meta+Shift+s',
  pomodoro: 'Meta+Shift+p',
  zenMode: 'Meta+Shift+z',
  settings: 'Meta+,'
};

export const DEFAULT_MOUSE_SETTINGS: MouseSettings = {
  doubleClickAction: 'openNewTab',
  middleClickAction: 'closeTab',
  hoverPreview: 'delayed',
  smoothScroll: true
};

let inMemoryHotkeys: HotkeyBindings = { ...DEFAULT_HOTKEYS };
let inMemoryMouseSettings: MouseSettings = { ...DEFAULT_MOUSE_SETTINGS };

export const shortcutManager = {
  getHotkeys(): HotkeyBindings {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(HOTKEYS_STORAGE_KEY);
        if (raw) return { ...DEFAULT_HOTKEYS, ...JSON.parse(raw) };
      }
      return { ...inMemoryHotkeys };
    } catch {
      return { ...inMemoryHotkeys };
    }
  },

  saveHotkeys(bindings: HotkeyBindings): void {
    inMemoryHotkeys = { ...bindings };
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(HOTKEYS_STORAGE_KEY, JSON.stringify(bindings));
      }
    } catch {}
  },

  resetHotkeys(): HotkeyBindings {
    inMemoryHotkeys = { ...DEFAULT_HOTKEYS };
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(HOTKEYS_STORAGE_KEY);
      }
    } catch {}
    return { ...DEFAULT_HOTKEYS };
  },

  getMouseSettings(): MouseSettings {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(MOUSE_STORAGE_KEY);
        if (raw) return { ...DEFAULT_MOUSE_SETTINGS, ...JSON.parse(raw) };
      }
      return { ...inMemoryMouseSettings };
    } catch {
      return { ...inMemoryMouseSettings };
    }
  },

  saveMouseSettings(settings: MouseSettings): void {
    inMemoryMouseSettings = { ...settings };
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(MOUSE_STORAGE_KEY, JSON.stringify(settings));
      }
    } catch {}
  },

  /**
   * Tests if a keyboard event matches a configured hotkey string
   */
  matchesEvent(e: KeyboardEvent, hotkeyStr: string): boolean {
    if (!hotkeyStr) return false;
    const parts = hotkeyStr.split('+').map((p) => p.trim().toLowerCase());
    
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const metaReq = parts.includes('meta') || parts.includes('cmd');
    const ctrlReq = parts.includes('ctrl') || parts.includes('control');
    const shiftReq = parts.includes('shift');
    const altReq = parts.includes('alt') || parts.includes('opt');

    // On Mac, Meta is Command. On Windows/Linux, treat Meta as Ctrl if user wants
    const hasMeta = isMac ? e.metaKey : (e.ctrlKey || e.metaKey);
    const hasCtrl = e.ctrlKey;
    const hasShift = e.shiftKey;
    const hasAlt = e.altKey;

    if (metaReq && !hasMeta) return false;
    if (ctrlReq && !hasCtrl) return false;
    if (shiftReq && !hasShift) return false;
    if (altReq && !hasAlt) return false;

    // Find the key character (the non-modifier token)
    const keyToken = parts.find((p) => !['meta', 'cmd', 'ctrl', 'control', 'shift', 'alt', 'opt'].includes(p));
    if (!keyToken) return false;

    return e.key.toLowerCase() === keyToken.toLowerCase();
  },

  /**
   * Formats hotkey string for human-readable display on macOS / Windows
   */
  formatDisplayShortcut(shortcutStr: string): string {
    if (!shortcutStr) return '';
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    return shortcutStr
      .split('+')
      .map((part) => {
        const p = part.trim().toLowerCase();
        if (p === 'meta' || p === 'cmd') return isMac ? '⌘' : 'Ctrl';
        if (p === 'ctrl' || p === 'control') return isMac ? '⌃' : 'Ctrl';
        if (p === 'shift') return isMac ? '⇧' : 'Shift';
        if (p === 'alt' || p === 'opt') return isMac ? '⌥' : 'Alt';
        return part.toUpperCase();
      })
      .join(isMac ? '' : ' + ');
  }
};
