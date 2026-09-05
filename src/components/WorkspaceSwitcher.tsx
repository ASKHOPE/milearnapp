import React, { useState } from 'react';
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
}

const WS_EMOJIS = ['🏠', '💼', '🎨', '🚀', '🔬', '📚', '⚡', '🌿', '💡'];
const WS_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  workspaces,
  activeWorkspaceId,
  notesCountByWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
  onRenameWorkspace,
  onDeleteWorkspace
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🚀');
  const [selectedColor, setSelectedColor] = useState('#4f46e5');

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const handleOpenCreate = () => {
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
  };

  return (
    <div className="workspace-switcher-container">
      {/* Active Workspace Pill Trigger */}
      <div 
        className="workspace-active-pill"
        onClick={() => setIsOpen(!isOpen)}
        title="Switch Workspace"
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
        <ChevronDown size={14} className="workspace-pill-chevron" />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="dropdown-backdrop workspace-backdrop" onClick={() => setIsOpen(false)} />
          <div className="workspace-dropdown-menu">
            <div className="workspace-dropdown-header">
              <span>Switch Workspace</span>
            </div>

            <div className="workspace-items-list">
              {workspaces.map((ws) => {
                const isActive = ws.id === activeWorkspaceId;
                const count = notesCountByWorkspace.get(ws.id) || 0;

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
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                      <span className="workspace-item-icon">{ws.icon}</span>
                      <div className="workspace-item-text">
                        <span className="workspace-item-name">{ws.name}</span>
                        <span className="workspace-item-desc">{count} note{count !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {isActive && <Check size={14} color="var(--accent-primary)" />}
                      {onRenameWorkspace && (
                        <button
                          type="button"
                          className="workspace-action-icon-btn"
                          title="Rename Workspace"
                          onClick={(e) => handleOpenRename(ws, e)}
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                      {workspaces.length > 1 && (
                        <button
                          type="button"
                          className="workspace-delete-btn"
                          title="Delete Workspace"
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
              className="workspace-add-btn"
              onClick={handleOpenCreate}
            >
              <Plus size={14} />
              <span>New Workspace</span>
            </button>
          </div>
        </>
      )}

      {/* Create / Rename Workspace Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Sparkles size={18} color="var(--accent-primary)" />
                <span>{editingWorkspace ? 'Rename Workspace' : 'Create New Workspace'}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveWorkspace} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Workspace Name</label>
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

              <div>
                <label className="form-label">Description (Optional)</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Focus areas, projects, or goals..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Icon / Emoji</label>
                <div className="book-emoji-picker">
                  {WS_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      className={`emoji-btn ${selectedEmoji === em ? 'active' : ''}`}
                      onClick={() => setSelectedEmoji(em)}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Accent Theme Color</label>
                <div className="book-color-picker">
                  {WS_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      className={`color-dot ${selectedColor === col ? 'active' : ''}`}
                      style={{ backgroundColor: col }}
                      onClick={() => setSelectedColor(col)}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" className="btn-small-ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-small-primary">
                  {editingWorkspace ? 'Save Changes' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
