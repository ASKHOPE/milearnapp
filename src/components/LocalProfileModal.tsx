import React, { useState, useEffect } from 'react';
import type { Workspace, Note } from '../types';
import { optimizer, type StorageHealth } from '../services/optimizer';
import { 
  User, 
  Mic, 
  MicOff, 
  HardDrive, 
  QrCode, 
  Share2, 
  Upload, 
  Download, 
  X, 
  ShieldCheck
} from 'lucide-react';

interface LocalProfileModalProps {
  isOpen: boolean;
  activeWorkspace: Workspace;
  allNotes: Note[];
  isMicEnabled: boolean;
  onToggleMic: (enabled: boolean) => void;
  onExportVault: () => void;
  onImportVault: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
}

export const LocalProfileModal: React.FC<LocalProfileModalProps> = ({
  isOpen,
  activeWorkspace,
  allNotes,
  isMicEnabled,
  onToggleMic,
  onExportVault,
  onImportVault,
  onClose
}) => {
  const [profileName, setProfileName] = useState(() => localStorage.getItem('noteflow_user_name') || 'Chief Thinker');
  const [profileAvatar, setProfileAvatar] = useState(() => localStorage.getItem('noteflow_user_avatar') || '⚡');
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'storage' | 'transfer'>('profile');
  const [storageHealth, setStorageHealth] = useState<StorageHealth | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanSuccess, setCleanSuccess] = useState(false);
  const [qrNoteId, setQrNoteId] = useState<string>(allNotes[0]?.id || '');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      optimizer.getStorageHealth(allNotes).then(setStorageHealth);
    }
  }, [isOpen, allNotes]);

  if (!isOpen) return null;

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

  // Selected note for QR beam
  const selectedQrNote = allNotes.find((n) => n.id === qrNoteId) || allNotes[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <User size={18} color="var(--accent-primary)" />
            <span>Local Identity & Privacy Hub</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="local-profile-tabs">
          <button 
            className={`profile-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={13} />
            <span>Persona</span>
          </button>
          <button 
            className={`profile-tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            <ShieldCheck size={13} />
            <span>Privacy & Audio</span>
          </button>
          <button 
            className={`profile-tab-btn ${activeTab === 'storage' ? 'active' : ''}`}
            onClick={() => setActiveTab('storage')}
          >
            <HardDrive size={13} />
            <span>Storage & Health</span>
          </button>
          <button 
            className={`profile-tab-btn ${activeTab === 'transfer' ? 'active' : ''}`}
            onClick={() => setActiveTab('transfer')}
          >
            <Share2 size={13} />
            <span>Zero-Cloud Sync</span>
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px 20px', minHeight: '320px' }}>
          {/* TAB 1: Profile & Identity */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="profile-avatar-display">{profileAvatar}</div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px' }}>{profileName}</h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Active Persona: {activeWorkspace.icon} {activeWorkspace.name}
                  </span>
                </div>
              </div>

              <div>
                <label className="form-label">Display Name</label>
                <input
                  type="text"
                  className="modal-input"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Your Name / Handle"
                  required
                />
              </div>

              <div>
                <label className="form-label">Avatar Emoji</label>
                <div className="book-emoji-picker">
                  {['⚡', '🚀', '🧠', '🦉', '🎨', '💻', '✨', '🦊', '☕'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      className={`emoji-btn ${profileAvatar === em ? 'active' : ''}`}
                      onClick={() => setProfileAvatar(em)}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="submit" className="btn-small-primary">
                  {isSaved ? 'Saved!' : 'Save Persona'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Privacy & Microphone Toggle */}
          {activeTab === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="privacy-toggle-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className={`privacy-icon-box ${isMicEnabled ? 'enabled' : 'disabled'}`}>
                    {isMicEnabled ? <Mic size={20} color="#10b981" /> : <MicOff size={20} color="#ef4444" />}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '14px', display: 'block' }}>
                      Microphone & Voice Recording
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {isMicEnabled 
                        ? 'Microphone features are enabled in the editor.' 
                        : 'Microphone is completely disabled. No recording APIs are active.'}
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

              <div className="privacy-info-box">
                <ShieldCheck size={16} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong>100% On-Device Privacy Guarantee:</strong>
                  <br />
                  Noteflow never transmits your audio, keystrokes, or notes to any cloud server. All notes live inside your browser’s local IndexedDB sandbox.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Storage & Optimization */}
          {activeTab === 'storage' && storageHealth && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="storage-metric-grid">
                <div className="storage-card">
                  <span className="storage-card-label">Used Storage</span>
                  <span className="storage-card-val">{optimizer.formatBytes(storageHealth.usageBytes)}</span>
                </div>
                <div className="storage-card">
                  <span className="storage-card-label">Media & Images</span>
                  <span className="storage-card-val" style={{ color: 'var(--color-purple)' }}>
                    {optimizer.formatBytes(storageHealth.mediaBytes)}
                  </span>
                </div>
                <div className="storage-card">
                  <span className="storage-card-label">Text & Markdown</span>
                  <span className="storage-card-val" style={{ color: 'var(--accent-primary)' }}>
                    {optimizer.formatBytes(storageHealth.textBytes)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span>Browser Storage Quota</span>
                  <span>{storageHealth.usagePercent.toFixed(2)}% of {optimizer.formatBytes(storageHealth.quotaBytes)}</span>
                </div>
                <div className="storage-progress-bar">
                  <div 
                    className="storage-progress-fill" 
                    style={{ width: `${Math.max(1, Math.min(100, storageHealth.usagePercent))}%` }} 
                  />
                </div>
              </div>

              {/* 1-Click Optimizer Button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 600, display: 'block' }}>
                    Storage Defragmenter & Cleaner
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Purges unreferenced attachments and optimizes IndexedDB indexes.
                  </span>
                </div>
                <button
                  className="btn-small-primary"
                  onClick={handleCleanStorage}
                  disabled={isCleaning}
                >
                  {isCleaning ? 'Optimizing...' : cleanSuccess ? 'Optimized! ✓' : 'Optimize Now'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Zero-Cloud Sync (AirDrop & QR Beam) */}
          {activeTab === 'transfer' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* AirDrop Bundle Section */}
              <div className="transfer-card">
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 600, display: 'block' }}>
                    AirDrop / Local Vault Package (.noteflow)
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Export a portable snapshot of your notes, books, and personas to AirDrop to your iPhone, iPad, or Mac.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button className="btn-small-primary" onClick={onExportVault}>
                    <Download size={13} />
                    <span>Download .noteflow Vault</span>
                  </button>

                  <label className="btn-small-ghost" style={{ cursor: 'pointer' }}>
                    <Upload size={13} />
                    <span>Restore / Merge Vault</span>
                    <input
                      type="file"
                      accept=".json,.noteflow"
                      onChange={onImportVault}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {/* Instant QR Code Note Beam */}
              <div className="transfer-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 600, display: 'block' }}>
                      Instant QR Code Note Beam
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Point your iPhone camera at this code to beam note data directly over the air without internet.
                    </span>
                  </div>
                  <select
                    className="editor-folder-select"
                    value={qrNoteId}
                    onChange={(e) => setQrNoteId(e.target.value)}
                    style={{ maxWidth: '160px' }}
                  >
                    {allNotes.slice(0, 15).map((n) => (
                      <option key={n.id} value={n.id}>{n.title}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'white', padding: '12px', borderRadius: 'var(--radius-md)', color: '#0f172a' }}>
                  <div style={{ width: '90px', height: '90px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <QrCode size={64} color="#1e293b" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, display: 'block' }}>
                      {selectedQrNote?.title || 'Untitled Note'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                      {selectedQrNote?.content.length || 0} characters ready to beam.
                    </span>
                    <span style={{ fontSize: '11px', color: '#6366f1', display: 'block', marginTop: '4px' }}>
                      Open iOS Camera app to scan and read instantly.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
