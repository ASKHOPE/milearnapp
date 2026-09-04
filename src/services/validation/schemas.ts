import { z } from 'zod';
import type { Note, Folder, Workspace, Book, Flashcard } from '../../types/index.js';

// ==============================================================================
// Zod Runtime Validation Schemas for MiLEARNAPP Vault & API Endpoints
// ==============================================================================

export const EncryptedPayloadSchema = z.object({
  salt: z.string().min(1),
  iv: z.string().min(1),
  ciphertext: z.string().min(1),
  hint: z.string().optional(),
  algorithm: z.literal('AES-GCM-256'),
  kdf: z.literal('PBKDF2-SHA256-600K')
});

export const AttachmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['image', 'pdf', 'audio', 'video', 'document', 'archive', 'other']),
  size: z.number().nonnegative(),
  mimeType: z.string().default('application/octet-stream'),
  dataUrl: z.string().default(''),
  createdAt: z.string()
});

export const NoteSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  content: z.string(),
  folderId: z.string().nullable().optional(),
  workspaceId: z.string().nullable().optional(),
  bookId: z.string().nullable().optional(),
  parentPageId: z.string().nullable().optional(),
  pageOrder: z.number().optional(),
  tags: z.array(z.string()).default([]),
  isFavorite: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  isArchived: z.boolean().optional(),
  isTrashed: z.boolean().optional(),
  trashedAt: z.string().nullable().optional(),
  attachments: z.array(AttachmentSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
  isLocked: z.boolean().optional(),
  encryptedData: EncryptedPayloadSchema.nullable().optional()
});

export const FolderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  parentId: z.string().nullable().optional(),
  workspaceId: z.string().nullable().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  createdAt: z.string()
});

export const WorkspaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  icon: z.string().default('📁'),
  color: z.string().default('#4f46e5'),
  createdAt: z.string().optional()
});

export const BookSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().nullable().optional(),
  title: z.string().min(1),
  icon: z.string().default('📖'),
  color: z.string().default('#4f46e5'),
  description: z.string().optional(),
  createdAt: z.string()
});

export const FlashcardSchema = z.object({
  id: z.string().min(1),
  noteId: z.string().min(1),
  noteTitle: z.string(),
  question: z.string().min(1),
  answer: z.string(),
  type: z.enum(['qa', 'concept', 'cloze', 'cornell']).default('concept'),
  repetition: z.number().nonnegative().default(0),
  interval: z.number().nonnegative().default(1),
  easeFactor: z.number().min(1.3).default(2.5),
  nextReviewDate: z.string(),
  lastReviewed: z.string().optional(),
  gradeHistory: z.array(z.object({ date: z.string(), grade: z.number() })).optional(),
  isManual: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  deckCategory: z.string().optional()
});

export const SyncPayloadSchema = z.object({
  note: NoteSchema.optional(),
  folder: FolderSchema.optional(),
  workspace: WorkspaceSchema.optional(),
  book: BookSchema.optional(),
  flashcard: FlashcardSchema.optional()
}).refine((data) => {
  return Boolean(data.note || data.folder || data.workspace || data.book || data.flashcard);
}, {
  message: 'Sync payload must contain at least one entity (note, folder, workspace, book, or flashcard)'
});

export const VaultDataSchema = z.object({
  notes: z.array(NoteSchema).default([]),
  folders: z.array(FolderSchema).default([]),
  workspaces: z.array(WorkspaceSchema).default([]),
  books: z.array(BookSchema).default([]),
  flashcards: z.array(FlashcardSchema).optional(),
  exportedAt: z.string().optional()
});

export const ScrapeRequestSchema = z.object({
  url: z.string().url().refine((u) => u.startsWith('http://') || u.startsWith('https://'), {
    message: 'URL must use http or https protocol'
  })
});

// ==============================================================================
// Validation Helper Functions
// ==============================================================================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export function validateNote(data: unknown): ValidationResult<Note> {
  const res = NoteSchema.safeParse(data);
  if (res.success) {
    return { success: true, data: res.data as Note };
  }
  return {
    success: false,
    error: res.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
    fieldErrors: res.error.flatten().fieldErrors
  };
}

export function validateFolder(data: unknown): ValidationResult<Folder> {
  const res = FolderSchema.safeParse(data);
  if (res.success) {
    return { success: true, data: res.data as Folder };
  }
  return {
    success: false,
    error: res.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
    fieldErrors: res.error.flatten().fieldErrors
  };
}

export function validateFlashcard(data: unknown): ValidationResult<Flashcard> {
  const res = FlashcardSchema.safeParse(data);
  if (res.success) {
    return { success: true, data: res.data as Flashcard };
  }
  return {
    success: false,
    error: res.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
    fieldErrors: res.error.flatten().fieldErrors
  };
}

export function validateVaultData(data: unknown): ValidationResult<{
  notes: Note[];
  folders: Folder[];
  workspaces: Workspace[];
  books: Book[];
}> {
  const res = VaultDataSchema.safeParse(data);
  if (res.success) {
    return {
      success: true,
      data: {
        notes: res.data.notes as Note[],
        folders: res.data.folders as Folder[],
        workspaces: res.data.workspaces as Workspace[],
        books: res.data.books as Book[]
      }
    };
  }
  return {
    success: false,
    error: res.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
    fieldErrors: res.error.flatten().fieldErrors
  };
}

export function validateSyncPayload(data: unknown): ValidationResult<z.infer<typeof SyncPayloadSchema>> {
  const res = SyncPayloadSchema.safeParse(data);
  if (res.success) {
    return { success: true, data: res.data };
  }
  return {
    success: false,
    error: res.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
    fieldErrors: res.error.flatten().fieldErrors
  };
}

export function validateScrapeRequest(data: unknown): ValidationResult<{ url: string }> {
  const res = ScrapeRequestSchema.safeParse(data);
  if (res.success) {
    return { success: true, data: res.data };
  }
  return {
    success: false,
    error: res.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')
  };
}
