export type ThemeMode = 'light' | 'dark';

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

export type ViewFilter = 'all' | 'favorites' | 'recent' | 'attachments' | 'archive' | 'trash' | 'books';

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
