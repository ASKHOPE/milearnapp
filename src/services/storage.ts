import { type Note, type Folder, type ThemeMode, type ResolvedTheme, type TypographySettings, type Workspace, type Book, type UserProfile, DEFAULT_USER_PROFILE } from '../types';
import { validateVaultData } from './validation/schemas';
import { flashcardService } from './flashcards';
import { debugLogger } from './debugLogger';
import { syncQueue } from './syncQueue';

const DB_NAME = 'noteflow_db';
const DB_VERSION = 4;

// IndexedDB Helper
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('folders')) {
        db.createObjectStore('folders', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('workspaces')) {
        db.createObjectStore('workspaces', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('books')) {
        db.createObjectStore('books', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('flashcards')) {
        db.createObjectStore('flashcards', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('citations')) {
        db.createObjectStore('citations', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

let isBackendReachable: boolean | null = null;
let lastHealthCheck = 0;
const HEALTH_CHECK_TTL = 30000; // 30 seconds

/**
 * Intelligent healthcheck cache to prevent network error spam when operating offline or on Vercel
 */
export async function checkBackendHealth(): Promise<boolean> {
  const now = Date.now();
  if (isBackendReachable !== null && now - lastHealthCheck < HEALTH_CHECK_TTL) {
    return isBackendReachable;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('/api/health', { method: 'GET', signal: controller.signal });
    clearTimeout(timeoutId);
    isBackendReachable = res.ok;
  } catch {
    isBackendReachable = false;
  }
  lastHealthCheck = now;
  return isBackendReachable;
}

/**
 * Opportunistically dispatch synchronization payload to backend if reachable
 */
export function triggerSync(payload: Record<string, unknown>, label?: string): void {
  if (isBackendReachable === false) return;

  checkBackendHealth().then((reachable) => {
    if (reachable) {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then((res) => {
          if (!res.ok) {
            debugLogger.log('warn', 'sync', `${label || 'Item'} sync deferred: Server returned HTTP ${res.status}`);
          } else if (label) {
            debugLogger.log('success', 'sync', `${label} synced to backend`);
          }
        })
        .catch(() => {
          isBackendReachable = false;
        });
    }
  }).catch(() => {});
}

// Import Rich Seed Dataset
import {
  SAMPLE_WORKSPACES,
  SAMPLE_BOOKS,
  SAMPLE_FOLDERS,
  SAMPLE_NOTES
} from './seedData';

export { SAMPLE_WORKSPACES, SAMPLE_BOOKS, SAMPLE_FOLDERS, SAMPLE_NOTES };

export const storage = {
  async init(): Promise<{ notes: Note[]; folders: Folder[]; workspaces: Workspace[]; books: Book[] }> {
    const db = await openDB();
    const VAULT_INITIALIZED_KEY = 'milearn_vault_initialized';
    const isAlreadyInitialized = typeof localStorage !== 'undefined' && localStorage.getItem(VAULT_INITIALIZED_KEY) === 'true';

    // 1. Dynamic PostgreSQL Synchronization: Fetch live seeded data from PostgreSQL if backend is connected
    try {
      const isReachable = await checkBackendHealth();
      if (isReachable) {
        const apiRes = await fetch('/api/vault');
        if (apiRes.ok) {
          const vault = await apiRes.json();
          if (vault) {
            // If PostgreSQL has an initialized vault (at least one workspace exists), sync from PostgreSQL
            const hasPostgresVault = Array.isArray(vault.workspaces) && vault.workspaces.length > 0;
            if (hasPostgresVault) {
            const tx = db.transaction(['workspaces', 'books', 'folders', 'notes'], 'readwrite');
            const wsStore = tx.objectStore('workspaces');
            const bStore = tx.objectStore('books');
            const fStore = tx.objectStore('folders');
            const nStore = tx.objectStore('notes');

            wsStore.clear();
            bStore.clear();
            fStore.clear();
            nStore.clear();

            if (Array.isArray(vault.workspaces)) for (const ws of vault.workspaces) wsStore.put(ws);
            if (Array.isArray(vault.books)) for (const b of vault.books) bStore.put(b);
            if (Array.isArray(vault.folders)) for (const f of vault.folders) fStore.put(f);
            if (Array.isArray(vault.notes)) for (const n of vault.notes) nStore.put(n);

            await new Promise<void>((resolve, reject) => {
              tx.oncomplete = () => resolve();
              tx.onerror = () => reject(tx.error);
            });

            if (vault.user) {
              this.setUserProfile(vault.user);
            }

            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(VAULT_INITIALIZED_KEY, 'true');
            }

            return {
              notes: vault.notes || [],
              folders: vault.folders || [],
              workspaces: vault.workspaces || [],
              books: vault.books || []
            };
          }
        }
      }
    }
  } catch {
    // Offline fallback
  }

    const [workspaces, books, folders, notes] = await Promise.all([
      this.getWorkspaces(),
      this.getBooks(),
      this.getFolders(),
      this.getNotes()
    ]);

    // Only seed sample default data on first launch if the vault has never been initialized
    if (!isAlreadyInitialized) {
      if (workspaces.length === 0) {
        const tx = db.transaction('workspaces', 'readwrite');
        const store = tx.objectStore('workspaces');
        for (const ws of SAMPLE_WORKSPACES) {
          store.put(ws);
        }
        workspaces.push(...SAMPLE_WORKSPACES);
      }

      if (books.length === 0) {
        const tx = db.transaction('books', 'readwrite');
        const store = tx.objectStore('books');
        for (const b of SAMPLE_BOOKS) {
          store.put(b);
        }
        books.push(...SAMPLE_BOOKS);
      }

      if (folders.length === 0) {
        const tx = db.transaction('folders', 'readwrite');
        const store = tx.objectStore('folders');
        for (const folder of SAMPLE_FOLDERS) {
          store.put(folder);
        }
        folders.push(...SAMPLE_FOLDERS);
      }

      if (notes.length === 0) {
        const tx = db.transaction('notes', 'readwrite');
        const store = tx.objectStore('notes');
        for (const note of SAMPLE_NOTES) {
          store.put(note);
        }
        notes.push(...SAMPLE_NOTES);
      }

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(VAULT_INITIALIZED_KEY, 'true');
      }
    } else {
      // Migration: Ensure all existing notes have workspaceId and flags
      const tx = db.transaction('notes', 'readwrite');
      const store = tx.objectStore('notes');
      notes.forEach((n) => {
        let changed = false;
        if (!n.workspaceId) {
          n.workspaceId = 'ws-personal';
          changed = true;
        }
        if (n.isArchived === undefined) {
          n.isArchived = false;
          changed = true;
        }
        if (n.isTrashed === undefined) {
          n.isTrashed = false;
          changed = true;
        }
        if (changed) {
          store.put(n);
        }
      });
    }

    return { notes, folders, workspaces, books };
  },

  /**
   * Resets and re-seeds the entire database with the full interactive tutorial dataset
   */
  async reseedTutorialVault(): Promise<{ notes: Note[]; folders: Folder[]; workspaces: Workspace[]; books: Book[] }> {
    if (typeof indexedDB !== 'undefined') {
      const db = await openDB();
      const tx = db.transaction(['workspaces', 'books', 'folders', 'notes'], 'readwrite');

      const wsStore = tx.objectStore('workspaces');
      const bStore = tx.objectStore('books');
      const fStore = tx.objectStore('folders');
      const nStore = tx.objectStore('notes');

      wsStore.clear();
      bStore.clear();
      fStore.clear();
      nStore.clear();

      for (const ws of SAMPLE_WORKSPACES) wsStore.put(ws);
      for (const b of SAMPLE_BOOKS) bStore.put(b);
      for (const f of SAMPLE_FOLDERS) fStore.put(f);
      for (const n of SAMPLE_NOTES) nStore.put(n);

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('milearn_vault_initialized', 'true');
    }

    return {
      workspaces: [...SAMPLE_WORKSPACES],
      books: [...SAMPLE_BOOKS],
      folders: [...SAMPLE_FOLDERS],
      notes: [...SAMPLE_NOTES]
    };
  },

  /**
   * Resets the vault to a completely clean slate (empty state with 1 personal workspace and 1 clean note)
   */
  async createCleanSlateVault(): Promise<{ notes: Note[]; folders: Folder[]; workspaces: Workspace[]; books: Book[] }> {
    const cleanWorkspace: Workspace = {
      id: 'ws-personal',
      name: 'Personal',
      icon: '👤',
      color: '#6366f1',
      description: 'Your private personal workspace',
      createdAt: new Date().toISOString()
    };

    const cleanFolder: Folder = {
      id: 'f-quick',
      name: 'Quick Notes',
      color: '#6366f1',
      workspaceId: 'ws-personal',
      parentId: null,
      createdAt: new Date().toISOString()
    };

    const cleanNote: Note = {
      id: 'n-welcome',
      title: 'Welcome to your Workspace',
      content: `# Welcome to MiLEARNAPP\n\nThis is your clean workspace. Start writing, brainstorming, or studying right away.\n\n### Quick Tips:\n- Press **Cmd+N** / **Ctrl+N** to create a new note\n- Press **Cmd+K** / **Ctrl+K** for Spotlight Search\n- Type **/** for commands and formatting\n- Use **$math$** for KaTeX formulas and \`\`\`mermaid for diagrams\n`,
      folderId: 'f-quick',
      workspaceId: 'ws-personal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['getting-started'],
      attachments: [],
      isFavorite: true,
      isPinned: true,
      isArchived: false,
      isTrashed: false,
      isLocked: false
    };

    if (typeof indexedDB !== 'undefined') {
      const db = await openDB();
      const tx = db.transaction(['workspaces', 'books', 'folders', 'notes', 'flashcards'], 'readwrite');

      const wsStore = tx.objectStore('workspaces');
      const bStore = tx.objectStore('books');
      const fStore = tx.objectStore('folders');
      const nStore = tx.objectStore('notes');
      const fcStore = tx.objectStore('flashcards');

      wsStore.clear();
      bStore.clear();
      fStore.clear();
      nStore.clear();
      fcStore.clear();

      wsStore.put(cleanWorkspace);
      fStore.put(cleanFolder);
      nStore.put(cleanNote);

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('milearn_vault_initialized', 'true');
      localStorage.setItem('noteflow_active_workspace', 'ws-personal');
    }

    try {
      await this.syncToPostgres();
    } catch {
      // offline safe
    }

    return {
      workspaces: [cleanWorkspace],
      books: [],
      folders: [cleanFolder],
      notes: [cleanNote]
    };
  },

  // --- Workspaces ---
  async getWorkspaces(): Promise<Workspace[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('workspaces', 'readonly');
      const store = tx.objectStore('workspaces');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async saveWorkspace(ws: Workspace): Promise<void> {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('workspaces', 'readwrite');
      const store = tx.objectStore('workspaces');
      const req = store.put(ws);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    syncQueue.enqueueMutation(syncQueue.createMutation({
      entityType: 'workspace',
      entityId: ws.id,
      action: 'upsert',
      payload: ws as unknown as Record<string, unknown>
    })).catch(() => {});

    triggerSync({ workspace: ws }, `Workspace "${ws.name}"`);
  },

  async deleteWorkspace(id: string): Promise<void> {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('workspaces', 'readwrite');
      const store = tx.objectStore('workspaces');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    syncQueue.enqueueMutation(syncQueue.createMutation({
      entityType: 'workspace',
      entityId: id,
      action: 'delete'
    })).catch(() => {});

    triggerSync({ deleteWorkspaceId: id });
  },

  // --- Books ---
  async getBooks(): Promise<Book[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('books', 'readonly');
      const store = tx.objectStore('books');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async saveBook(book: Book): Promise<void> {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('books', 'readwrite');
      const store = tx.objectStore('books');
      const req = store.put(book);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    syncQueue.enqueueMutation(syncQueue.createMutation({
      entityType: 'book',
      entityId: book.id,
      action: 'upsert',
      payload: book as unknown as Record<string, unknown>
    })).catch(() => {});

    triggerSync({ book }, `Book "${book.title}"`);
  },

  async deleteBook(id: string): Promise<void> {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('books', 'readwrite');
      const store = tx.objectStore('books');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    syncQueue.enqueueMutation(syncQueue.createMutation({
      entityType: 'book',
      entityId: id,
      action: 'delete'
    })).catch(() => {});

    triggerSync({ deleteBookId: id });
  },

  // --- Notes ---
  async getNotes(): Promise<Note[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('notes', 'readonly');
      const store = tx.objectStore('notes');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async saveNote(note: Note): Promise<void> {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('notes', 'readwrite');
      const store = tx.objectStore('notes');
      const req = store.put(note);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    syncQueue.enqueueMutation(syncQueue.createMutation({
      entityType: 'note',
      entityId: note.id,
      action: 'upsert',
      payload: note as unknown as Record<string, unknown>
    })).catch(() => {});

    debugLogger.log('info', 'storage', `Note saved locally to IndexedDB: "${note.title}"`);
    triggerSync({ note }, `Note "${note.title}"`);
  },

  async deleteNote(id: string): Promise<void> {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('notes', 'readwrite');
      const store = tx.objectStore('notes');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    syncQueue.enqueueMutation(syncQueue.createMutation({
      entityType: 'note',
      entityId: id,
      action: 'delete'
    })).catch(() => {});

    triggerSync({ deleteNoteId: id });
  },

  async emptyTrash(): Promise<void> {
    const db = await openDB();
    const notes = await this.getNotes();
    const trashed = notes.filter((n) => n.isTrashed);

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('notes', 'readwrite');
      const store = tx.objectStore('notes');
      trashed.forEach((n) => store.delete(n.id));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    triggerSync({ emptyTrash: true });
  },

  // --- Folders ---
  async getFolders(): Promise<Folder[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('folders', 'readonly');
      const store = tx.objectStore('folders');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async saveFolder(folder: Folder): Promise<void> {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('folders', 'readwrite');
      const store = tx.objectStore('folders');
      const req = store.put(folder);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    syncQueue.enqueueMutation(syncQueue.createMutation({
      entityType: 'folder',
      entityId: folder.id,
      action: 'upsert',
      payload: folder as unknown as Record<string, unknown>
    })).catch(() => {});

    triggerSync({ folder }, `Folder "${folder.name}"`);
  },

  async deleteFolder(id: string): Promise<void> {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('folders', 'readwrite');
      const store = tx.objectStore('folders');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    syncQueue.enqueueMutation(syncQueue.createMutation({
      entityType: 'folder',
      entityId: id,
      action: 'delete'
    })).catch(() => {});

    triggerSync({ deleteFolderId: id });
  },

  // --- PostgreSQL / Server Synchronization & Diagnostics ---
  async syncToPostgres(): Promise<{ success: boolean; count?: Record<string, number>; error?: string }> {
    try {
      const reachable = await checkBackendHealth();
      if (!reachable) {
        debugLogger.log('info', 'sync', 'Standalone offline mode active. All data safely retained locally in IndexedDB.');
        return {
          success: true,
          count: { offline: 1 }
        };
      }

      const [workspaces, books, folders, notes] = await Promise.all([
        this.getWorkspaces(),
        this.getBooks(),
        this.getFolders(),
        this.getNotes()
      ]);
      const flashcards = flashcardService.getFlashcards();

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullSync: { workspaces, books, folders, notes, flashcards }
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        debugLogger.log('error', 'sync', `Sync failed with HTTP ${res.status}: ${errText}`);
        throw new Error(`Sync HTTP error ${res.status}: ${errText}`);
      }

      const healthRes = await fetch('/api/health');
      const healthData = healthRes.ok ? await healthRes.json() : null;

      debugLogger.log('success', 'sync', `Bi-directional sync succeeded. Notes in PostgreSQL: ${healthData?.count?.notes ?? notes.length}`);

      return {
        success: true,
        count: healthData?.count
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      debugLogger.log('warn', 'sync', `PostgreSQL sync error: ${msg}`);
      return {
        success: false,
        error: msg
      };
    }
  },

  async syncWithServer(): Promise<{ success: boolean; count?: Record<string, number>; error?: string }> {
    return this.syncToPostgres();
  },

  async fetchPostgresHealth(): Promise<{ status: string; count?: Record<string, number> }> {
    try {
      const reachable = await checkBackendHealth();
      if (!reachable) {
        return { status: 'offline' };
      }
      const res = await fetch('/api/health');
      if (res.ok) {
        return await res.json();
      }
      return { status: 'offline' };
    } catch {
      return { status: 'offline' };
    }
  },

  // --- Theme ---
  getTheme(): ThemeMode {
    try {
      const saved = localStorage.getItem('noteflow_theme') as ThemeMode;
      const validThemes: ThemeMode[] = ['system', 'light', 'dark', 'oled', 'tokyo', 'nordic', 'editorial'];
      if (saved && validThemes.includes(saved)) return saved;
      return 'system';
    } catch {
      return 'system';
    }
  },

  resolveTheme(theme: ThemeMode): ResolvedTheme {
    if (theme !== 'system') return theme;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  },

  setTheme(theme: ThemeMode) {
    try {
      localStorage.setItem('noteflow_theme', theme);
      const resolved = this.resolveTheme(theme);
      document.documentElement.setAttribute('data-theme', resolved);
      const meta = document.querySelector('meta[name="color-scheme"]');
      if (meta) {
        meta.setAttribute('content', resolved === 'light' || resolved === 'editorial' ? 'light' : 'dark');
      }
    } catch (e) {
      console.error('Failed to save theme', e);
    }
  },

  // --- UI Layout & Interaction Settings ---
  getUiLayoutSettings(): { showSidebarCalendar: boolean; sidebarCollapsed: boolean; noteListCollapsed: boolean } {
    try {
      const saved = localStorage.getItem('milearnapp_ui_layout');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      showSidebarCalendar: true,
      sidebarCollapsed: false,
      noteListCollapsed: false
    };
  },

  setUiLayoutSettings(settings: { showSidebarCalendar: boolean; sidebarCollapsed: boolean; noteListCollapsed: boolean }) {
    try {
      localStorage.setItem('milearnapp_ui_layout', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save UI layout settings', e);
    }
  },

  // --- Typography Settings ---
  getTypographySettings(): TypographySettings {
    try {
      const saved = localStorage.getItem('milearnapp_typography');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      fontFamily: 'sans',
      fontScale: 'base',
      lineHeight: 'normal'
    };
  },

  setTypographySettings(settings: TypographySettings) {
    try {
      localStorage.setItem('milearnapp_typography', JSON.stringify(settings));
      document.documentElement.setAttribute('data-font', settings.fontFamily);
      document.documentElement.setAttribute('data-scale', settings.fontScale);
      document.documentElement.setAttribute('data-line-height', settings.lineHeight);
    } catch (e) {
      console.error('Failed to save typography settings', e);
    }
  },

  // --- User Profile ---
  getUserProfile(): UserProfile {
    try {
      const raw = localStorage.getItem('noteflow_user_profile');
      if (!raw) return { ...DEFAULT_USER_PROFILE };
      return { ...DEFAULT_USER_PROFILE, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_USER_PROFILE };
    }
  },

  setUserProfile(profile: UserProfile): void {
    try {
      localStorage.setItem('noteflow_user_profile', JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save user profile', e);
    }
  },

  // --- Microphone Privacy Toggle ---
  isMicEnabled(): boolean {
    try {
      const val = localStorage.getItem('noteflow_mic_enabled');
      return val === null ? true : val === 'true';
    } catch {
      return true;
    }
  },

  setMicEnabled(enabled: boolean) {
    try {
      localStorage.setItem('noteflow_mic_enabled', enabled ? 'true' : 'false');
    } catch (e) {
      console.error('Failed to save mic setting', e);
    }
  },

  // --- Active Workspace Persistence ---
  getActiveWorkspaceId(): string {
    try {
      return localStorage.getItem('noteflow_active_workspace') || 'ws-personal';
    } catch {
      return 'ws-personal';
    }
  },

  setActiveWorkspaceId(id: string) {
    try {
      localStorage.setItem('noteflow_active_workspace', id);
    } catch (e) {
      console.error('Failed to save active workspace', e);
    }
  },

  // --- Backup & Restore (.noteflow bundle) ---
  async exportAllData(): Promise<string> {
    const [notes, folders, workspaces, books] = await Promise.all([
      this.getNotes(),
      this.getFolders(),
      this.getWorkspaces(),
      this.getBooks()
    ]);
    const flashcards = flashcardService.getFlashcards();
    const payload = {
      app: 'Noteflow',
      version: 2,
      exportDate: new Date().toISOString(),
      workspaces,
      books,
      folders,
      notes,
      flashcards
    };
    debugLogger.log('info', 'storage', `Exported full vault: ${notes.length} notes, ${folders.length} folders, ${flashcards.length} cards`);
    return JSON.stringify(payload, null, 2);
  },

  async importAllData(jsonStr: string): Promise<{ notes: Note[]; folders: Folder[]; workspaces: Workspace[]; books: Book[] }> {
    const parsed = JSON.parse(jsonStr);
    const validation = validateVaultData(parsed);
    if (!validation.success || !validation.data) {
      throw new Error(`Invalid Noteflow backup format: ${validation.error || 'Schema validation failed'}`);
    }
    const validatedData = validation.data;

    const db = await openDB();
    const tx = db.transaction(['notes', 'folders', 'workspaces', 'books'], 'readwrite');
    const noteStore = tx.objectStore('notes');
    const folderStore = tx.objectStore('folders');
    const wsStore = tx.objectStore('workspaces');
    const bookStore = tx.objectStore('books');

    await new Promise<void>((resolve, reject) => {
      const c1 = noteStore.clear();
      const c2 = folderStore.clear();
      const c3 = wsStore.clear();
      const c4 = bookStore.clear();
      c1.onsuccess = () => {
        c2.onsuccess = () => {
          c3.onsuccess = () => {
            c4.onsuccess = () => resolve();
          };
        };
      };
      c1.onerror = () => reject(c1.error);
    });

    for (const ws of validatedData.workspaces) {
      wsStore.put(ws);
    }
    for (const b of validatedData.books) {
      bookStore.put(b);
    }
    for (const folder of validatedData.folders) {
      folderStore.put(folder);
    }
    for (const note of validatedData.notes) {
      noteStore.put(note);
    }

    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
    });

    // Restore flashcards if present in backup
    if (validatedData.flashcards && Array.isArray(validatedData.flashcards)) {
      flashcardService.saveFlashcards(validatedData.flashcards);
    }

    debugLogger.log('success', 'storage', `Imported vault locally to IndexedDB (${validatedData.notes.length} notes). Initiating PostgreSQL sync...`);

    // Synchronize newly imported dataset directly with PostgreSQL
    try {
      await this.syncToPostgres();
      debugLogger.log('success', 'sync', 'Imported vault synchronized successfully with PostgreSQL container.');
    } catch {
      debugLogger.log('warn', 'sync', 'PostgreSQL offline; imported vault safely active in IndexedDB.');
    }

    return { 
      notes: validatedData.notes, 
      folders: validatedData.folders, 
      workspaces: validatedData.workspaces,
      books: validatedData.books
    };
  }
};
