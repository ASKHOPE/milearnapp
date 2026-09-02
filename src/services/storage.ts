import type { Note, Folder, ThemeMode, Workspace, Book } from '../types';

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

// Starter Workspaces
const SAMPLE_WORKSPACES: Workspace[] = [
  {
    id: 'ws-personal',
    name: 'Personal Vault',
    icon: '🏠',
    color: '#4f46e5',
    description: 'Personal journal, goals, reading notes, and daily life',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws-work',
    name: 'Work & Startup',
    icon: '💼',
    color: '#0ea5e9',
    description: 'Engineering specs, sprint planning, and architecture',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws-creative',
    name: 'Creative Studio',
    icon: '🎨',
    color: '#8b5cf6',
    description: 'Design inspirations, hand sketches, and brainstorms',
    createdAt: new Date().toISOString()
  }
];

// Starter Books
const SAMPLE_BOOKS: Book[] = [
  {
    id: 'book-architecture',
    workspaceId: 'ws-work',
    title: 'Modern Software Architecture',
    icon: '📖',
    color: '#0ea5e9',
    description: 'Guide to local-first architecture and performance patterns',
    createdAt: new Date().toISOString()
  },
  {
    id: 'book-journal',
    workspaceId: 'ws-personal',
    title: 'Life Journal 2026',
    icon: '📓',
    color: '#10b981',
    description: 'Daily reflections, milestones, and habit tracker',
    createdAt: new Date().toISOString()
  }
];

// Starter Folders
const SAMPLE_FOLDERS: Folder[] = [
  {
    id: 'f-work',
    workspaceId: 'ws-work',
    name: 'Work & Projects',
    parentId: null,
    color: '#4f46e5',
    icon: 'briefcase',
    createdAt: new Date().toISOString()
  },
  {
    id: 'f-research',
    workspaceId: 'ws-work',
    name: 'AI Research',
    parentId: 'f-work',
    color: '#0ea5e9',
    icon: 'cpu',
    createdAt: new Date().toISOString()
  },
  {
    id: 'f-personal',
    workspaceId: 'ws-personal',
    name: 'Personal & Life',
    parentId: null,
    color: '#10b981',
    icon: 'smile',
    createdAt: new Date().toISOString()
  },
  {
    id: 'f-ideas',
    workspaceId: 'ws-personal',
    name: 'Ideas & Innovation',
    parentId: null,
    color: '#f59e0b',
    icon: 'lightbulb',
    createdAt: new Date().toISOString()
  }
];

// Starter Notes
const SAMPLE_NOTES: Note[] = [
  {
    id: 'n-welcome',
    workspaceId: 'ws-personal',
    title: 'Welcome to Noteflow ⚡',
    folderId: 'f-personal',
    bookId: null,
    parentPageId: null,
    pageOrder: 1,
    tags: ['welcome', 'guide', 'features'],
    isFavorite: true,
    isPinned: true,
    isArchived: false,
    isTrashed: false,
    content: `# Welcome to Noteflow ⚡

Noteflow is a local-first, privacy-respecting power note taking system built for Mac, iOS, and Web.

### 🌟 Key Power Features
- **Workspaces & Personas**: Switch between **Personal**, **Work**, and **Creative** spaces seamlessly.
- **Books & Pages**: Organize your thinking into structured books with ordered chapters and page-turn reader navigation.
- **Archive & Trash Bin**: Soft-delete items to the Trash Bin with 1-click restore or empty trash.
- **Omni-Format Export**: Export to PDF, Apple-grade Social PNG Cards, Standalone HTML, Markdown, and Plain Text.
- **Microphone Privacy**: Complete toggle to enable or disable audio features.
- **Infinite Knowledge Graph**: Zoom from a macro 5% galaxy overview to a 3000% micro card view.
- **Apple Sketchpad**: Draw freehand diagrams with stylus, touch, or mouse.

> [!TIP]
> Try typing \`/\` on an empty line for quick commands, or \`[[\` to link notes together!`,
    attachments: [],
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'n-book-page-1',
    workspaceId: 'ws-work',
    title: 'Chapter 1: Local-First Foundations',
    folderId: 'f-work',
    bookId: 'book-architecture',
    parentPageId: null,
    pageOrder: 1,
    tags: ['book', 'architecture', 'local-first'],
    isFavorite: true,
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    content: `# Chapter 1: Local-First Foundations
**Book**: [[Modern Software Architecture]] • **Page 1 of 2**

### 🏛️ The Seven Ideals of Local-First Software
1. **No spinners**: Your work at your fingertips with zero network latency.
2. **Your work is not trapped on one device**: Seamless sync across personal hardware.
3. **The network is optional**: Full functionality offline on trains or airplanes.
4. **Seamless collaboration**: Conflict-free resolution.
5. **Long-term data preservation**: Transparent formats (IndexedDB, Markdown, JSON).
6. **Security and privacy by default**: Zero cloud requirement.
7. **Ultimate user agency**: You own your files completely.

> [!NOTE]
> All Noteflow data is stored directly on your machine in IndexedDB.`,
    attachments: [],
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'n-book-page-2',
    workspaceId: 'ws-work',
    title: 'Chapter 2: Storage & Compression Strategies',
    folderId: 'f-work',
    bookId: 'book-architecture',
    parentPageId: null,
    pageOrder: 2,
    tags: ['book', 'storage', 'webp'],
    isFavorite: false,
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    content: `# Chapter 2: Storage & Compression Strategies
**Book**: [[Modern Software Architecture]] • **Page 2 of 2**

### 📦 Client-Side Canvas WebP Pipeline
When users attach diagrams, photos, or sketches, we process them client-side:
\`\`\`typescript
const webpUrl = canvas.toDataURL('image/webp', 0.82);
\`\`\`

### 📊 Benchmark Results
- **PNG Original**: 3.2 MB
- **WebP Optimized**: 240 KB (**92.5% reduction**)
- **Decode Speed**: < 12ms in browser memory

> [!TIP]
> Use the "Storage & Health" panel in Settings to view your browser quota!`,
    attachments: [],
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

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
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  },

  setTheme(theme: ThemeMode) {
    try {
      localStorage.setItem('noteflow_theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
      const meta = document.querySelector('meta[name="color-scheme"]');
      if (meta) meta.setAttribute('content', theme);
    } catch (e) {
      console.error('Failed to save theme', e);
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
