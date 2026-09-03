import React from 'react';
import { Lock, Unlock, Shield } from 'lucide-react';
import { Button } from './ui/Button';

interface InactivityOverlayProps {
  isLocked: boolean;
  profileName: string;
  profileAvatar: string;
  avatarType?: 'emoji' | 'gif' | 'image';
  onUnlock: () => void;
}

export const InactivityOverlay: React.FC<InactivityOverlayProps> = ({
  isLocked,
  profileName,
  profileAvatar,
  avatarType = 'emoji',
  onUnlock
}) => {
  if (!isLocked) return null;

  return (
    <div className="inactivity-overlay-backdrop">
      <div className="inactivity-card">
        <div className="inactivity-shield-wrap">
          <div className="inactivity-avatar-container">
            {avatarType === 'emoji' ? (
              <span style={{ fontSize: '36px' }}>{profileAvatar || '⚡'}</span>
            ) : (
              <img
                src={profileAvatar}
                alt="Profile"
                className="inactivity-avatar-img"
              />
            )}
            <div className="inactivity-lock-badge">
              <Lock size={12} color="#ffffff" />
            </div>
          </div>
        </div>

        <h3 className="inactivity-title">Vault Locked</h3>
        <p className="inactivity-sub">
          Auto-locked due to inactivity to protect <strong>{profileName}</strong>’s notes.
        </p>

        <div className="inactivity-security-pill">
          <Shield size={13} color="var(--color-success)" />
          <span>Zero-Knowledge AES-256 Memory Guard</span>
        </div>

        <div className="inactivity-actions">
          <Button variant="primary" size="md" onClick={onUnlock}>
            <Unlock size={14} />
            <span>Unlock Vault</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
