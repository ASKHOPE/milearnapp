import React, { useState, useRef, useEffect } from 'react';
import { Folder, FolderPlus, Search, X, Pin, Check, Trash2, Edit2 } from 'lucide-react';
import type { Folder as FolderType, Note } from '../types';
import { ConfirmModal } from './common/ConfirmModal';

interface FolderSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: FolderType[];
  notes: Note[];
  currentFolderId: string | null;
  pinnedFolderIds: string[];
  onTogglePinFolder: (folderId: string) => void;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (name: string, parentId?: string | null) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onDeleteFolder?: (folderId: string) => void;
}

export const FolderSelectorModal: React.FC<FolderSelectorModalProps> = ({
  isOpen,
  onClose,
  folders,
  notes,
  currentFolderId,
  pinnedFolderIds,
  onTogglePinFolder,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder
}) => {
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [folderToDelete, setFolderToDelete] = useState<FolderType | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      // Don't close if confirmation modal is active
      if (folderToDelete) return;
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen, onClose, folderToDelete]);

  if (!isOpen) return null;

  const activeNotes = notes.filter((n) => !n.isTrashed);

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim());
    setNewFolderName('');
    setIsCreating(false);
  };

  const handleRename = (folderId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!editingName.trim()) return;
    onRenameFolder?.(folderId, editingName.trim());
    setEditingId(null);
  };

  return (
    <>
      <div className="popup-selector-overlay" onClick={onClose}>
        <div 
          className="popup-selector-card large" 
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="popup-selector-header">
            <div className="popup-selector-title">
              <Folder size={16} color="var(--accent-primary)" />
              <span>Browse & Pin Folders</span>
              <span className="badge-count-tiny">{folders.length} folders</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                className="btn-small-primary"
                onClick={() => setIsCreating(!isCreating)}
              >
                <FolderPlus size={12} />
                <span>{isCreating ? 'Close Form' : 'New Folder'}</span>
              </button>
              <button type="button" className="popup-close-btn" onClick={onClose}>
                <X size={14} />
              </button>
            </div>
          </div>

          {isCreating && (
            <form onSubmit={handleCreate} className="popup-inline-form">
              <div className="popup-form-input-wrap">
                <Folder size={15} color="var(--accent-primary)" />
                <input
                  type="text"
                  className="popup-form-input"
                  placeholder="Enter folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="popup-form-actions">
                <button 
                  type="button" 
                  className="ui-btn ui-btn-sm ui-btn-ghost" 
                  onClick={() => { setIsCreating(false); setNewFolderName(''); }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="ui-btn ui-btn-sm ui-btn-primary"
                  disabled={!newFolderName.trim()}
                >
                  Create Folder
                </button>
              </div>
            </form>
          )}

          <div className="popup-search-box">
            <Search size={13} className="popup-search-icon" />
            <input
              type="text"
              placeholder="Search folders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="popup-clear-search" onClick={() => setSearch('')}>
                <X size={12} />
              </button>
            )}
          </div>

          <div className="popup-items-scroll">
            {/* Root / All Notes option */}
            <div
              className={`popup-item-row ${currentFolderId === null ? 'active' : ''}`}
              onClick={() => {
                onSelectFolder(null);
                onClose();
              }}
            >
              <div className="popup-item-left">
                <Folder size={14} color="var(--text-muted)" />
                <span className="popup-item-name" style={{ fontStyle: 'italic' }}>All Folders (Root)</span>
              </div>
              <div className="popup-item-right">
                <span className="badge-count">{activeNotes.length} notes</span>
                {currentFolderId === null && <Check size={14} color="var(--accent-primary)" />}
              </div>
            </div>

            {filteredFolders.map((folder) => {
              const count = activeNotes.filter((n) => n.folderId === folder.id).length;
              const isSelected = currentFolderId === folder.id;
              const isPinned = pinnedFolderIds.includes(folder.id);

              return (
                <div
                  key={folder.id}
                  className={`popup-item-row ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    onSelectFolder(folder.id);
                    onClose();
                  }}
                >
                  <div className="popup-item-left">
                    <Folder size={14} style={{ color: folder.color || 'var(--accent-primary)' }} />
                    {editingId === folder.id ? (
                      <form onSubmit={(e) => handleRename(folder.id, e)} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          autoFocus
                          className="folder-input inline-edit"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => setEditingId(null)}
                        />
                      </form>
                    ) : (
                      <span className="popup-item-name">{folder.name}</span>
                    )}
                  </div>

                  <div className="popup-item-right" onClick={(e) => e.stopPropagation()}>
                    <span className="badge-count">{count} note{count !== 1 ? 's' : ''}</span>
                    
                    {/* Pin / Unpin Button */}
                    <button
                      type="button"
                      className={`popup-pin-btn ${isPinned ? 'pinned' : ''}`}
                      onClick={() => onTogglePinFolder(folder.id)}
                      title={isPinned ? 'Unpin from Sidebar' : 'Pin to Sidebar'}
                    >
                      <Pin size={12} fill={isPinned ? 'var(--accent-primary)' : 'none'} color={isPinned ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                    </button>

                    {/* Rename button */}
                    {onRenameFolder && (
                      <button
                        type="button"
                        className="popup-icon-action"
                        onClick={() => {
                          setEditingId(folder.id);
                          setEditingName(folder.name);
                        }}
                        title="Rename Folder"
                      >
                        <Edit2 size={11} />
                      </button>
                    )}

                    {/* Delete button */}
                    {onDeleteFolder && (
                      <button
                        type="button"
                        className="popup-action-btn danger"
                        onClick={() => setFolderToDelete(folder)}
                        title="Delete Folder"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}

                    {isSelected && <Check size={14} color="var(--accent-primary)" style={{ marginLeft: 4 }} />}
                  </div>
                </div>
              );
            })}

            {filteredFolders.length === 0 && (
              <div className="popup-empty-state">
                <p>No folders match "{search}"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Robust Styled Confirmation Popup for Deleting Folder */}
      <ConfirmModal
        isOpen={!!folderToDelete}
        onClose={() => setFolderToDelete(null)}
        onConfirm={() => {
          if (folderToDelete) {
            onDeleteFolder?.(folderToDelete.id);
            setFolderToDelete(null);
          }
        }}
        title="Delete Folder"
        itemName={folderToDelete?.name}
        message={
          <span>
            Are you sure you want to delete folder <strong>"{folderToDelete?.name}"</strong>? Any notes inside will not be deleted — they will become unfiled notes in your root collection.
          </span>
        }
        confirmText="Delete Folder"
      />
    </>
  );
};
