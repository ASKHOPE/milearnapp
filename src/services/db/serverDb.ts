/**
 * Server-Side PostgreSQL Database Service
 * 
 * Provides unified queries, relational mapping, and full vault synchronization
 * directly with PostgreSQL 16.
 */

import pg from 'pg';
import type { Note, Workspace, Book, Folder, Flashcard, UserProfile } from '../../types/index.js';

const { Pool } = pg;

const rawUrl = process.env.DATABASE_URL || 'postgresql://milearn:milearn_password@localhost:5432/milearndb';
const DATABASE_URL = rawUrl.replace(/\?.*$/, '');

export const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 4000
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
        workspaceId: r.workspace_id || 'ws-milearn',
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
        workspaceId: r.workspace_id || 'ws-milearn',
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
          note.workspaceId || 'ws-milearn',
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
        [folder.id, userId, folder.workspaceId || 'ws-milearn', folder.name, folder.parentId || null, folder.color || null, folder.icon || null]
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
        [book.id, userId, book.workspaceId || 'ws-milearn', book.title, book.icon || '📖', book.color || '#10b981', book.description || null]
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
  }
};

