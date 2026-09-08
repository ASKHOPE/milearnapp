/**
 * Server-Side PostgreSQL Database Service
 * 
 * Provides unified queries, relational mapping, and full vault synchronization
 * directly with PostgreSQL 16.
 */

import pg from 'pg';
import type { Note, Workspace, Book, Folder, Flashcard, UserProfile, SyncMutation } from '../../types/index.js';

const { Pool } = pg;

const rawUrl = process.env.DATABASE_URL || 'postgresql://milearn:milearn_password@localhost:5432/milearndb';
const DATABASE_URL = rawUrl.replace(/\?.*$/, '');

export function maskConnectionString(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '••••••••';
    }
    return decodeURI(parsed.toString());
  } catch {
    return url.replace(/:([^:@]+)@/, ':••••••••@');
  }
}

let activePool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 4000
});

export const pool = new Proxy({} as pg.Pool, {
  get(_target, prop, receiver) {
    const value = Reflect.get(activePool, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(activePool);
    }
    return value;
  }
});

export interface TypingPassage {
  id: string;
  title: string;
  category: 'Tech' | 'Science' | 'Code' | 'Wisdom';
  difficulty: 'beginner' | 'intermediate' | 'expert' | 'code';
  text: string;
}

export interface CitationRecord {
  id: string;
  title: string;
  authors: string[];
  year: number;
  container: string;
  bibtex: string;
  tags: string[];
  isLandmark: boolean;
}

export interface CustomWordRecord {
  id: string;
  word: string;
  definition: string;
  partOfSpeech?: string;
  example?: string;
  tags: string[];
}

export interface AbbreviationRecord {
  id: string;
  prefix: string;
  expansion: string;
  category?: string;
  description?: string;
}

export interface VaultPayload {
  user: UserProfile;
  workspaces: Workspace[];
  books: Book[];
  folders: Folder[];
  notes: Note[];
  flashcards: Flashcard[];
  typingPassages: TypingPassage[];
  citations: CitationRecord[];
  customWords: CustomWordRecord[];
  abbreviations: AbbreviationRecord[];
}

export const serverDb = {
  /**
   * Retrieves active database configuration and masked URL
   */
  getActiveConfig(): { connectionString: string; maskedUrl: string; isCustom: boolean } {
    const currentUrl = process.env.DATABASE_URL || DATABASE_URL;
    return {
      connectionString: currentUrl,
      maskedUrl: maskConnectionString(currentUrl),
      isCustom: currentUrl !== 'postgresql://milearn:milearn_password@localhost:5432/milearndb'
    };
  },

  /**
   * Initializes or migrates required database tables on target pool
   */
  async init(targetPool?: pg.Pool): Promise<void> {
    const current = targetPool || activePool;
    const client = await current.connect();
    try {
      try {
        const fs = await import('node:fs');
        const path = await import('node:path');
        const schemaPath = path.resolve(process.cwd(), 'src/services/db/schema.sql');
        if (fs.existsSync(schemaPath)) {
          const sql = fs.readFileSync(schemaPath, 'utf8');
          await client.query(sql);
          return;
        }
      } catch {
        // Fall back to direct minimal table creation if schema.sql read fails
      }

      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          email VARCHAR(255) UNIQUE,
          name VARCHAR(255),
          bio TEXT,
          role VARCHAR(100) DEFAULT 'Systems Architect',
          avatar_type VARCHAR(20) DEFAULT 'emoji',
          avatar_value TEXT DEFAULT '⚡',
          mood VARCHAR(100) DEFAULT 'Deep Focus',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS workspaces (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64),
          name VARCHAR(255) NOT NULL,
          icon VARCHAR(32) DEFAULT '💼',
          color VARCHAR(32) DEFAULT '#6366f1',
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS books (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64),
          workspace_id VARCHAR(64),
          title VARCHAR(255) NOT NULL,
          icon VARCHAR(32) DEFAULT '📖',
          color VARCHAR(32) DEFAULT '#10b981',
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS folders (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64),
          workspace_id VARCHAR(64),
          name VARCHAR(255) NOT NULL,
          parent_id VARCHAR(64),
          color VARCHAR(32),
          icon VARCHAR(32),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS notes (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64),
          workspace_id VARCHAR(64),
          folder_id VARCHAR(64),
          book_id VARCHAR(64),
          parent_page_id VARCHAR(64),
          page_order INTEGER DEFAULT 0,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL DEFAULT '',
          tags TEXT[] DEFAULT ARRAY[]::TEXT[],
          is_favorite BOOLEAN DEFAULT FALSE,
          is_pinned BOOLEAN DEFAULT FALSE,
          is_archived BOOLEAN DEFAULT FALSE,
          is_trashed BOOLEAN DEFAULT FALSE,
          trashed_at TIMESTAMP WITH TIME ZONE,
          is_locked BOOLEAN DEFAULT FALSE,
          encrypted_data JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS flashcards (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64),
          note_id VARCHAR(64),
          note_title VARCHAR(255) NOT NULL,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          type VARCHAR(32) DEFAULT 'qa',
          repetition INTEGER DEFAULT 0,
          interval INTEGER DEFAULT 1,
          ease_factor NUMERIC(4, 2) DEFAULT 2.50,
          next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
          last_reviewed DATE,
          grade_history JSONB DEFAULT '[]'::jsonb,
          is_manual BOOLEAN DEFAULT FALSE,
          tags TEXT[] DEFAULT ARRAY[]::TEXT[],
          deck_category VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } finally {
      client.release();
    }
  },

  /**
   * Tests connection to an arbitrary PostgreSQL URL without changing active pool
   */
  async testConnection(connectionString: string): Promise<{ success: boolean; version?: string; database?: string; user?: string; error?: string }> {
    if (!connectionString || typeof connectionString !== 'string') {
      return { success: false, error: 'Connection string is required' };
    }
    let testPool: pg.Pool | null = null;
    try {
      testPool = new Pool({
        connectionString,
        max: 1,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 1000
      });
      const client = await testPool.connect();
      try {
        const res = await client.query('SELECT version(), current_database() as database, current_user as "user"');
        const row = res.rows[0] || {};
        return {
          success: true,
          version: row.version,
          database: row.database,
          user: row.user
        };
      } finally {
        client.release();
      }
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err)
      };
    } finally {
      if (testPool) {
        await testPool.end().catch(() => {});
      }
    }
  },

  /**
   * Reconfigures server pool to use a new PostgreSQL connection string,
   * runs schema migrations, and drains the previous pool.
   */
  async reconfigureConnection(newConnectionString: string): Promise<{ success: boolean; database?: string; user?: string; error?: string }> {
    const test = await this.testConnection(newConnectionString);
    if (!test.success) {
      return {
        success: false,
        error: test.error || 'Connection failed'
      };
    }

    const oldPool = activePool;
    const nextPool = new Pool({
      connectionString: newConnectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });

    try {
      await this.init(nextPool);
      activePool = nextPool;
      process.env.DATABASE_URL = newConnectionString;

      if (oldPool) {
        oldPool.end().catch(() => {});
      }

      return {
        success: true,
        database: test.database,
        user: test.user
      };
    } catch (err: unknown) {
      await nextPool.end().catch(() => {});
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err)
      };
    }
  },

  /**
   * Healthcheck to verify database connectivity
   */
  async checkHealth(): Promise<{ status: string; count: Record<string, number> }> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        SELECT 'users' AS tbl, count(*) FROM users
        UNION ALL SELECT 'workspaces', count(*) FROM workspaces
        UNION ALL SELECT 'books', count(*) FROM books
        UNION ALL SELECT 'folders', count(*) FROM folders
        UNION ALL SELECT 'notes', count(*) FROM notes
        UNION ALL SELECT 'flashcards', count(*) FROM flashcards
        UNION ALL SELECT 'typing_passages', count(*) FROM typing_passages
        UNION ALL SELECT 'citations', count(*) FROM citations
      `);
      const counts: Record<string, number> = {};
      for (const row of res.rows) {
        counts[row.tbl] = parseInt(row.count, 10);
      }
      return { status: 'healthy', count: counts };
    } finally {
      client.release();
    }
  },

  /**
   * Fetches the entire synchronized vault dataset directly from PostgreSQL
   */
  async getVaultData(): Promise<VaultPayload> {
    const client = await pool.connect();
    try {
      // 1. User
      const userRes = await client.query(`SELECT * FROM users LIMIT 1`);
      const u = userRes.rows[0];
      const user: UserProfile = u ? {
        name: u.name,
        bio: u.bio || '',
        role: u.role || 'Systems Architect',
        avatarType: (u.avatar_type || 'emoji') as 'emoji' | 'gif' | 'image',
        avatarValue: u.avatar_value || '⚡',
        mood: u.mood || 'Deep Focus'
      } : {
        name: 'Alex Mercer',
        bio: 'Staff Engineer • Local-First Systems & Mathematics Enthusiast',
        role: 'Systems Architect',
        avatarType: 'emoji',
        avatarValue: '⚡',
        mood: 'Deep Focus'
      };

      // 2. Workspaces
      const wsRes = await client.query(`SELECT * FROM workspaces ORDER BY created_at ASC`);
      const workspaces: Workspace[] = wsRes.rows.map(r => ({
        id: r.id,
        name: r.name,
        icon: r.icon,
        color: r.color,
        description: r.description || undefined,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
      }));

      // 3. Books
      const booksRes = await client.query(`SELECT * FROM books ORDER BY created_at ASC`);
      const books: Book[] = booksRes.rows.map(r => ({
        id: r.id,
        workspaceId: r.workspace_id || null,
        title: r.title,
        icon: r.icon,
        color: r.color,
        description: r.description || undefined,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
      }));

      // 4. Folders
      const foldersRes = await client.query(`SELECT * FROM folders ORDER BY created_at ASC`);
      const folders: Folder[] = foldersRes.rows.map(r => ({
        id: r.id,
        workspaceId: r.workspace_id || 'ws-personal',
        name: r.name,
        parentId: r.parent_id || null,
        color: r.color || undefined,
        icon: r.icon || undefined,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
      }));

      // 5. Notes
      const notesRes = await client.query(`SELECT * FROM notes ORDER BY updated_at DESC`);
      const notes: Note[] = notesRes.rows.map(r => ({
        id: r.id,
        workspaceId: r.workspace_id || 'ws-personal',
        folderId: r.folder_id || null,
        bookId: r.book_id || null,
        parentPageId: r.parent_page_id || null,
        pageOrder: r.page_order ?? 0,
        title: r.title,
        content: r.content || '',
        tags: Array.isArray(r.tags) ? r.tags : [],
        isFavorite: !!r.is_favorite,
        isPinned: !!r.is_pinned,
        isArchived: !!r.is_archived,
        isTrashed: !!r.is_trashed,
        trashedAt: r.trashed_at ? new Date(r.trashed_at).toISOString() : null,
        attachments: [],
        isLocked: !!r.is_locked,
        encryptedData: r.encrypted_data || null,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString()
      }));

      // 6. Flashcards
      const fcRes = await client.query(`SELECT * FROM flashcards ORDER BY created_at ASC`);
      const flashcards: Flashcard[] = fcRes.rows.map(r => ({
        id: r.id,
        noteId: r.note_id || undefined,
        noteTitle: r.note_title,
        question: r.question,
        answer: r.answer,
        type: (r.type || 'qa') as 'qa' | 'concept' | 'cloze',
        repetition: r.repetition || 0,
        interval: r.interval || 1,
        easeFactor: typeof r.ease_factor === 'number' ? r.ease_factor : parseFloat(r.ease_factor) || 2.5,
        nextReviewDate: r.next_review_date ? new Date(r.next_review_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        lastReviewed: r.last_reviewed ? new Date(r.last_reviewed).toISOString().split('T')[0] : undefined,
        gradeHistory: Array.isArray(r.grade_history) ? r.grade_history : [],
        isManual: !!r.is_manual,
        tags: Array.isArray(r.tags) ? r.tags : [],
        deckCategory: r.deck_category || undefined
      }));

      // 7. Typing Passages
      const tpRes = await client.query(`SELECT * FROM typing_passages ORDER BY id ASC`);
      const typingPassages: TypingPassage[] = tpRes.rows.map(r => ({
        id: r.id,
        title: r.title,
        category: r.category,
        difficulty: r.difficulty,
        text: r.text
      }));

      // 8. Citations
      const citRes = await client.query(`SELECT * FROM citations ORDER BY year DESC, title ASC`);
      const citations: CitationRecord[] = citRes.rows.map(r => ({
        id: r.id,
        title: r.title,
        authors: Array.isArray(r.authors) ? r.authors : [],
        year: r.year || 2024,
        container: r.container || '',
        bibtex: r.bibtex,
        tags: Array.isArray(r.tags) ? r.tags : [],
        isLandmark: !!r.is_landmark
      }));

      // 9. Custom Words
      const cwRes = await client.query(`SELECT * FROM custom_words ORDER BY word ASC`);
      const customWords: CustomWordRecord[] = cwRes.rows.map(r => ({
        id: r.id,
        word: r.word,
        definition: r.definition,
        partOfSpeech: r.part_of_speech || undefined,
        example: r.example || undefined,
        tags: Array.isArray(r.tags) ? r.tags : []
      }));

      // 10. Abbreviations
      const abbRes = await client.query(`SELECT * FROM abbreviations ORDER BY prefix ASC`);
      const abbreviations: AbbreviationRecord[] = abbRes.rows.map(r => ({
        id: r.id,
        prefix: r.prefix,
        expansion: r.expansion,
        category: r.category || undefined,
        description: r.description || undefined
      }));

      return {
        user,
        workspaces,
        books,
        folders,
        notes,
        flashcards,
        typingPassages,
        citations,
        customWords,
        abbreviations
      };
    } finally {
      client.release();
    }
  },

  /**
   * Synchronizes notes and state from client back to PostgreSQL
   */
  async syncNote(note: Note, userId = 'user-default'): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(
        `
        INSERT INTO notes (
          id, user_id, workspace_id, folder_id, book_id, parent_page_id, page_order,
          title, content, tags, is_favorite, is_pinned, is_archived, is_trashed,
          is_locked, encrypted_data, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
        ON CONFLICT (id) DO UPDATE SET
          workspace_id = EXCLUDED.workspace_id,
          folder_id = EXCLUDED.folder_id,
          book_id = EXCLUDED.book_id,
          parent_page_id = EXCLUDED.parent_page_id,
          page_order = EXCLUDED.page_order,
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          tags = EXCLUDED.tags,
          is_favorite = EXCLUDED.is_favorite,
          is_pinned = EXCLUDED.is_pinned,
          is_archived = EXCLUDED.is_archived,
          is_trashed = EXCLUDED.is_trashed,
          is_locked = EXCLUDED.is_locked,
          encrypted_data = EXCLUDED.encrypted_data,
          updated_at = NOW();
        `,
        [
          note.id,
          userId,
          note.workspaceId || 'ws-personal',
          note.folderId || null,
          note.bookId || null,
          note.parentPageId || null,
          note.pageOrder || 0,
          note.title,
          note.content || '',
          note.tags || [],
          !!note.isFavorite,
          !!note.isPinned,
          !!note.isArchived,
          !!note.isTrashed,
          !!note.isLocked,
          note.encryptedData ? JSON.stringify(note.encryptedData) : null
        ]
      );
    } finally {
      client.release();
    }
  },

  /**
   * Synchronize a folder with PostgreSQL
   */
  async syncFolder(folder: Folder, userId = 'user-default'): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(
        `
        INSERT INTO folders (id, user_id, workspace_id, name, parent_id, color, icon)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          workspace_id = EXCLUDED.workspace_id,
          name = EXCLUDED.name,
          parent_id = EXCLUDED.parent_id,
          color = EXCLUDED.color,
          icon = EXCLUDED.icon;
        `,
        [folder.id, userId, folder.workspaceId || 'ws-personal', folder.name, folder.parentId || null, folder.color || null, folder.icon || null]
      );
    } finally {
      client.release();
    }
  },

  /**
   * Synchronize a workspace with PostgreSQL
   */
  async syncWorkspace(ws: Workspace, userId = 'user-default'): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(
        `
        INSERT INTO workspaces (id, user_id, name, icon, color, description)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          icon = EXCLUDED.icon,
          color = EXCLUDED.color,
          description = EXCLUDED.description;
        `,
        [ws.id, userId, ws.name, ws.icon || '💼', ws.color || '#6366f1', ws.description || null]
      );
    } finally {
      client.release();
    }
  },

  /**
   * Synchronize a book with PostgreSQL
   */
  async syncBook(book: Book, userId = 'user-default'): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(
        `
        INSERT INTO books (id, user_id, workspace_id, title, icon, color, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          workspace_id = EXCLUDED.workspace_id,
          title = EXCLUDED.title,
          icon = EXCLUDED.icon,
          color = EXCLUDED.color,
          description = EXCLUDED.description;
        `,
        [book.id, userId, book.workspaceId || 'ws-personal', book.title, book.icon || '📖', book.color || '#10b981', book.description || null]
      );
    } finally {
      client.release();
    }
  },

  /**
   * Synchronize a flashcard (retention grade, interval, ease factor) with PostgreSQL
   */
  async syncFlashcard(fc: Flashcard, userId = 'user-default'): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(
        `
        INSERT INTO flashcards (
          id, user_id, note_id, note_title, question, answer, type,
          repetition, interval, ease_factor, next_review_date, last_reviewed,
          grade_history, is_manual, tags, deck_category
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO UPDATE SET
          repetition = EXCLUDED.repetition,
          interval = EXCLUDED.interval,
          ease_factor = EXCLUDED.ease_factor,
          next_review_date = EXCLUDED.next_review_date,
          last_reviewed = EXCLUDED.last_reviewed,
          grade_history = EXCLUDED.grade_history,
          is_manual = EXCLUDED.is_manual,
          tags = EXCLUDED.tags,
          deck_category = EXCLUDED.deck_category;
        `,
        [
          fc.id,
          userId,
          fc.noteId || null,
          fc.noteTitle,
          fc.question,
          fc.answer,
          fc.type,
          fc.repetition,
          fc.interval,
          fc.easeFactor,
          fc.nextReviewDate,
          fc.lastReviewed || null,
          JSON.stringify(fc.gradeHistory || []),
          !!fc.isManual,
          fc.tags || [],
          fc.deckCategory || null
        ]
      );
    } finally {
      client.release();
    }
  },

  /**
   * Full bi-directional synchronization payload from client
   */
  async fullSync(payload: { notes?: Note[]; folders?: Folder[]; workspaces?: Workspace[]; books?: Book[]; flashcards?: Flashcard[] }): Promise<void> {
    if (payload.workspaces) {
      for (const ws of payload.workspaces) await this.syncWorkspace(ws);
    }
    if (payload.books) {
      for (const b of payload.books) await this.syncBook(b);
    }
    if (payload.folders) {
      for (const f of payload.folders) await this.syncFolder(f);
    }
    if (payload.notes) {
      for (const n of payload.notes) await this.syncNote(n);
    }
    if (payload.flashcards) {
      for (const fc of payload.flashcards) await this.syncFlashcard(fc);
    }
  },

  /**
   * Delete a note from PostgreSQL
   */
  async deleteNote(id: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM notes WHERE id = $1', [id]);
    } finally {
      client.release();
    }
  },

  /**
   * Empty all trashed notes from PostgreSQL
   */
  async emptyTrash(userId = 'user-default'): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM notes WHERE is_trashed = true AND (user_id = $1 OR user_id IS NULL)', [userId]);
    } finally {
      client.release();
    }
  },

  /**
   * Delete a folder from PostgreSQL
   */
  async deleteFolder(id: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM folders WHERE id = $1', [id]);
    } finally {
      client.release();
    }
  },

  /**
   * Delete a book from PostgreSQL
   */
  async deleteBook(id: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM books WHERE id = $1', [id]);
    } finally {
      client.release();
    }
  },

  /**
   * Delete a workspace from PostgreSQL
   */
  async deleteWorkspace(id: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM workspaces WHERE id = $1', [id]);
    } finally {
      client.release();
    }
  },

  /**
   * Process a differential delta sync batch:
   * 1. Applies client mutations using Last-Write-Wins (LWW)
   * 2. Pulls remote notes modified since sinceTimestamp
   */
  async syncDelta(params: {
    sinceTimestamp: number;
    clientMutations: SyncMutation[];
    deviceId: string;
  }): Promise<{
    appliedMutationIds: string[];
    serverMutations: SyncMutation[];
    latestServerTimestamp: number;
  }> {
    const appliedMutationIds: string[] = [];
    const serverMutations: SyncMutation[] = [];
    const now = Date.now();

    for (const m of params.clientMutations) {
      try {
        if (m.entityType === 'note') {
          if (m.action === 'delete') {
            await this.deleteNote(m.entityId);
          } else if (m.action === 'upsert' && m.payload) {
            await this.syncNote(m.payload as unknown as Note);
          }
        } else if (m.entityType === 'folder') {
          if (m.action === 'delete') {
            await this.deleteFolder(m.entityId);
          } else if (m.action === 'upsert' && m.payload) {
            await this.syncFolder(m.payload as unknown as Folder);
          }
        } else if (m.entityType === 'workspace') {
          if (m.action === 'delete') {
            await this.deleteWorkspace(m.entityId);
          } else if (m.action === 'upsert' && m.payload) {
            await this.syncWorkspace(m.payload as unknown as Workspace);
          }
        } else if (m.entityType === 'book') {
          if (m.action === 'delete') {
            await this.deleteBook(m.entityId);
          } else if (m.action === 'upsert' && m.payload) {
            await this.syncBook(m.payload as unknown as Book);
          }
        }
        appliedMutationIds.push(m.id);
      } catch {
        // Individual mutation failures are skipped to avoid halting the batch
      }
    }

    // Query notes updated since sinceTimestamp
    try {
      const client = await pool.connect();
      try {
        const sinceIso = new Date(params.sinceTimestamp).toISOString();
        const res = await client.query(`
          SELECT n.*, array_remove(array_agg(t.name), NULL) AS tags
          FROM notes n
          LEFT JOIN note_tags nt ON n.id = nt.note_id
          LEFT JOIN tags t ON nt.tag_id = t.id
          WHERE n.updated_at > $1
          GROUP BY n.id
        `, [sinceIso]);

        for (const row of res.rows) {
          const note: Note = {
            id: row.id,
            title: row.title,
            content: row.content || '',
            folderId: row.folder_id || null,
            workspaceId: row.workspace_id || 'ws-personal',
            bookId: row.book_id || null,
            tags: row.tags || [],
            attachments: [],
            isPinned: Boolean(row.is_pinned),
            isFavorite: Boolean(row.is_favorite),
            isArchived: Boolean(row.is_archived),
            isTrashed: Boolean(row.is_trashed),
            isLocked: Boolean(row.is_locked),
            createdAt: new Date(row.created_at).toISOString(),
            updatedAt: new Date(row.updated_at).toISOString()
          };

          serverMutations.push({
            id: `srv-${row.id}-${Date.now()}`,
            entityType: 'note',
            entityId: row.id,
            action: 'upsert',
            payload: note as unknown as Record<string, unknown>,
            timestamp: new Date(note.updatedAt).getTime(),
            deviceId: 'server',
            synced: true
          });
        }
      } finally {
        client.release();
      }
    } catch {
      // Offline or mock database fallback
    }

    return {
      appliedMutationIds,
      serverMutations,
      latestServerTimestamp: now
    };
  }
};



