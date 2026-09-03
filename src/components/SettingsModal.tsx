import React, { useState, useEffect, useRef } from 'react';
import type { Workspace, Note, Folder, Book, ThemeMode, UserProfile } from '../types';
import { optimizer, type StorageHealth } from '../services/optimizer';
import { lockoutManager } from '../services/cryptoLockout';
import { shortcutManager } from '../services/shortcutManager';
import { inactivityLockManager } from '../services/inactivityLock';
import { AVATAR_MOODS, ANIMATED_AVATARS } from '../services/avatarPresets';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Tabs } from './ui/Tabs';
import { 
  User, 
  Palette,
  Keyboard,
  ShieldCheck, 
  HardDrive, 
  RotateCcw, 
  Download, 
  Upload, 
  Mic, 
  MicOff, 
  Check,
  Camera,
  Sun,
  Moon,
  Monitor,
  QrCode
} from 'lucide-react';

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Alex Mercer',
  bio: 'Staff Engineer • Local-First Systems & Mathematics Enthusiast',
  role: 'Systems Architect',
  avatarType: 'emoji',
  avatarValue: '⚡',
  mood: 'Deep Focus'
};

interface SettingsModalProps {
  isOpen: boolean;
  theme: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
  activeWorkspace: Workspace;
  allNotes: Note[];
  allFolders: Folder[];
  allBooks: Book[];
  isMicEnabled: boolean;
  onToggleMic: (enabled: boolean) => void;
  onExportVault: () => void;
  onImportVault: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReseedTutorialVault: () => Promise<void>;
  onSelectNote: (noteId: string) => void;
  onClose: () => void;
  userProfile?: UserProfile;
  onUpdateProfile?: (profile: UserProfile) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  theme,
  onChangeTheme,
  allNotes,
  isMicEnabled,
  onToggleMic,
  onExportVault,
  onImportVault,
  onReseedTutorialVault,
  onClose,
  userProfile = DEFAULT_USER_PROFILE,
  onUpdateProfile
}) => {
  const [activeTab, setActiveTab] = useState<string>('profile');

  // Profile Form State
  const [profileName, setProfileName] = useState(userProfile.name);
  const [profileBio, setProfileBio] = useState(userProfile.bio);
  const [profileRole, setProfileRole] = useState(userProfile.role);
  const [avatarType, setAvatarType] = useState<'emoji' | 'gif' | 'image'>(userProfile.avatarType);
  const [avatarValue, setAvatarValue] = useState(userProfile.avatarValue);
  const [selectedMood, setSelectedMood] = useState(userProfile.mood);
  const [customGifUrl, setCustomGifUrl] = useState('');
  const [profileSaveNotice, setProfileSaveNotice] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Hotkeys & Mouse State
  const [hotkeys, setHotkeys] = useState(shortcutManager.getHotkeys());
  const [mouseSettings, setMouseSettings] = useState(shortcutManager.getMouseSettings());
  const [recordingHotkeyKey, setRecordingHotkeyKey] = useState<string | null>(null);

  // Security & Inactivity State
  const [securitySettings, setSecuritySettings] = useState(inactivityLockManager.getSettings());
  const [lockoutCount, setLockoutCount] = useState<number>(0);
  const [showClearSuccess, setShowClearSuccess] = useState(false);

  // Storage Health State
  const [health, setHealth] = useState<StorageHealth | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanSuccess, setCleanSuccess] = useState(false);

  // Reset / Reseed Confirmation State
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLockoutCount(lockoutManager.getAllActiveLockouts().length);
      optimizer.getHealthReport().then(setHealth);
      setHotkeys(shortcutManager.getHotkeys());
      setMouseSettings(shortcutManager.getMouseSettings());
      setSecuritySettings(inactivityLockManager.getSettings());
    }
  }, [isOpen]);

  // Handle Photo Upload (1:1 Square Crop on Canvas)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height, 400);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Center 1:1 crop
          const offsetX = (img.width - size) / 2;
          const offsetY = (img.height - size) / 2;
          ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);
          const croppedData = canvas.toDataURL('image/webp', 0.88);
          setAvatarType('image');
          setAvatarValue(croppedData);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    const updated: UserProfile = {
      name: profileName.trim() || 'Alex Mercer',
      bio: profileBio.trim(),
      role: profileRole.trim() || 'Noteflow Member',
      avatarType,
      avatarValue,
      mood: selectedMood
    };
    if (onUpdateProfile) {
      onUpdateProfile(updated);
    }
    try {
      localStorage.setItem('noteflow_user_profile', JSON.stringify(updated));
    } catch {}
    setProfileSaveNotice(true);
    setTimeout(() => setProfileSaveNotice(false), 2000);
  };

  // Hotkey Recorder
  useEffect(() => {
    if (!recordingHotkeyKey) return;

    const handleKeyRecord = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Ignore lone modifier presses
      if (['Meta', 'Control', 'Shift', 'Alt'].includes(e.key)) return;

      const parts: string[] = [];
      if (e.metaKey || (e.ctrlKey && navigator.platform.toUpperCase().indexOf('MAC') < 0)) parts.push('Meta');
      if (e.ctrlKey && navigator.platform.toUpperCase().indexOf('MAC') >= 0) parts.push('Ctrl');
      if (e.shiftKey) parts.push('Shift');
      if (e.altKey) parts.push('Alt');
      parts.push(e.key.toLowerCase());

      const shortcutStr = parts.join('+');
      const nextHotkeys = { ...hotkeys, [recordingHotkeyKey]: shortcutStr };
      setHotkeys(nextHotkeys);
      shortcutManager.saveHotkeys(nextHotkeys);
      setRecordingHotkeyKey(null);
    };

    window.addEventListener('keydown', handleKeyRecord, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyRecord, { capture: true });
  }, [recordingHotkeyKey, hotkeys]);

  const handleResetHotkeys = () => {
    const defaults = shortcutManager.resetHotkeys();
    setHotkeys(defaults);
  };

  const handleUpdateMouse = (field: string, val: any) => {
    const next = { ...mouseSettings, [field]: val };
    setMouseSettings(next);
    shortcutManager.saveMouseSettings(next);
  };

  const handleUpdateSecurity = (field: string, val: any) => {
    const next = { ...securitySettings, [field]: val };
    setSecuritySettings(next);
    inactivityLockManager.saveSettings(next);
  };

  const handleCleanStorage = async () => {
    setIsCleaning(true);
    await optimizer.purgeOrphanedData();
    const updated = await optimizer.getHealthReport();
    setHealth(updated);
    setIsCleaning(false);
    setCleanSuccess(true);
    setTimeout(() => setCleanSuccess(false), 3000);
  };

  const handleConfirmReseed = async () => {
    setIsResetting(true);
    try {
      await onReseedTutorialVault();
      setShowResetConfirm(false);
      onClose();
    } finally {
      setIsResetting(false);
    }
  };

  const lockedNotesCount = allNotes.filter((n) => n.isLocked).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings & System Preferences"
      subtitle="Identity, themes, custom hotkeys, zero-knowledge security, and local vault controls"
      maxWidth="880px"
    >
      {/* Symmetrical Header Navigation Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'profile', label: 'Identity', icon: <User size={14} /> },
          { id: 'appearance', label: 'Themes', icon: <Palette size={14} /> },
          { id: 'controls', label: 'Hotkeys & Mouse', icon: <Keyboard size={14} /> },
          { id: 'security', label: 'Security & Lock', icon: <ShieldCheck size={14} /> },
          { id: 'backup', label: 'Backup & Vault', icon: <HardDrive size={14} /> },
          { id: 'diagnostics', label: 'Storage & Beam', icon: <QrCode size={14} /> }
        ]}
      />

      {/* TAB 1: IDENTITY & PROFILE */}
      {activeTab === 'profile' && (
        <div className="settings-symmetrical-grid">
          {/* Left Column: Form Controls */}
          <div className="settings-card-panel">
            <h4 className="panel-section-title">Profile Information</h4>

            <div className="form-field-row">
              <label className="form-field-label">Display Name</label>
              <input
                type="text"
                className="dialog-text-input"
                placeholder="Your Name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
              />
            </div>

            <div className="form-field-row">
              <label className="form-field-label">Role / Headline</label>
              <input
                type="text"
                className="dialog-text-input"
                placeholder="e.g. Systems Engineer, Student"
                value={profileRole}
                onChange={(e) => setProfileRole(e.target.value)}
              />
            </div>

            <div className="form-field-row">
              <label className="form-field-label">Bio & Motto</label>
              <textarea
                className="dialog-textarea-input"
                placeholder="Short bio or personal philosophy..."
                rows={2}
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value)}
              />
            </div>

            {/* Categorized Moods */}
            <div className="form-field-row">
              <label className="form-field-label">Current Mindset / Mood</label>
              <div className="mood-pills-row">
                {AVATAR_MOODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`mood-pill-btn ${selectedMood === m.label ? 'active' : ''}`}
                    onClick={() => setSelectedMood(m.label)}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 1:1 Animated GIFs & SVGs */}
            <div className="form-field-row">
              <label className="form-field-label">1:1 Looping Animated Avatars</label>
              <div className="animated-gif-grid">
                {ANIMATED_AVATARS.map((gif) => (
                  <button
                    key={gif.id}
                    type="button"
                    className={`gif-choice-btn ${avatarType === 'gif' && avatarValue === gif.dataUrl ? 'active' : ''}`}
                    onClick={() => {
                      setAvatarType('gif');
                      setAvatarValue(gif.dataUrl);
                    }}
                    title={gif.name}
                  >
                    <img src={gif.dataUrl} alt={gif.name} />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom GIF / Image URL */}
            <div className="form-field-row">
              <label className="form-field-label">Or Custom GIF / Image URL</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="url"
                  className="dialog-text-input"
                  placeholder="https://.../avatar.gif"
                  value={customGifUrl}
                  onChange={(e) => setCustomGifUrl(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!customGifUrl.trim()}
                  onClick={() => {
                    setAvatarType('gif');
                    setAvatarValue(customGifUrl.trim());
                  }}
                >
                  Apply
                </Button>
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Button variant="primary" size="sm" onClick={handleSaveProfile}>
                <Check size={13} />
                <span>Save Profile</span>
              </Button>
              {profileSaveNotice && (
                <span style={{ fontSize: '12px', color: 'var(--color-success)' }}>
                  ✓ Profile updated
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Live Identity Preview Card */}
          <div className="settings-card-panel preview-center">
            <h4 className="panel-section-title">Identity Preview</h4>

            <div className="identity-preview-badge-card">
              <div className="identity-avatar-hero">
                {avatarType === 'emoji' ? (
                  <span className="hero-emoji">{avatarValue || '⚡'}</span>
                ) : (
                  <img src={avatarValue} alt="Avatar" className="hero-avatar-img" />
                )}
                <button
                  type="button"
                  className="btn-change-photo-badge"
                  onClick={() => photoInputRef.current?.click()}
                  title="Upload 1:1 Photo"
                >
                  <Camera size={12} />
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoUpload}
                />
              </div>

              <span className="hero-mood-tag">
                {AVATAR_MOODS.find((m) => m.label === selectedMood)?.emoji || '🧠'} {selectedMood}
              </span>

              <h3 className="hero-user-name">{profileName || 'Alex Mercer'}</h3>
              <span className="hero-user-role">{profileRole || 'Systems Architect'}</span>

              <p className="hero-user-bio">
                {profileBio || 'Zero-cloud, local-first researcher & builder.'}
              </p>

              <div className="hero-actions-row">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => photoInputRef.current?.click()}
                >
                  Upload Photo
                </Button>
                {avatarType !== 'emoji' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAvatarType('emoji');
                      setAvatarValue('⚡');
                    }}
                  >
                    Reset Emoji
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APPEARANCE & 3-WAY THEMES */}
      {activeTab === 'appearance' && (
        <div className="settings-card-panel" style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h4 className="panel-section-title">Theme Preferences</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Choose whether Noteflow matches your operating system appearance or stays locked to Day or Night mode.
          </p>

          <div className="theme-selector-3way">
            <button
              type="button"
              className={`theme-3way-card ${theme === 'system' ? 'active' : ''}`}
              onClick={() => onChangeTheme('system')}
            >
              <Monitor size={22} />
              <div className="theme-card-text">
                <span className="theme-card-title">System Default</span>
                <span className="theme-card-desc">Sync with macOS / OS appearance</span>
              </div>
            </button>

            <button
              type="button"
              className={`theme-3way-card ${theme === 'light' ? 'active' : ''}`}
              onClick={() => onChangeTheme('light')}
            >
              <Sun size={22} color="#f59e0b" />
              <div className="theme-card-text">
                <span className="theme-card-title">Day Theme</span>
                <span className="theme-card-desc">Crisp white & gentle paper tones</span>
              </div>
            </button>

            <button
              type="button"
              className={`theme-3way-card ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => onChangeTheme('dark')}
            >
              <Moon size={22} color="#8b5cf6" />
              <div className="theme-card-text">
                <span className="theme-card-title">Night Theme</span>
                <span className="theme-card-desc">Deep OLED slate & subtle luminescence</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOM HOTKEYS & MOUSE CUSTOMIZATION */}
      {activeTab === 'controls' && (
        <div className="settings-symmetrical-grid">
          {/* Left Column: Keyboard Shortcuts Customizer */}
          <div className="settings-card-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 className="panel-section-title" style={{ margin: 0 }}>Custom Hotkeys</h4>
              <button className="btn-small-link" onClick={handleResetHotkeys}>Reset Defaults</button>
            </div>

            <div className="hotkeys-list-container">
              {[
                { key: 'search', label: 'Quick Search' },
                { key: 'newNote', label: 'New Note' },
                { key: 'closeTab', label: 'Close Active Tab' },
                { key: 'findReplace', label: 'Find in Note' },
                { key: 'studyMode', label: 'Spaced Repetition' },
                { key: 'pomodoro', label: 'Focus Pomodoro' },
                { key: 'zenMode', label: 'Zen Mode' },
                { key: 'settings', label: 'Open Settings' }
              ].map((item) => {
                const isRecording = recordingHotkeyKey === item.key;
                const currentBinding = (hotkeys as any)[item.key];
                return (
                  <div key={item.key} className="hotkey-edit-row">
                    <span className="hotkey-label">{item.label}</span>
                    <button
                      type="button"
                      className={`hotkey-record-chip ${isRecording ? 'recording' : ''}`}
                      onClick={() => setRecordingHotkeyKey(isRecording ? null : item.key)}
                      title="Click to record new shortcut"
                    >
                      {isRecording ? 'Press Keys...' : shortcutManager.formatDisplayShortcut(currentBinding)}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Mouse & Trackpad Customization */}
          <div className="settings-card-panel">
            <h4 className="panel-section-title">Mouse & Navigation</h4>

            <div className="form-field-row">
              <label className="form-field-label">Double-Click Note Card Action</label>
              <select
                className="dialog-select-input"
                value={mouseSettings.doubleClickAction}
                onChange={(e) => handleUpdateMouse('doubleClickAction', e.target.value)}
              >
                <option value="openNewTab">Open in New Tab</option>
                <option value="replaceTab">Replace Active Tab</option>
                <option value="toggleFavorite">Toggle Star Favorite</option>
              </select>
            </div>

            <div className="form-field-row">
              <label className="form-field-label">Middle-Click on Tab</label>
              <select
                className="dialog-select-input"
                value={mouseSettings.middleClickAction}
                onChange={(e) => handleUpdateMouse('middleClickAction', e.target.value)}
              >
                <option value="closeTab">Close Tab</option>
                <option value="duplicateTab">Duplicate Tab</option>
                <option value="none">Do Nothing</option>
              </select>
            </div>

            <div className="form-field-row">
              <label className="form-field-label">Note Card Hover Preview</label>
              <select
                className="dialog-select-input"
                value={mouseSettings.hoverPreview}
                onChange={(e) => handleUpdateMouse('hoverPreview', e.target.value)}
              >
                <option value="delayed">Delayed (Smooth 300ms)</option>
                <option value="instant">Instant Preview</option>
                <option value="off">Disabled</option>
              </select>
            </div>

            <div className="settings-toggle-row" style={{ marginTop: '14px' }}>
              <div>
                <span className="settings-toggle-title">Smooth Document Scrolling</span>
                <span className="settings-toggle-sub">Hardware-accelerated inertia scrolling</span>
              </div>
              <input
                type="checkbox"
                checked={mouseSettings.smoothScroll}
                onChange={(e) => handleUpdateMouse('smoothScroll', e.target.checked)}
                className="settings-checkbox"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY & INACTIVITY AUTO-LOCK */}
      {activeTab === 'security' && (
        <div className="settings-symmetrical-grid">
          {/* Inactivity Auto-Lock */}
          <div className="settings-card-panel">
            <h4 className="panel-section-title">Inactivity Auto-Lock</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Automatically secure your vault and wipe confidential memory if the workstation is left unattended.
            </p>

            <div className="form-field-row">
              <label className="form-field-label">Auto-Lock Inactivity Timeout</label>
              <select
                className="dialog-select-input"
                value={securitySettings.autoLockMinutes}
                onChange={(e) => handleUpdateSecurity('autoLockMinutes', Number(e.target.value))}
              >
                <option value={0}>Disabled (Never Auto-Lock)</option>
                <option value={1}>1 Minute (Fast Testing)</option>
                <option value={5}>5 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>1 Hour</option>
              </select>
            </div>

            <div className="form-field-row">
              <label className="form-field-label">Lockout Action</label>
              <select
                className="dialog-select-input"
                value={securitySettings.lockAction}
                onChange={(e) => handleUpdateSecurity('lockAction', e.target.value)}
              >
                <option value="entireApp">Lock Entire Vault (Screen Blur Guard)</option>
                <option value="allNotes">Lock Protected Notes Only</option>
              </select>
            </div>

            <div className="settings-toggle-row" style={{ marginTop: '16px' }}>
              <div>
                <span className="settings-toggle-title">Hardware Microphone Kill-Switch</span>
                <span className="settings-toggle-sub">Disallow audio memos completely</span>
              </div>
              <Button
                variant={isMicEnabled ? 'outline' : 'danger'}
                size="sm"
                onClick={() => onToggleMic(!isMicEnabled)}
              >
                {isMicEnabled ? <Mic size={12} /> : <MicOff size={12} />}
                <span>{isMicEnabled ? 'Mic Allowed' : 'Mic Blocked'}</span>
              </Button>
            </div>
          </div>

          {/* Zero-Knowledge Status */}
          <div className="settings-card-panel">
            <h4 className="panel-section-title">Cryptographic Guarantees</h4>

            <div className="security-spec-card">
              <div className="sec-spec-row">
                <span className="sec-spec-lbl">Encryption Algorithm</span>
                <span className="sec-spec-val">AES-256-GCM AEAD</span>
              </div>
              <div className="sec-spec-row">
                <span className="sec-spec-lbl">Key Derivation</span>
                <span className="sec-spec-val">PBKDF2-SHA256 (600,000x)</span>
              </div>
              <div className="sec-spec-row">
                <span className="sec-spec-lbl">MITM Protection</span>
                <span className="sec-spec-val">AAD Note-ID Binding</span>
              </div>
              <div className="sec-spec-row">
                <span className="sec-spec-lbl">Currently Locked Notes</span>
                <span className="sec-spec-val">{lockedNotesCount}</span>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <div className="settings-toggle-row">
                <div>
                  <span className="settings-toggle-title">Active Failed Lockouts</span>
                  <span className="settings-toggle-sub">{lockoutCount} note(s) on exponential backoff</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    lockoutManager.clearAllLockouts();
                    setLockoutCount(0);
                    setShowClearSuccess(true);
                    setTimeout(() => setShowClearSuccess(false), 3000);
                  }}
                >
                  {showClearSuccess ? '✓ Cleared' : 'Reset Cooldowns'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BACKUP, RESTORE & TUTORIAL RESET */}
      {activeTab === 'backup' && (
        <div className="settings-symmetrical-grid">
          {/* Backup & Restore */}
          <div className="settings-card-panel">
            <h4 className="panel-section-title">Vault Backup & Sync</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Export full database backups with zero external cloud dependencies.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Button variant="outline" size="md" onClick={onExportVault}>
                <Download size={14} />
                <span>Export Entire Vault (.noteflow)</span>
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} />
                <span>Restore Vault from Backup File</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".noteflow,.json"
                style={{ display: 'none' }}
                onChange={onImportVault}
              />
            </div>
          </div>

          {/* Reset & Initialize Tutorial Vault */}
          <div className="settings-card-panel">
            <h4 className="panel-section-title">Tutorial & Factory Reset</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Reset vault to the comprehensive interactive tutorial dataset (4 workspaces, 3 books with chapters, LaTeX math, diagrams, drawing vector sketches, and flashcards).
            </p>

            {!showResetConfirm ? (
              <Button
                variant="danger"
                size="md"
                onClick={() => setShowResetConfirm(true)}
              >
                <RotateCcw size={14} />
                <span>Reset to Curated Tutorial Vault</span>
              </Button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="danger"
                  size="md"
                  isLoading={isResetting}
                  onClick={handleConfirmReseed}
                >
                  Confirm Reset
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setShowResetConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: DIAGNOSTICS & OFFLINE BEAM */}
      {activeTab === 'diagnostics' && (
        <div className="settings-symmetrical-grid">
          {/* Storage Diagnostics */}
          <div className="settings-card-panel">
            <h4 className="panel-section-title">Storage Quota Diagnostics</h4>
            {health && (
              <>
                <div className="storage-meter-track" style={{ margin: '14px 0 8px 0' }}>
                  <div
                    className="storage-meter-fill"
                    style={{ width: `${Math.min(Math.round(health.usagePercent), 100)}%` }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>{optimizer.formatBytes(health.usageBytes)} used</span>
                  <span>{Math.round(health.usagePercent)}% of browser capacity</span>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '13px', display: 'block' }}>Cache Optimizer</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prune orphaned preview blobs</span>
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
              </>
            )}
          </div>

          {/* Offline QR Beam */}
          <div className="settings-card-panel preview-center">
            <h4 className="panel-section-title">Zero-Cloud QR Beam</h4>
            <div className="qr-beam-box">
              <div className="qr-code-placeholder">
                <QrCode size={90} color="var(--text-primary)" />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, marginTop: '8px' }}>
                Offline Device Transfer
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                Scan with mobile camera to beam selected notes without server uplink.
              </span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
