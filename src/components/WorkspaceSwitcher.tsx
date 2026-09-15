import React, { useState, useEffect } from 'react';
import type { Workspace } from '../types';
import { ChevronDown, Plus, Check, Trash2, Sparkles, X, Edit2 } from 'lucide-react';

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  notesCountByWorkspace: Map<string, number>;
  onSelectWorkspace: (id: string) => void;
  onCreateWorkspace: (name: string, icon: string, color: string, description: string) => void;
  onRenameWorkspace?: (id: string, newName: string, newIcon?: string, newColor?: string) => void;
  onDeleteWorkspace: (id: string) => void;
  compact?: boolean;
  variant?: 'dock' | 'header' | 'dropdown' | 'title';
  isExternalCreateOpen?: boolean;
  onCloseExternalCreate?: () => void;
}

const WS_EMOJIS = ['🏠', '💼', '🎨', '🚀', '🔬', '📚', '⚡', '🌿', '💡', '🧪', '🌐', '🎯'];
const WS_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  workspaces,
  activeWorkspaceId,
  notesCountByWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
  onRenameWorkspace,
  onDeleteWorkspace,
  compact = false,
  variant = 'dock',
  isExternalCreateOpen = false,
  onCloseExternalCreate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🚀');
  const [selectedColor, setSelectedColor] = useState('#4f46e5');

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  useEffect(() => {
    if (isExternalCreateOpen) {
      setEditingWorkspace(null);
      setName('');
      setDescription('');
      setSelectedEmoji('🚀');
      setSelectedColor('#4f46e5');
      setIsModalOpen(true);
    }
  }, [isExternalCreateOpen]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    onCloseExternalCreate?.();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleOpenCreate = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingWorkspace(null);
    setName('');
    setDescription('');
    setSelectedEmoji('🚀');
    setSelectedColor('#4f46e5');
    setIsOpen(false);
    setIsModalOpen(true);
  };

  const handleOpenRename = (ws: Workspace, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingWorkspace(ws);
    setName(ws.name);
    setDescription(ws.description || '');
    setSelectedEmoji(ws.icon);
    setSelectedColor(ws.color);
    setIsOpen(false);
    setIsModalOpen(true);
  };

  const handleSaveWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingWorkspace) {
      if (onRenameWorkspace) {
        onRenameWorkspace(editingWorkspace.id, name.trim(), selectedEmoji, selectedColor);
      }
    } else {
      onCreateWorkspace(name.trim(), selectedEmoji, selectedColor, description.trim());
    }

    setName('');
    setDescription('');
    setEditingWorkspace(null);
    setIsModalOpen(false);
    setIsOpen(false);
    onCloseExternalCreate?.();
  };

  const isArcDock = variant === 'dock' || variant === 'header';

  return (
    <div className={`workspace-switcher-container ${compact ? 'compact' : ''} ${variant === 'title' ? 'arc-title-mode' : ''} ${isArcDock ? 'arc-spaces-dock' : ''} ${variant === 'header' ? 'arc-header-dock' : 'arc-sidebar-dock'}`}>
      {/* ARC PROMINENT TITLE HEADER (Tier 1) */}
      {variant === 'title' ? (
        <div
          className="arc-space-title-header"
          onClick={() => setIsOpen(!isOpen)}
          title={`${activeWorkspace?.name || 'Workspace'} — Click to manage space`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
          style={{
            '--space-tint': activeWorkspace?.color || 'var(--accent-primary)'
          } as React.CSSProperties}
        >
          <div className="arc-space-title-left">
            <span className="arc-space-title-icon">{activeWorkspace?.icon || '🪴'}</span>
            <span className="arc-space-title-name">{activeWorkspace?.name || 'Personal'}</span>
          </div>
          <ChevronDown size={14} className={`arc-space-title-chevron ${isOpen ? 'open' : ''}`} />
        </div>
      ) : isArcDock ? (
        <div className="arc-spaces-track">
          {workspaces.map((ws) => {
            const isActive = ws.id === activeWorkspaceId;
            const count = notesCountByWorkspace?.get(ws.id) || 0;

            if (isActive) {
              return (
                <div
                  key={ws.id}
                  className="arc-space-pill active"
                  style={{
                    borderColor: ws.color || 'var(--accent-primary)',
                    background: `color-mix(in srgb, ${ws.color || '#6366f1'} 16%, var(--bg-card))`,
                    boxShadow: `0 2px 10px color-mix(in srgb, ${ws.color || '#6366f1'} 25%, transparent)`
                  }}
                  onClick={() => setIsOpen(!isOpen)}
                  title={`${ws.name} (${count} note${count !== 1 ? 's' : ''}) — Click to manage space`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsOpen(!isOpen);
                    }
                  }}
                >
                  <span className="arc-space-icon">{ws.icon || '🏠'}</span>
                  <span className="arc-space-name">{ws.name}</span>
                  {count > 0 && (
                    <span
                      className="arc-space-count"
                      style={{ background: `color-mix(in srgb, ${ws.color || '#6366f1'} 28%, transparent)` }}
                    >
                      {count}
                    </span>
                  )}
                  <ChevronDown size={11} className={`arc-space-chevron ${isOpen ? 'open' : ''}`} />
                </div>
              );
            }

            return (
              <button
                key={ws.id}
                type="button"
                className="arc-space-chip"
                onClick={() => onSelectWorkspace(ws.id)}
                title={`Switch to ${ws.name} (${count} note${count !== 1 ? 's' : ''})`}
                style={{
                  '--space-accent': ws.color || 'var(--accent-primary)'
                } as React.CSSProperties}
              >
                <span className="arc-space-chip-icon">{ws.icon || '📁'}</span>
              </button>
            );
          })}

          {/* Plus (+) Button to Add New Space */}
          <button
            type="button"
            className="arc-space-add-chip"
            onClick={(e) => handleOpenCreate(e)}
            title="Create New Space (+)"
          >
            <Plus size={13} />
          </button>
        </div>
      ) : compact ? (
        /* Legacy Compact Trigger */
        <div 
          className="workspace-compact-trigger"
          onClick={() => setIsOpen(!isOpen)}
          title={`Switch Workspace (${activeWorkspace?.name || 'Workspace'})`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
        >
          <span className="workspace-compact-emoji">{activeWorkspace?.icon || '🏠'}</span>
          <span className="workspace-compact-name">{activeWorkspace?.name || 'Workspace'}</span>
          <ChevronDown size={11} className={`workspace-compact-chevron ${isOpen ? 'open' : ''}`} />
        </div>
      ) : (
        /* Legacy Pill Trigger */
        <div 
          className="workspace-active-pill"
          onClick={() => setIsOpen(!isOpen)}
          title={`Switch Workspace (Current: ${activeWorkspace?.name || 'Workspace'})`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
        >
          <div className="workspace-pill-left">
            <span className="workspace-pill-emoji">{activeWorkspace?.icon || '🏠'}</span>
            <div className="workspace-pill-info">
              <span className="workspace-pill-name">{activeWorkspace?.name || 'Workspace'}</span>
              <span className="workspace-pill-sub">Workspace</span>
            </div>
          </div>
          <ChevronDown size={14} className={`workspace-pill-chevron ${isOpen ? 'open' : ''}`} />
        </div>
      )}

      {/* Dropdown Menu / Space Management Popover */}
      {isOpen && (
        <>
          <div className="dropdown-backdrop workspace-backdrop" onClick={() => setIsOpen(false)} />
          <div className="workspace-dropdown-menu" role="menu" aria-label="Workspaces">
            <div className="workspace-dropdown-header">
              <span>Spaces & Workspaces ({workspaces.length})</span>
            </div>

            <div className="workspace-items-list">
              {workspaces.map((ws) => {
                const isActive = ws.id === activeWorkspaceId;
                const count = notesCountByWorkspace?.get(ws.id) || 0;

                return (
                  <div
                    key={ws.id}
                    className={`workspace-menu-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onSelectWorkspace(ws.id);
                      setIsOpen(false);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectWorkspace(ws.id);
                        setIsOpen(false);
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flex: 1, minWidth: 0 }}>
                      <span className="workspace-item-icon">{ws.icon}</span>
                      <div className="workspace-item-text">
                        <span className="workspace-item-name">{ws.name}</span>
                        <span className="workspace-item-desc">{count} note{count !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      {isActive && <Check size={14} color="var(--accent-primary, #818cf8)" />}
                      {onRenameWorkspace && (
                        <button
                          type="button"
                          className="workspace-action-icon-btn"
                          title="Rename / Customize Space"
                          onClick={(e) => handleOpenRename(ws, e)}
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                      {workspaces.length > 1 && (
                        <button
                          type="button"
                          className="workspace-delete-btn"
                          title="Delete Space"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete workspace "${ws.name}"?`)) {
                              onDeleteWorkspace(ws.id);
                            }
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Create New Workspace Button */}
            <button
              type="button"
              className="workspace-add-btn"
              onClick={(e) => handleOpenCreate(e)}
            >
              <Plus size={14} />
              <span>Create New Space</span>
            </button>
          </div>
        </>
      )}

      {/* Create / Rename Workspace Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Sparkles size={18} color="var(--accent-primary)" />
                <span>{editingWorkspace ? 'Customize Space' : 'Create New Space'}</span>
              </div>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveWorkspace} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Space Name</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="e.g. Startup, Creative Studio, Research..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Focus areas, projects, or goals..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Icon / Emoji</label>
                <div className="book-emoji-picker" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                  {WS_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      className={`emoji-btn ${selectedEmoji === em ? 'active' : ''}`}
                      onClick={() => setSelectedEmoji(em)}
                      style={{ width: '36px', height: '36px', borderRadius: '8px', fontSize: '16px' }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '6px' }}>Accent Theme Color</label>
                <div className="book-color-picker" style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingTop: '4px' }}>
                  {WS_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      className={`color-dot ${selectedColor === col ? 'active' : ''}`}
                      style={{
                        backgroundColor: col,
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: selectedColor === col ? '2px solid #ffffff' : '2px solid transparent',
                        boxShadow: selectedColor === col ? `0 0 0 2px ${col}` : 'none',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease'
                      }}
                      onClick={() => setSelectedColor(col)}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="btn-small-ghost" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-small-primary">
                  {editingWorkspace ? 'Save Changes' : 'Create Space'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
