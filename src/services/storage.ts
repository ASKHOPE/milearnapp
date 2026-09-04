import { type Note, type Folder, type ThemeMode, type Workspace, type Book, type UserProfile, DEFAULT_USER_PROFILE } from '../types';

const DB_NAME = 'noteflow_db';
const DB_VERSION = 2;

// IndexedDB Helper
function openDB(): Promise<IDBDatabase> {
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
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
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

    const [workspaces, books, folders, notes] = await Promise.all([
      this.getWorkspaces(),
      this.getBooks(),
      this.getFolders(),
      this.getNotes()
    ]);

    // Seed default workspaces if empty
    if (workspaces.length === 0) {
      const tx = db.transaction('workspaces', 'readwrite');
      const store = tx.objectStore('workspaces');
      for (const ws of SAMPLE_WORKSPACES) {
        store.put(ws);
      }
      workspaces.push(...SAMPLE_WORKSPACES);
    }

    // Seed default books if empty
    if (books.length === 0) {
      const tx = db.transaction('books', 'readwrite');
      const store = tx.objectStore('books');
      for (const b of SAMPLE_BOOKS) {
        store.put(b);
      }
      books.push(...SAMPLE_BOOKS);
    }

    // Seed default folders if empty
    if (folders.length === 0) {
      const tx = db.transaction('folders', 'readwrite');
      const store = tx.objectStore('folders');
      for (const folder of SAMPLE_FOLDERS) {
        store.put(folder);
      }
      folders.push(...SAMPLE_FOLDERS);
    }

    // Seed default notes if empty
    if (notes.length === 0) {
      const tx = db.transaction('notes', 'readwrite');
      const store = tx.objectStore('notes');
      for (const note of SAMPLE_NOTES) {
        store.put(note);
      }
      notes.push(...SAMPLE_NOTES);
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

    return {
      workspaces: [...SAMPLE_WORKSPACES],
      books: [...SAMPLE_BOOKS],
      folders: [...SAMPLE_FOLDERS],
      notes: [...SAMPLE_NOTES]
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
    return new Promise((resolve, reject) => {
      const tx = db.transaction('workspaces', 'readwrite');
      const store = tx.objectStore('workspaces');
      const req = store.put(ws);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async deleteWorkspace(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('workspaces', 'readwrite');
      const store = tx.objectStore('workspaces');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
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
    return new Promise((resolve, reject) => {
      const tx = db.transaction('books', 'readwrite');
      const store = tx.objectStore('books');
      const req = store.put(book);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async deleteBook(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('books', 'readwrite');
      const store = tx.objectStore('books');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
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
    return new Promise((resolve, reject) => {
      const tx = db.transaction('notes', 'readwrite');
      const store = tx.objectStore('notes');
      const req = store.put(note);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async deleteNote(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('notes', 'readwrite');
      const store = tx.objectStore('notes');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async emptyTrash(): Promise<void> {
    const db = await openDB();
    const notes = await this.getNotes();
    const trashed = notes.filter((n) => n.isTrashed);

    return new Promise((resolve, reject) => {
      const tx = db.transaction('notes', 'readwrite');
      const store = tx.objectStore('notes');
      trashed.forEach((n) => store.delete(n.id));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
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
    return new Promise((resolve, reject) => {
      const tx = db.transaction('folders', 'readwrite');
      const store = tx.objectStore('folders');
      const req = store.put(folder);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async deleteFolder(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('folders', 'readwrite');
      const store = tx.objectStore('folders');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  // --- Theme ---
  getTheme(): ThemeMode {
    try {
      const saved = localStorage.getItem('noteflow_theme') as ThemeMode;
      if (saved === 'system' || saved === 'light' || saved === 'dark') return saved;
      return 'system';
    } catch {
      return 'system';
    }
  },

  resolveTheme(theme: ThemeMode): 'light' | 'dark' {
    if (theme === 'light' || theme === 'dark') return theme;
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
      if (meta) meta.setAttribute('content', resolved);
    } catch (e) {
      console.error('Failed to save theme', e);
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
    const payload = {
      app: 'Noteflow',
      version: 2,
      exportDate: new Date().toISOString(),
      workspaces,
      books,
      folders,
      notes
    };
    return JSON.stringify(payload, null, 2);
  },

  async importAllData(jsonStr: string): Promise<{ notes: Note[]; folders: Folder[]; workspaces: Workspace[]; books: Book[] }> {
    const parsed = JSON.parse(jsonStr);
    if (!parsed.notes || !parsed.folders) {
      throw new Error('Invalid Noteflow backup format');
    }

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

    for (const ws of parsed.workspaces || SAMPLE_WORKSPACES) {
      wsStore.put(ws);
    }
    for (const b of parsed.books || SAMPLE_BOOKS) {
      bookStore.put(b);
    }
    for (const folder of parsed.folders) {
      folderStore.put(folder);
    }
    for (const note of parsed.notes) {
      noteStore.put(note);
    }

    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
    });

    return { 
      notes: parsed.notes, 
      folders: parsed.folders, 
      workspaces: parsed.workspaces || SAMPLE_WORKSPACES,
      books: parsed.books || SAMPLE_BOOKS
    };
  }
};
