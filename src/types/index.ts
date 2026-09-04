export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export interface UserProfile {
  name: string;
  bio: string;
  role: string;
  avatarType: 'emoji' | 'gif' | 'image';
  avatarValue: string; // Emoji char, GIF URL, or uploaded base64 dataUrl
  mood: string;
}

export interface HotkeyBindings {
  search: string;
  newNote: string;
  closeTab: string;
  findReplace: string;
  studyMode: string;
  pomodoro: string;
  zenMode: string;
  settings: string;
}

export interface MouseSettings {
  doubleClickAction: 'openNewTab' | 'replaceTab' | 'toggleFavorite';
  middleClickAction: 'closeTab' | 'duplicateTab' | 'none';
  hoverPreview: 'instant' | 'delayed' | 'off';
  smoothScroll: boolean;
}

export interface SecuritySettings {
  autoLockMinutes: number; // 0 = disabled, 1, 5, 15, 30, 60
  lockAction: 'allNotes' | 'entireApp';
}

export type AttachmentType = 'image' | 'pdf' | 'document' | 'audio';

export interface Attachment {
  id: string;
  name: string;
  type: AttachmentType;
  size: number;
  mimeType: string;
  dataUrl: string; // Base64 or Blob URL
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string; // Emoji
  color: string;
  description?: string;
  createdAt: string;
}

export interface Book {
  id: string;
  workspaceId?: string | null;
  title: string;
  icon: string; // Emoji
  color: string;
  description?: string;
  createdAt: string;
}

export interface EncryptedPayload {
  salt: string;       // Base64 16-byte salt
  iv: string;         // Base64 12-byte IV
  ciphertext: string; // Base64 ciphertext with AES-GCM tag
  hint?: string;      // Optional reminder
  algorithm: 'AES-GCM-256';
  kdf: 'PBKDF2-SHA256-600K';
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  workspaceId?: string | null;
  bookId?: string | null;
  parentPageId?: string | null;
  pageOrder?: number;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  isArchived?: boolean;
  isTrashed?: boolean;
  trashedAt?: string | null;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  isLocked?: boolean;
  encryptedData?: EncryptedPayload | null;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  workspaceId?: string | null;
  color?: string;
  icon?: string;
  createdAt: string;
}

export type ViewFilter = 'all' | 'quick' | 'favorites' | 'recent' | 'attachments' | 'archive' | 'trash' | 'books';

export interface EditorSettings {
  autoSave: boolean;
  autoSaveDelayMs: number;
}

export interface GraphNode {
  id: string;
  title: string;
  folderId: string | null;
  folderName: string;
  folderColor?: string;
  tags: string[];
  connectionCount: number;
  attachmentCount: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'wikilink' | 'folder';
}

// --- Flashcard & Spaced Repetition Types (SM-2) ---
export interface Flashcard {
  id: string;
  noteId: string;
  noteTitle: string;
  question: string;
  answer: string;
  type: 'qa' | 'concept' | 'cloze' | 'cornell';
  repetition: number;
  interval: number; // in days
  easeFactor: number; // default 2.5
  nextReviewDate: string; // YYYY-MM-DD
  lastReviewed?: string;
  gradeHistory?: { date: string; grade: number }[];
}

// --- Pomodoro & Ambient Sound Types ---
export type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

export interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
}

export interface AmbientSoundTrack {
  id: 'rain' | 'waves' | 'fireplace' | 'binaural' | 'brownNoise';
  name: string;
  icon: string;
  isPlaying: boolean;
  volume: number; // 0 to 1
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Alex Mercer',
  bio: 'Staff Engineer • Local-First Systems & Mathematics Enthusiast',
  role: 'Systems Architect',
  avatarType: 'emoji',
  avatarValue: '⚡',
  mood: 'Deep Focus'
};

