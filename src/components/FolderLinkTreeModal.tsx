import React, { useState, useMemo } from 'react';
import type { Note, Folder } from '../types';
import { flashcardService } from '../services/flashcards';
import { 
  GitFork, 
  X, 
  Folder as FolderIcon, 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  ExternalLink,
  ArrowRight,
  GraduationCap
} from 'lucide-react';

interface FolderLinkTreeModalProps {
  isOpen: boolean;
  folders: Folder[];
  notes: Note[];
  onClose: () => void;
  onSelectFolder: (folderId: string) => void;
  onSelectNote: (noteId: string) => void;
}

export const FolderLinkTreeModal: React.FC<FolderLinkTreeModalProps> = ({
  isOpen,
  folders,
  notes,
  onClose,
  onSelectFolder,
  onSelectNote
}) => {
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({
    'root': true,
    'f-work': true,
    'f-personal': true,
    'f-ideas': true
  });

  const retentionMap = useMemo(() => flashcardService.getRetentionMap(notes), [notes]);

  if (!isOpen) return null;

  const toggleBranch = (id: string) => {
    setExpandedBranches((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExpandAll = () => {
    const allIds: Record<string, boolean> = { 'root': true };
    folders.forEach((f) => { allIds[f.id] = true; });
    setExpandedBranches(allIds);
  };

  const handleCollapseAll = () => {
    setExpandedBranches({});
  };

  // Group folders hierarchically
  const rootFolders = folders.filter((f) => !f.parentId);
  const getSubfolders = (parentId: string) => folders.filter((f) => f.parentId === parentId);
  const getNotesForFolder = (folderId: string | null) => notes.filter((n) => n.folderId === folderId);

  const renderFolderBranch = (folder: Folder, depth = 0) => {
    const isExpanded = !!expandedBranches[folder.id];
    const subfolders = getSubfolders(folder.id);
    const folderNotes = getNotesForFolder(folder.id);

    const folderDueCount = folderNotes.filter((n) => retentionMap.get(n.id)?.status === 'due').length;
    const folderMasteredCount = folderNotes.filter((n) => retentionMap.get(n.id)?.status === 'mastered').length;

    return (
      <div 
        key={folder.id} 
        className="tree-root-card"
        style={{ marginLeft: `${depth * 20}px`, borderLeftColor: folder.color || '#6366f1' }}
      >
        {/* Folder Header / Branch Hub */}
        <div className="tree-folder-head" onClick={() => toggleBranch(folder.id)}>
          <div className="tree-folder-title">
            <button className="folder-toggle-btn">
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            <span 
              className="folder-color-dot" 
              style={{ backgroundColor: folder.color || '#6366f1', width: '10px', height: '10px' }} 
            />
            <span>{folder.name}</span>
            <span className="badge-count" style={{ marginLeft: '4px' }}>
              {folderNotes.length} note{folderNotes.length !== 1 ? 's' : ''}
            </span>
            {folderDueCount > 0 && (
              <span 
                className="badge-count" 
                style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#eab308', marginLeft: '4px' }}
                title={`${folderDueCount} cards due for review`}
              >
                {folderDueCount} Due
              </span>
            )}
            {folderMasteredCount > 0 && (
              <span 
                className="badge-count" 
                style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', marginLeft: '4px' }}
                title={`${folderMasteredCount} cards mastered`}
              >
                {folderMasteredCount} Mastered
              </span>
            )}
          </div>

          <button 
            className="header-btn"
            style={{ fontSize: '11px', padding: '3px 8px' }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectFolder(folder.id);
              onClose();
            }}
          >
            <span>Open Folder</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Expanded Note Links & Subfolder Children */}
        {isExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Direct Note Links (Link-Tree style) */}
            {folderNotes.length > 0 ? (
              <div className="tree-notes-grid">
                {folderNotes.map((note) => {
                  const ret = retentionMap.get(note.id);
                  return (
                    <div
                      key={note.id}
                      className="tree-note-item"
                      onClick={() => {
                        onSelectNote(note.id);
                        onClose();
                      }}
                      title={`Open note: ${note.title} (Retention: ${ret?.label || 'Unreviewed'})`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flex: 1 }}>
                        <FileText size={13} color="var(--accent-primary)" />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {note.title}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {ret && ret.status !== 'unreviewed' && (
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: `${ret.color}22`,
                              color: ret.color,
                              fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {ret.label}
                          </span>
                        )}
                        <ExternalLink size={11} color="var(--text-muted)" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ paddingLeft: '24px', fontSize: '11px', color: 'var(--text-muted)' }}>
                (No notes directly inside this folder)
              </div>
            )}

            {/* Subfolders */}
            {subfolders.map((child) => renderFolderBranch(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Notes without any folder (Root Notes)
  const rootNotes = getNotesForFolder(null);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '850px', maxHeight: '85vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitFork size={19} color="var(--accent-primary)" />
            <span>Folder Link Tree Visualizer</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <GraduationCap size={14} color="var(--accent-primary)" />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22c55e' }} /> Mastered
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#eab308' }} /> Due
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ef4444' }} /> Struggling
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              className="header-btn" 
              onClick={handleExpandAll}
              style={{ fontSize: '11px', padding: '3px 8px' }}
            >
              Expand All
            </button>
            <button 
              className="header-btn" 
              onClick={handleCollapseAll}
              style={{ fontSize: '11px', padding: '3px 8px' }}
            >
              Collapse
            </button>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          <div className="link-tree-wrapper">
            {/* Root Folders Branching */}
            {rootFolders.map((folder) => renderFolderBranch(folder, 0))}

            {/* Uncategorized / Root notes branch */}
            {rootNotes.length > 0 && (
              <div className="tree-root-card" style={{ borderLeftColor: '#94a3b8' }}>
                <div className="tree-folder-head" onClick={() => toggleBranch('root_uncategorized')}>
                  <div className="tree-folder-title">
                    <button className="folder-toggle-btn">
                      {expandedBranches['root_uncategorized'] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <FolderIcon size={16} color="#94a3b8" />
                    <span>Unfiled Notes</span>
                    <span className="badge-count">{rootNotes.length}</span>
                  </div>
                </div>

                {expandedBranches['root_uncategorized'] && (
                  <div className="tree-notes-grid">
                    {rootNotes.map((note) => {
                      const ret = retentionMap.get(note.id);
                      return (
                        <div
                          key={note.id}
                          className="tree-note-item"
                          onClick={() => {
                            onSelectNote(note.id);
                            onClose();
                          }}
                          title={`Open note: ${note.title} (Retention: ${ret?.label || 'Unreviewed'})`}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flex: 1 }}>
                            <FileText size={13} color="#94a3b8" />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {note.title}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {ret && ret.status !== 'unreviewed' && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: `${ret.color}22`,
                                  color: ret.color,
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {ret.label}
                              </span>
                            )}
                            <ExternalLink size={11} color="var(--text-muted)" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
