import React, { useState } from 'react';
import type { Folder as FolderType, Note, ViewFilter, Workspace, Book } from '../types';
import { 
  FileText, 
  Star, 
  Clock, 
  Folder, 
  FolderPlus, 
  Tag, 
  ChevronRight, 
  ChevronDown, 
  Trash2, 
  Edit2, 
  Paperclip,
  Download,
  Upload,
  Archive
} from 'lucide-react';

import { CalendarWidget } from './CalendarWidget';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { BookShelf } from './BookShelf';

interface SidebarProps {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  books: Book[];
  folders: FolderType[];
  notes: Note[];
  selectedNoteId: string | null;
  currentFilter: ViewFilter;
  currentFolderId: string | null;
  selectedTag: string | null;
  isOpenMobile: boolean;
  onSelectWorkspace: (id: string) => void;
  onCreateWorkspace: (name: string, icon: string, color: string, description: string) => void;
  onDeleteWorkspace: (id: string) => void;
  onCreateBook: (title: string, icon: string, color: string) => void;
  onDeleteBook: (bookId: string) => void;
  onAddPageToBook: (bookId: string) => void;
  onSelectNote: (noteId: string) => void;
  onSelectFilter: (filter: ViewFilter) => void;
  onSelectFolder: (folderId: string) => void;
  onSelectTag: (tag: string | null) => void;
  onSelectDate: (dateStr: string) => void;
  onOpenTodayNote: () => void;
  onCreateFolder: (name: string, parentId?: string | null) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  workspaces,
  activeWorkspaceId,
  books,
  folders,
  notes,
  selectedNoteId,
  currentFilter,
  currentFolderId,
  selectedTag,
  isOpenMobile,
  onSelectWorkspace,
  onCreateWorkspace,
  onDeleteWorkspace,
  onCreateBook,
  onDeleteBook,
  onAddPageToBook,
  onSelectNote,
  onSelectFilter,
  onSelectFolder,
  onSelectTag,
  onSelectDate,
  onOpenTodayNote,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onExportData,
  onImportData,
  onCloseMobile
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'f-work': true
  });
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [addingSubfolderTo, setAddingSubfolderTo] = useState<string | null>(null);
  const [subfolderName, setSubfolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');

  // Counts (Filtered to active/non-trashed unless viewing trash)
  const activeNotes = notes.filter((n) => !n.isTrashed && !n.isArchived);
  const totalNotes = activeNotes.length;
  const favoriteNotes = activeNotes.filter((n) => n.isFavorite).length;
  const withAttachments = activeNotes.filter((n) => n.attachments && n.attachments.length > 0).length;
  const archivedNotesCount = notes.filter((n) => n.isArchived && !n.isTrashed).length;
  const trashedNotesCount = notes.filter((n) => n.isTrashed).length;

  // Compute notes count per workspace
  const notesCountByWorkspace = new Map<string, number>();
  notes.forEach((n) => {
    if (!n.isTrashed) {
      const wsId = n.workspaceId || 'ws-personal';
      notesCountByWorkspace.set(wsId, (notesCountByWorkspace.get(wsId) || 0) + 1);
    }
  });

  // Extract all unique tags
  const allTags = Array.from(
    new Set(activeNotes.flatMap((n) => n.tags || []))
  ).filter(Boolean);

  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleCreateRootFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim(), null);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleCreateSubfolder = (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!subfolderName.trim()) return;
    onCreateFolder(subfolderName.trim(), parentId);
    setSubfolderName('');
    setAddingSubfolderTo(null);
    setExpandedFolders((prev) => ({ ...prev, [parentId]: true }));
  };

  const handleSaveRename = (folderId: string) => {
    if (editFolderName.trim()) {
      onRenameFolder(folderId, editFolderName.trim());
    }
    setEditingFolderId(null);
  };

  // Render Folders Recursively
  const renderFolderItem = (folder: FolderType, depth = 0) => {
    const subfolders = folders.filter((f) => f.parentId === folder.id);
    const hasSubfolders = subfolders.length > 0;
    const isExpanded = expandedFolders[folder.id];
    const isSelected = currentFolderId === folder.id;
    const isEditing = editingFolderId === folder.id;
    const folderNoteCount = activeNotes.filter((n) => n.folderId === folder.id).length;

    return (
      <li key={folder.id} className="folder-tree-item">
        <div 
          className={`sidebar-nav-item folder-row ${isSelected ? 'active' : ''}`}
          style={{ paddingLeft: `${8 + depth * 12}px` }}
          onClick={() => {
            onSelectFolder(folder.id);
            onCloseMobile();
          }}
        >
          <div className="nav-item-left" style={{ flex: 1, minWidth: 0 }}>
            {hasSubfolders ? (
              <button 
                className="folder-chevron-btn" 
                onClick={(e) => toggleFolder(folder.id, e)}
                title={isExpanded ? 'Collapse folder' : 'Expand folder'}
              >
                {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
            ) : (
              <span style={{ width: '13px', display: 'inline-block' }} />
            )}

            <Folder 
              size={14} 
              style={{ color: folder.color || 'var(--accent-primary)', flexShrink: 0 }} 
            />

            {isEditing ? (
              <input
                type="text"
                className="folder-rename-input"
                autoFocus
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename(folder.id);
                  if (e.key === 'Escape') setEditingFolderId(null);
                }}
                onBlur={() => handleSaveRename(folder.id)}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="folder-name-label">{folder.name}</span>
            )}
          </div>

          <div className="folder-actions-hover" onClick={(e) => e.stopPropagation()}>
            <span className="badge-count">{folderNoteCount}</span>
            <button
              className="folder-icon-btn"
              title="Add Subfolder"
              onClick={() => setAddingSubfolderTo(folder.id)}
            >
              <FolderPlus size={11} />
            </button>
            <button
              className="folder-icon-btn"
              title="Rename Folder"
              onClick={() => {
                setEditingFolderId(folder.id);
                setEditFolderName(folder.name);
              }}
            >
              <Edit2 size={11} />
            </button>
            <button
              className="folder-icon-btn danger"
              title="Delete Folder"
              onClick={() => onDeleteFolder(folder.id)}
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        {/* Subfolder inline creation */}
        {addingSubfolderTo === folder.id && (
          <form 
            onSubmit={(e) => handleCreateSubfolder(e, folder.id)}
            style={{ paddingLeft: `${24 + depth * 12}px`, paddingRight: '8px', margin: '4px 0' }}
          >
            <input
              type="text"
              autoFocus
              className="folder-input"
              placeholder="Subfolder name..."
              value={subfolderName}
              onChange={(e) => setSubfolderName(e.target.value)}
              onBlur={() => setAddingSubfolderTo(null)}
            />
          </form>
        )}

        {/* Nested Subfolders List */}
        {hasSubfolders && isExpanded && (
          <ul className="folder-nested-list">
            {subfolders.map((sub) => renderFolderItem(sub, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  const rootFolders = folders.filter((f) => !f.parentId);

  return (
    <>
      {isOpenMobile && (
        <div className="sidebar-backdrop mobile-only" onClick={onCloseMobile} />
      )}

      <aside className={`app-sidebar ${isOpenMobile ? 'open' : ''}`}>
        <div className="sidebar-scroll">
          {/* Workspace / Persona Switcher at Top */}
          <WorkspaceSwitcher
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            notesCountByWorkspace={notesCountByWorkspace}
            onSelectWorkspace={onSelectWorkspace}
            onCreateWorkspace={onCreateWorkspace}
            onDeleteWorkspace={onDeleteWorkspace}
          />

          {/* Section: Quick Views & Lifecycle */}
          <div>
            <div className="sidebar-section-title">Navigation</div>
            <ul className="sidebar-nav-list">
              <li 
                className={`sidebar-nav-item ${currentFilter === 'all' && !currentFolderId && !selectedTag ? 'active' : ''}`}
                onClick={() => {
                  onSelectFilter('all');
                  onCloseMobile();
                }}
              >
                <div className="nav-item-left">
                  <FileText size={15} />
                  <span>All Notes</span>
                </div>
                <span className="badge-count">{totalNotes}</span>
              </li>

              <li 
                className={`sidebar-nav-item ${currentFilter === 'favorites' ? 'active' : ''}`}
                onClick={() => {
                  onSelectFilter('favorites');
                  onCloseMobile();
                }}
              >
                <div className="nav-item-left">
                  <Star size={15} style={{ color: '#f59e0b' }} />
                  <span>Favorites</span>
                </div>
                <span className="badge-count">{favoriteNotes}</span>
              </li>

              <li 
                className={`sidebar-nav-item ${currentFilter === 'recent' ? 'active' : ''}`}
                onClick={() => {
                  onSelectFilter('recent');
                  onCloseMobile();
                }}
              >
                <div className="nav-item-left">
                  <Clock size={15} style={{ color: '#0ea5e9' }} />
                  <span>Recent Notes</span>
                </div>
              </li>

              <li 
                className={`sidebar-nav-item ${currentFilter === 'attachments' ? 'active' : ''}`}
                onClick={() => {
                  onSelectFilter('attachments');
                  onCloseMobile();
                }}
              >
                <div className="nav-item-left">
                  <Paperclip size={15} style={{ color: '#10b981' }} />
                  <span>With Files & Media</span>
                </div>
                <span className="badge-count">{withAttachments}</span>
              </li>

              {/* Archive Navigation */}
              <li 
                className={`sidebar-nav-item ${currentFilter === 'archive' ? 'active' : ''}`}
                onClick={() => {
                  onSelectFilter('archive');
                  onCloseMobile();
                }}
              >
                <div className="nav-item-left">
                  <Archive size={15} style={{ color: '#8b5cf6' }} />
                  <span>Archived Notes</span>
                </div>
                {archivedNotesCount > 0 && (
                  <span className="badge-count">{archivedNotesCount}</span>
                )}
              </li>

              {/* Trash Bin Navigation */}
              <li 
                className={`sidebar-nav-item ${currentFilter === 'trash' ? 'active' : ''}`}
                onClick={() => {
                  onSelectFilter('trash');
                  onCloseMobile();
                }}
              >
                <div className="nav-item-left">
                  <Trash2 size={15} style={{ color: '#ef4444' }} />
                  <span>Trash Bin</span>
                </div>
                {trashedNotesCount > 0 && (
                  <span className="badge-count" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                    {trashedNotesCount}
                  </span>
                )}
              </li>
            </ul>
          </div>

          {/* Section: Books & Notebooks */}
          <BookShelf
            books={books}
            notes={notes}
            selectedNoteId={selectedNoteId}
            onSelectNote={onSelectNote}
            onCreateBook={onCreateBook}
            onDeleteBook={onDeleteBook}
            onAddPageToBook={onAddPageToBook}
          />

          {/* Section: Calendar & Daily Log */}
          <div>
            <div className="sidebar-section-title">Calendar & Daily Notes</div>
            <div style={{ padding: '0 4px' }}>
              <CalendarWidget
                notes={notes}
                onSelectDate={onSelectDate}
                onOpenTodayNote={onOpenTodayNote}
              />
            </div>
          </div>

          {/* Section: Folders Hierarchy */}
          <div>
            <div className="sidebar-section-title">
              <span>Folders</span>
              <button 
                className="folder-action-btn"
                title="Create New Folder"
                onClick={() => setIsCreatingFolder(true)}
              >
                <FolderPlus size={13} />
              </button>
            </div>

            {isCreatingFolder && (
              <form onSubmit={handleCreateRootFolder} style={{ padding: '4px 8px' }}>
                <input
                  type="text"
                  autoFocus
                  className="folder-input"
                  placeholder="New folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onBlur={() => !newFolderName && setIsCreatingFolder(false)}
                />
              </form>
            )}

            <ul className="folder-tree-root">
              {rootFolders.map((folder) => renderFolderItem(folder))}
            </ul>
          </div>

          {/* Section: Tags */}
          {allTags.length > 0 && (
            <div>
              <div className="sidebar-section-title">Tags</div>
              <div className="sidebar-tags-cloud">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    className={`sidebar-tag-pill ${selectedTag === tag ? 'active' : ''}`}
                    onClick={() => {
                      onSelectTag(selectedTag === tag ? null : tag);
                      onCloseMobile();
                    }}
                  >
                    <Tag size={10} />
                    <span>#{tag}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer: Backup & Local Vault Export */}
        <div className="sidebar-footer">
          <button 
            className="sidebar-footer-btn"
            onClick={onExportData}
            title="Export local vault package (.noteflow)"
          >
            <Download size={13} />
            <span>Vault Backup</span>
          </button>

          <label 
            className="sidebar-footer-btn"
            title="Restore local vault package"
            style={{ cursor: 'pointer' }}
          >
            <Upload size={13} />
            <span>Restore</span>
            <input 
              type="file" 
              accept=".json,.noteflow" 
              onChange={onImportData} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>
      </aside>
    </>
  );
};
