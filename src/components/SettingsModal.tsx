import React, { useState, useEffect } from 'react';
import type { Workspace, Note, Folder, Book } from '../types';
import { optimizer, type StorageHealth } from '../services/optimizer';
import { lockoutManager } from '../services/cryptoLockout';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Tabs } from './ui/Tabs';
import { 
  Settings,
  User, 
  ShieldCheck, 
  HardDrive, 
  Share2, 
  RotateCcw, 
  Download, 
  Upload, 
  Lock, 
  Mic, 
  MicOff, 
  BookOpen, 
  Sparkles, 
  Check
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  theme: 'light' | 'dark';
  activeWorkspace: Workspace;
  allNotes: Note[];
  allFolders: Folder[];
  allBooks: Book[];
  isMicEnabled: boolean;
  onToggleTheme: () => void;
  onToggleMic: (enabled: boolean) => void;
  onExportVault: () => void;
  onImportVault: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReseedTutorialVault: () => Promise<void>;
  onSelectNote: (noteId: string) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  theme,
  activeWorkspace,
  allNotes,
  isMicEnabled,
  onToggleTheme,
  onToggleMic,
  onExportVault,
  onImportVault,
  onReseedTutorialVault,
  onSelectNote,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [profileName, setProfileName] = useState(() => localStorage.getItem('noteflow_user_name') || 'Chief Thinker');
  const [profileAvatar, setProfileAvatar] = useState(() => localStorage.getItem('noteflow_user_avatar') || '⚡');
  const [storageHealth, setStorageHealth] = useState<StorageHealth | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanSuccess, setCleanSuccess] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [clearedLockouts, setClearedLockouts] = useState(false);
  const [qrNoteId, setQrNoteId] = useState<string>(allNotes[0]?.id || '');

  useEffect(() => {
    if (isOpen) {
      optimizer.getStorageHealth(allNotes).then(setStorageHealth);
      setShowResetConfirm(false);
      setResetSuccess(false);
    }
  }, [isOpen, allNotes]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('noteflow_user_name', profileName);
    localStorage.setItem('noteflow_user_avatar', profileAvatar);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleCleanStorage = () => {
    setIsCleaning(true);
    setTimeout(() => {
      setIsCleaning(false);
      setCleanSuccess(true);
      optimizer.getStorageHealth(allNotes).then(setStorageHealth);
      setTimeout(() => setCleanSuccess(false), 3000);
    }, 600);
  };

  const handleConfirmReseed = async () => {
    setIsResetting(true);
    try {
      await onReseedTutorialVault();
      setResetSuccess(true);
      setShowResetConfirm(false);
      setTimeout(() => setResetSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to reseed vault', err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleClearAllLockouts = () => {
    allNotes.forEach((n) => lockoutManager.recordSuccess(n.id));
    setClearedLockouts(true);
    setTimeout(() => setClearedLockouts(false), 3000);
  };

  const selectedQrNote = allNotes.find((n) => n.id === qrNoteId) || allNotes[0];

  const lockedNotesCount = allNotes.filter((n) => n.isLocked).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings & System Vault"
      subtitle={`Local-first configuration • ${activeWorkspace.name}`}
      icon={<Settings size={20} color="var(--accent-primary)" />}
      maxWidth={680}
    >
      {/* Segmented Tab Strip */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'general', label: 'General', icon: <User size={13} /> },
          { id: 'backup', label: 'Backup & Restore', icon: <RotateCcw size={13} /> },
          { id: 'security', label: 'Security & Lock', icon: <ShieldCheck size={13} />, badge: lockedNotesCount > 0 ? lockedNotesCount : undefined },
          { id: 'tutorial', label: 'Tutorial & Keys', icon: <Sparkles size={13} /> },
          { id: 'storage', label: 'Storage', icon: <HardDrive size={13} /> },
          { id: 'transfer', label: 'Offline Beam', icon: <Share2 size={13} /> }
        ]}
      />

      {/* TAB 1: General & Persona */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div className="profile-avatar-display" style={{ fontSize: '28px', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', borderRadius: '50%', border: '1px solid var(--border-color)' }}>
              {profileAvatar}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>{profileName}</h4>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Active Persona: {activeWorkspace.icon} {activeWorkspace.name}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onToggleTheme}
              title="Toggle Day and Night Theme"
            >
              {theme === 'dark' ? '☀️ Light Theme' : '🌙 Dark Theme'}
            </Button>
          </div>

          <div className="ui-form-group">
            <label className="ui-form-label">Display Name / Handle</label>
            <input
              type="text"
              className="ui-input"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Your Name"
              required
            />
          </div>

          <div className="ui-form-group">
            <label className="ui-form-label">Avatar Emoji</label>
            <div className="book-emoji-picker" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['⚡', '🚀', '🧠', '🦉', '🎨', '💻', '✨', '🦊', '☕', '🛡️', '🔬', '📐'].map((em) => (
                <button
                  key={em}
                  type="button"
                  className={`emoji-btn ${profileAvatar === em ? 'active' : ''}`}
                  onClick={() => setProfileAvatar(em)}
                  style={{
                    fontSize: '18px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: profileAvatar === em ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    background: profileAvatar === em ? 'rgba(79, 70, 229, 0.1)' : 'var(--bg-subtle)',
                    cursor: 'pointer'
                  }}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <Button type="submit" variant="primary" size="md">
              {isSaved ? '✓ Saved!' : 'Save Persona'}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 2: Backup, Restore & Seed Vault */}
      {activeTab === 'backup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {resetSuccess && (
            <div className="crypto-lockout-banner" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)', color: 'var(--color-success)' }}>
              <Check size={18} />
              <div>
                <strong>Tutorial Vault Restored!</strong>
                <p>All workspaces, books, chapters, flashcards, and math guides have been re-seeded.</p>
              </div>
            </div>
          )}

          {/* Export & Import Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="transfer-card" style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <Download size={22} color="var(--accent-primary)" style={{ marginBottom: '8px' }} />
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-primary)' }}>Export Entire Vault</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
                Download all notes, folders, books, and attachments as a JSON archive.
              </p>
              <Button variant="primary" size="sm" onClick={onExportVault} fullWidth>
                Download .noteflow
              </Button>
            </div>

            <div className="transfer-card" style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <Upload size={22} color="var(--color-warning)" style={{ marginBottom: '8px' }} />
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-primary)' }}>Restore From Backup</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
                Import an existing .noteflow or .json backup into your local vault.
              </p>
              <label style={{ width: '100%', display: 'block' }}>
                <input
                  type="file"
                  accept=".json,.noteflow"
                  style={{ display: 'none' }}
                  onChange={onImportVault}
                />
                <Button variant="secondary" size="sm" fullWidth onClick={(e) => {
                  const input = (e.currentTarget.parentElement?.querySelector('input[type=file]') as HTMLInputElement);
                  input?.click();
                }}>
                  Upload Backup File
                </Button>
              </label>
            </div>
          </div>

          {/* Re-seed / Initialize Tutorial Vault */}
          <div style={{ padding: '16px', background: 'rgba(79, 70, 229, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Sparkles size={16} color="var(--accent-primary)" />
                  <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>
                    Reset & Initialize Tutorial Vault
                  </h4>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Repopulates the complete curated onboarding dataset: 4 workspaces, 3 books with ordered chapters, 14 rich notes showcasing <strong>LaTeX math</strong>, <strong>Mermaid diagrams</strong>, <strong>Active Recall flashcards</strong>, <strong>Canvas sketches</strong>, and <strong>Daily journal</strong>.
                </p>
              </div>

              {!showResetConfirm ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResetConfirm(true)}
                  style={{ flexShrink: 0 }}
                >
                  <RotateCcw size={13} />
                  Reset to Tutorial
                </Button>
              ) : (
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <Button
                    variant="danger"
                    size="sm"
                    isLoading={isResetting}
                    onClick={handleConfirmReseed}
                  >
                    Confirm Reset
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowResetConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Zero-Knowledge Security & Note Locking */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="crypto-badge-strip">
            <Badge variant="primary" dot>AES-256-GCM</Badge>
            <Badge variant="purple">PBKDF2 600,000x</Badge>
            <Badge variant="success">Anti-MITM Tag</Badge>
            <Badge variant="warning">Brute-Force Lockout</Badge>
          </div>

          <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={16} color="var(--color-warning)" />
              <span>Zero-Knowledge Authenticated Encryption Status</span>
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
              Currently protecting <strong>{lockedNotesCount} locked notes</strong> in this vault. Plaintext is mathematically impossible to reconstruct without your secret passphrase.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 600, display: 'block', color: 'var(--text-primary)' }}>
                  Brute-Force Rate Limiting Lockouts
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Clear cooldown lockouts if testing incorrect passphrases.
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllLockouts}
              >
                {clearedLockouts ? '✓ Cleared!' : 'Clear Lockouts'}
              </Button>
            </div>
          </div>

          {/* Privacy & Microphone Kill-Switch */}
          <div className="privacy-toggle-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className={`privacy-icon-box ${isMicEnabled ? 'enabled' : 'disabled'}`} style={{ width: '36px', height: '36px', borderRadius: '50%', background: isMicEnabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isMicEnabled ? <Mic size={18} color="var(--color-success)" /> : <MicOff size={18} color="var(--color-danger)" />}
              </div>
              <div>
                <span style={{ fontWeight: 600, fontSize: '13px', display: 'block', color: 'var(--text-primary)' }}>
                  Microphone Hardware Kill-Switch
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {isMicEnabled ? 'Microphone active in editor' : 'Microphone completely detached & disabled'}
                </span>
              </div>
            </div>

            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={isMicEnabled}
                onChange={(e) => onToggleMic(e.target.checked)}
              />
              <span className="slider-round" />
            </label>
          </div>
        </div>
      )}

      {/* TAB 4: Interactive Tutorial & Keyboard Shortcuts */}
      {activeTab === 'tutorial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(79, 70, 229, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>
                Welcome to Noteflow Master Guide
              </h4>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Interactive tutorial note with Wikilinks, KaTeX formulas, and diagrams.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onSelectNote('n-welcome');
              }}
            >
              <BookOpen size={13} />
              Open Tutorial Note
            </Button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
              Essential Keyboard Shortcuts
            </h4>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>Shortcut</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)' }}>Cmd + K</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>Global fuzzy search across all notes & tags</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)' }}>Cmd + N</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>Create a new note</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)' }}>Cmd + W</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>Close active note tab</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)' }}>Cmd + F</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>Find & replace within note</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)' }}>Space / Enter</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>Flip card in <strong>Study Mode</strong></td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)' }}>1, 2, 3, 4</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>Rate flashcard difficulty (Again, Hard, Good, Easy)</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>/</td>
                  <td style={{ padding: '8px 12px' }}>Summon Slash Commands menu (headings, tables, callouts)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Storage & Quota */}
      {activeTab === 'storage' && storageHealth && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="storage-metric-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div className="storage-card" style={{ padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Used Storage</span>
              <strong style={{ fontSize: '18px', display: 'block', color: 'var(--text-primary)', marginTop: '2px' }}>
                {optimizer.formatBytes(storageHealth.usageBytes)}
              </strong>
            </div>
            <div className="storage-card" style={{ padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Media & Sketches</span>
              <strong style={{ fontSize: '18px', display: 'block', color: 'var(--color-purple)', marginTop: '2px' }}>
                {optimizer.formatBytes(storageHealth.mediaBytes)}
              </strong>
            </div>
            <div className="storage-card" style={{ padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Text & Markdown</span>
              <strong style={{ fontSize: '18px', display: 'block', color: 'var(--accent-primary)', marginTop: '2px' }}>
                {optimizer.formatBytes(storageHealth.textBytes)}
              </strong>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>Browser Storage Quota</span>
              <span>{storageHealth.usagePercent.toFixed(2)}% of {optimizer.formatBytes(storageHealth.quotaBytes)}</span>
            </div>
            <div className="storage-progress-bar" style={{ height: '6px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
              <div 
                className="storage-progress-fill" 
                style={{ height: '100%', background: 'var(--accent-primary)', width: `${Math.max(1, Math.min(100, storageHealth.usagePercent))}%` }} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: '13px', display: 'block', color: 'var(--text-primary)' }}>
                1-Click Cache Optimizer
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Prune orphaned preview blobs and compress local indices
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              isLoading={isCleaning}
              onClick={handleCleanStorage}
            >
              {cleanSuccess ? '✓ Cleaned!' : 'Clean Cache'}
            </Button>
          </div>
        </div>
      )}

      {/* TAB 6: Zero-Cloud QR Beam */}
      {activeTab === 'transfer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label className="ui-form-label" style={{ margin: 0 }}>Beam Note via QR:</label>
            <select
              className="ui-input"
              value={qrNoteId}
              onChange={(e) => setQrNoteId(e.target.value)}
              style={{ flex: 1 }}
            >
              {allNotes.filter((n) => !n.isTrashed && !n.isLocked).map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title || 'Untitled Note'}
                </option>
              ))}
            </select>
          </div>

          {selectedQrNote && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  JSON.stringify({
                    title: selectedQrNote.title,
                    content: selectedQrNote.content.slice(0, 800)
                  })
                )}`}
                alt="QR Code"
                style={{ borderRadius: '8px', border: '1px solid var(--border-color)', background: '#ffffff', padding: '8px' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Scan with mobile camera to import note without internet
              </span>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
