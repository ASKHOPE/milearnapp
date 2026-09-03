import { describe, it, expect, beforeEach } from 'bun:test';
import { internalMindService } from '../src/services/internalMind';
import { shortcutManager } from '../src/services/shortcutManager';
import { inactivityLockManager } from '../src/services/inactivityLock';
import type { Note } from '../src/types';

describe('Internal Mind / Knowledge Lexicon & Hierarchy Tests', () => {
  const sampleNotes: Note[] = [
    {
      id: 'note-1',
      title: 'Local-First Architecture',
      content: `# Local-First Architecture\n\nLocal-First Software :: Software where data ownership belongs unconditionally to client devices.\n\nKey pillars include CRDTs and zero-knowledge encryption with [[AES-256-GCM]].\n\n**Conflict-Free Replicated Data Types**: Data structures that guarantee eventual consistency.\n\n- [ ] Deploy client-side SQLite\n- [x] Integrate AES-256-GCM tags\n`,
      folderId: 'folder-tech',
      workspaceId: 'ws-work',
      tags: ['architecture', 'local-first'],
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z'
    },
    {
      id: 'note-2',
      title: 'AES-256-GCM Encryption',
      content: `# AES-256-GCM Encryption\n\nAES-256-GCM :: Authenticated encryption cipher providing confidentiality and MITM integrity.\n\nReferenced in [[Local-First Architecture]]. Also depends on PBKDF2 derivation.\n`,
      folderId: 'folder-sec',
      workspaceId: 'ws-work',
      tags: ['security', 'cryptography'],
      createdAt: '2026-09-02T00:00:00Z',
      updatedAt: '2026-09-02T00:00:00Z'
    }
  ];

  it('indexes concepts, definitions, wikilinks, and tags into a unified lexicon', () => {
    const { concepts, analytics } = internalMindService.buildDictionary(sampleNotes);
    expect(concepts.length).toBeGreaterThan(0);
    expect(analytics.totalTerms).toBeGreaterThan(0);

    // Concept :: Definition check
    const localFirstConcept = concepts.find((c) => c.term.toLowerCase().includes('local-first software'));
    expect(localFirstConcept).toBeDefined();
    expect(localFirstConcept?.definition).toContain('Software where data ownership belongs unconditionally');

    // Wikilink concept check
    const aesLink = concepts.find((c) => c.term === 'AES-256-GCM');
    expect(aesLink).toBeDefined();
    expect(aesLink?.occurrences.length).toBeGreaterThanOrEqual(1);
  });

  it('computes vocabulary richness and concept clusters', () => {
    const { analytics } = internalMindService.buildDictionary(sampleNotes);
    expect(analytics.vocabularyRichness).toBeGreaterThan(0);
    expect(analytics.vocabularyRichness).toBeLessThanOrEqual(100);
    expect(analytics.conceptClusters.length).toBeGreaterThanOrEqual(1);
  });

  it('searches and filters dictionary concepts by keyword and tag', () => {
    const { concepts } = internalMindService.buildDictionary(sampleNotes);
    const searchResults = internalMindService.searchDictionary(concepts, 'software');
    expect(searchResults.length).toBeGreaterThan(0);

    const tagResults = internalMindService.searchDictionary(concepts, '', 'architecture');
    expect(tagResults.length).toBeGreaterThan(0);
  });
});

describe('Shortcut Manager & Mouse Customizer Tests', () => {
  beforeEach(() => {
    shortcutManager.resetHotkeys();
  });

  it('returns default hotkey configuration and formats display shortcuts', () => {
    const hotkeys = shortcutManager.getHotkeys();
    expect(hotkeys.search).toBe('Meta+k');
    expect(hotkeys.newNote).toBe('Meta+n');
    expect(hotkeys.closeTab).toBe('Meta+w');

    const formatted = shortcutManager.formatDisplayShortcut(hotkeys.search);
    expect(formatted).toContain('K');
  });

  it('correctly matches keyboard events against keybindings', () => {
    const metaKEvent = {
      metaKey: true,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      key: 'k'
    } as KeyboardEvent;

    expect(shortcutManager.matchesEvent(metaKEvent, 'Meta+k')).toBe(true);
    expect(shortcutManager.matchesEvent(metaKEvent, 'Meta+n')).toBe(false);

    const shiftPomodoroEvent = {
      metaKey: true,
      ctrlKey: false,
      shiftKey: true,
      altKey: false,
      key: 'p'
    } as KeyboardEvent;

    expect(shortcutManager.matchesEvent(shiftPomodoroEvent, 'Meta+Shift+p')).toBe(true);
  });

  it('saves and retrieves customized hotkeys and mouse preferences', () => {
    const customHotkeys = { ...shortcutManager.getHotkeys(), search: 'Meta+Shift+f' };
    shortcutManager.saveHotkeys(customHotkeys);
    expect(shortcutManager.getHotkeys().search).toBe('Meta+Shift+f');

    const customMouse = {
      doubleClickAction: 'replaceTab' as const,
      middleClickAction: 'duplicateTab' as const,
      hoverPreview: 'instant' as const,
      smoothScroll: false
    };
    shortcutManager.saveMouseSettings(customMouse);
    expect(shortcutManager.getMouseSettings().doubleClickAction).toBe('replaceTab');
    expect(shortcutManager.getMouseSettings().middleClickAction).toBe('duplicateTab');
    expect(shortcutManager.getMouseSettings().hoverPreview).toBe('instant');
  });
});

describe('Inactivity Auto-Lock Manager Tests', () => {
  it('loads default security settings and updates preferences', () => {
    const settings = inactivityLockManager.getSettings();
    expect(settings.autoLockMinutes).toBeGreaterThanOrEqual(0);

    inactivityLockManager.saveSettings({ autoLockMinutes: 5, lockAction: 'entireApp' });
    expect(inactivityLockManager.getSettings().autoLockMinutes).toBe(5);
    expect(inactivityLockManager.getSettings().lockAction).toBe('entireApp');
  });

  it('triggers callback when idle threshold is exceeded', () => {
    let triggered = false;
    inactivityLockManager.saveSettings({ autoLockMinutes: 1, lockAction: 'entireApp' });
    inactivityLockManager.start(() => {
      triggered = true;
    });

    expect(inactivityLockManager.getRemainingSeconds()).toBe(60);
    inactivityLockManager.triggerImmediateLock();
    expect(triggered).toBe(true);

    inactivityLockManager.stop();
  });
});
