import React, { useEffect, useRef } from 'react';
import type { UserProfile } from '../types';
import { CORE_MOODS } from '../services/avatarPresets';
import { User, Check, Settings, Shield, Smile } from 'lucide-react';

interface ProfileSwitcherPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile;
  onUpdateProfile?: (profile: UserProfile) => void;
  onOpenProfileSettings?: (tab?: string) => void;
  onOpenSettings?: (tab?: string) => void;
}

export const PRESET_PERSONAS: Array<{
  name: string;
  role: string;
  avatarType: 'emoji' | 'gif' | 'image';
  avatarValue: string;
  mood: string;
  bio: string;
}> = [
  {
    name: 'Alex Mercer',
    role: 'Full Stack Researcher',
    avatarType: 'emoji',
    avatarValue: '🦊',
    mood: '🧠 Deep Focus',
    bio: 'Building systems, taking notes, exploring knowledge networks.'
  },
  {
    name: 'Night Owl',
    role: 'Creative Writer',
    avatarType: 'emoji',
    avatarValue: '🦉',
    mood: '🎨 Creative Flow',
    bio: 'Late night drafts, poetry, and structured ideas.'
  },
  {
    name: 'Scholar',
    role: 'Academic Student',
    avatarType: 'emoji',
    avatarValue: '📚',
    mood: '🧘 Zen Calm',
    bio: 'Active recall, spaced repetition, and lecture summaries.'
  }
];

export const ProfileSwitcherPopover: React.FC<ProfileSwitcherPopoverProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  onOpenProfileSettings,
  onOpenSettings
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Outside click listener
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentName = userProfile?.name || 'Alex Mercer';
  const currentRole = userProfile?.role || 'Personal Knowledge Engineer';
  const currentMood = userProfile?.mood || '🧠 Deep Focus';
  const currentAvatarType = userProfile?.avatarType || 'emoji';
  const currentAvatarVal = userProfile?.avatarValue || '🦊';

  const handleSelectMood = (moodLabel: string, emoji: string) => {
    if (!onUpdateProfile || !userProfile) return;
    onUpdateProfile({
      ...userProfile,
      mood: `${emoji} ${moodLabel}`
    });
  };

  const handleSelectPersona = (persona: typeof PRESET_PERSONAS[0]) => {
    if (!onUpdateProfile || !userProfile) return;
    onUpdateProfile({
      ...userProfile,
      name: persona.name,
      role: persona.role,
      avatarType: persona.avatarType,
      avatarValue: persona.avatarValue,
      mood: persona.mood,
      bio: persona.bio
    });
  };

  return (
    <div className="xp-profile-popover" ref={popoverRef}>
      {/* Header Profile Summary */}
      <div className="xp-profile-popover-header">
        <div className="xp-profile-popover-avatar-wrap">
          {currentAvatarType === 'image' || currentAvatarType === 'gif' ? (
            <img src={currentAvatarVal} alt="Profile" className="xp-profile-popover-avatar-img" />
          ) : (
            <span className="xp-profile-popover-avatar-emoji">{currentAvatarVal}</span>
          )}
          <span className="xp-profile-online-badge" />
        </div>
        <div className="xp-profile-popover-info">
          <div className="xp-profile-popover-name-row">
            <h4 className="xp-profile-popover-name">{currentName}</h4>
            <span className="xp-profile-badge">Pro</span>
          </div>
          <p className="xp-profile-popover-role">{currentRole}</p>
          <div className="xp-profile-popover-current-mood">
            <span>{currentMood}</span>
          </div>
        </div>
      </div>

      <div className="xp-profile-divider" />

      {/* Quick Mood / Status Switcher */}
      <div className="xp-profile-section">
        <div className="xp-profile-section-title">
          <Smile size={13} />
          <span>Quick Status & Mood</span>
        </div>
        <div className="xp-profile-mood-chips">
          {CORE_MOODS.map((m) => {
            const isSelected = currentMood.includes(m.label);
            return (
              <button
                key={m.id}
                type="button"
                className={`xp-profile-mood-chip ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectMood(m.label, m.emoji)}
                title={m.label}
              >
                <span>{m.emoji}</span>
                <span className="xp-mood-chip-text">{m.label}</span>
                {isSelected && <Check size={11} className="xp-mood-chip-check" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="xp-profile-divider" />

      {/* Switch Personas / Accounts */}
      <div className="xp-profile-section">
        <div className="xp-profile-section-title">
          <User size={13} />
          <span>Switch Profile / Persona</span>
        </div>
        <div className="xp-profile-persona-list">
          {PRESET_PERSONAS.map((p) => {
            const isCurrent = currentName === p.name;
            return (
              <button
                key={p.name}
                type="button"
                className={`xp-profile-persona-item ${isCurrent ? 'active' : ''}`}
                onClick={() => handleSelectPersona(p)}
              >
                <div className="xp-persona-avatar">{p.avatarValue}</div>
                <div className="xp-persona-text">
                  <div className="xp-persona-name-row">
                    <strong>{p.name}</strong>
                    {isCurrent && <span className="xp-persona-active-badge">Active</span>}
                  </div>
                  <span>{p.role}</span>
                </div>
                {isCurrent && <Check size={14} className="xp-persona-check" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="xp-profile-divider" />

      {/* Footer Actions */}
      <div className="xp-profile-popover-footer">
        <button
          type="button"
          className="xp-profile-action-btn"
          onClick={() => {
            onClose();
            if (onOpenSettings) {
              onOpenSettings('profile');
            } else if (onOpenProfileSettings) {
              onOpenProfileSettings('profile');
            }
          }}
          title="Profile name, bio, role, and avatar preferences"
        >
          <Settings size={14} />
          <span>Profile Settings</span>
        </button>

        <button
          type="button"
          className="xp-profile-action-btn xp-profile-action-secondary"
          onClick={() => {
            onClose();
            if (onOpenSettings) {
              onOpenSettings('security');
            } else if (onOpenProfileSettings) {
              onOpenProfileSettings('security');
            }
          }}
          title="Security, Master PIN, and Account Lock"
        >
          <Shield size={14} />
          <span>Accounts</span>
        </button>
      </div>
    </div>
  );
};
