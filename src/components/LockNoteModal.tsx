import React, { useState, useEffect } from 'react';
import type { Note, EncryptedPayload } from '../types';
import { cryptoService } from '../services/crypto';
import { lockoutManager } from '../services/cryptoLockout';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Lock, Unlock, ShieldAlert, KeyRound, Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface LockNoteModalProps {
  isOpen: boolean;
  note: Note | null;
  mode: 'lock' | 'unlock';
  onClose: () => void;
  onLockSuccess: (encryptedPayload: EncryptedPayload) => void;
  onUnlockSuccess: (decryptedContent: string) => void;
  onRemoveLock?: () => void;
}

export const LockNoteModal: React.FC<LockNoteModalProps> = ({
  isOpen,
  note,
  mode,
  onClose,
  onLockSuccess,
  onUnlockSuccess,
  onRemoveLock
}) => {
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [hint, setHint] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Anti-Brute-Force Lockout State
  const [lockoutSecs, setLockoutSecs] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Check lockout on mount or when note changes
  useEffect(() => {
    if (isOpen && note) {
      setPassphrase('');
      setConfirmPassphrase('');
      setError(null);
      const status = lockoutManager.getLockoutStatus(note.id);
      setLockoutSecs(status.remainingSeconds);
      setFailedAttempts(status.failedAttempts);
    }
  }, [isOpen, note]);

  // Lockout Countdown Timer
  useEffect(() => {
    if (lockoutSecs <= 0) return;
    const timer = setInterval(() => {
      setLockoutSecs((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSecs]);

  if (!isOpen || !note) return null;

  const strength = cryptoService.evaluateStrength(passphrase);
  const isLockedOut = lockoutSecs > 0;

  // Handle Encrypt / Lock
  const handleLock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (passphrase.length < 4) {
      setError('Passphrase must be at least 4 characters long.');
      return;
    }
    if (passphrase !== confirmPassphrase) {
      setError('Passphrases do not match.');
      return;
    }

    try {
      setIsProcessing(true);
      const payload = await cryptoService.encrypt(
        note.content,
        passphrase,
        note.id,
        hint
      );
      onLockSuccess(payload);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Encryption failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Decrypt / Unlock
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;
    setError(null);

    if (!note.encryptedData) {
      setError('Note has no encrypted data payload.');
      return;
    }

    try {
      setIsProcessing(true);
      const decrypted = await cryptoService.decrypt(
        note.encryptedData,
        passphrase,
        note.id
      );

      // Reset brute-force counter on success
      lockoutManager.recordSuccess(note.id);
      setFailedAttempts(0);
      setLockoutSecs(0);

      onUnlockSuccess(decrypted);
      onClose();
    } catch {
      // Record failure for exponential backoff lockout
      const status = lockoutManager.recordFailedAttempt(note.id);
      setFailedAttempts(status.failedAttempts);
      setLockoutSecs(status.remainingSeconds);

      if (status.remainingSeconds > 0) {
        setError(`Incorrect passphrase. Rate-limit active: locked for ${status.remainingSeconds}s.`);
      } else {
        setError(`Incorrect passphrase (${status.failedAttempts} failed attempts).`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const isUnlockMode = mode === 'unlock';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isUnlockMode ? 'Unlock Protected Note' : 'Encrypt & Lock Note'}
      subtitle={
        isUnlockMode 
          ? 'Enter your passphrase to decrypt this note into memory.'
          : 'Zero-Knowledge AES-256-GCM encryption with anti-tamper authentication.'
      }
      icon={isUnlockMode ? <Lock size={20} color="var(--color-warning)" /> : <KeyRound size={20} color="var(--color-primary)" />}
      maxWidth={520}
    >
      <form onSubmit={isUnlockMode ? handleUnlock : handleLock} className="crypto-form">
        {/* Anti-Brute-Force Banner */}
        {isLockedOut && (
          <div className="crypto-lockout-banner">
            <ShieldAlert size={20} color="var(--color-danger)" />
            <div>
              <strong>Brute-Force Defense Active</strong>
              <p>{failedAttempts} failed attempts recorded. Try again in <strong>{lockoutSecs}s</strong>.</p>
            </div>
          </div>
        )}

        {/* Security Specs Pill */}
        <div className="crypto-badge-strip">
          <Badge variant="primary" dot>AES-256-GCM</Badge>
          <Badge variant="purple">PBKDF2 600K</Badge>
          <Badge variant="success">Zero-Knowledge</Badge>
          <Badge variant="default">Anti-MITM Bound</Badge>
        </div>

        {/* Password Hint if Available */}
        {isUnlockMode && note.encryptedData?.hint && (
          <div className="crypto-hint-box">
            <span className="crypto-hint-label">Password Hint:</span>
            <span className="crypto-hint-text">{note.encryptedData.hint}</span>
          </div>
        )}

        {/* Passphrase Input */}
        <div className="ui-form-group">
          <label className="ui-form-label" htmlFor="note-passphrase">
            {isUnlockMode ? 'Passphrase' : 'New Passphrase'}
          </label>
          <div className="ui-input-wrap">
            <input
              id="note-passphrase"
              type={showPassword ? 'text' : 'password'}
              className="ui-input"
              placeholder={isUnlockMode ? 'Enter passphrase...' : 'Create strong passphrase / PIN...'}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              disabled={isLockedOut || isProcessing}
              autoFocus
              autoComplete="off"
            />
            <button
              type="button"
              className="ui-input-eye-btn"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Passphrase Strength & Confirm (Only in Lock Mode) */}
        {!isUnlockMode && (
          <>
            <div className="crypto-strength-meter">
              <div className="crypto-strength-bar">
                <div 
                  className="crypto-strength-fill" 
                  style={{ width: `${strength.score}%`, backgroundColor: strength.color }}
                />
              </div>
              <div className="crypto-strength-text">
                <span>Strength: <strong style={{ color: strength.color }}>{strength.label}</strong></span>
                <span>{passphrase.length} chars</span>
              </div>
            </div>

            <div className="ui-form-group">
              <label className="ui-form-label" htmlFor="confirm-passphrase">
                Confirm Passphrase
              </label>
              <input
                id="confirm-passphrase"
                type={showPassword ? 'text' : 'password'}
                className="ui-input"
                placeholder="Confirm passphrase..."
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                disabled={isProcessing}
                autoComplete="off"
              />
            </div>

            <div className="ui-form-group">
              <label className="ui-form-label" htmlFor="passphrase-hint">
                Password Hint (Optional)
              </label>
              <input
                id="passphrase-hint"
                type="text"
                className="ui-input"
                placeholder="e.g. Favorite book from college"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                disabled={isProcessing}
                maxLength={60}
              />
              <span className="ui-form-help">
                Stored unencrypted to help you recall your passphrase.
              </span>
            </div>
          </>
        )}

        {/* Error message */}
        {error && (
          <div className="crypto-error-box">
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="crypto-actions">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>

          {isUnlockMode && onRemoveLock && (
            <Button
              type="button"
              variant="outline"
              onClick={onRemoveLock}
              disabled={isProcessing || isLockedOut}
              title="Decrypt and remove encryption permanently"
            >
              Remove Lock
            </Button>
          )}

          <Button
            type="submit"
            variant="primary"
            isLoading={isProcessing}
            disabled={isLockedOut || !passphrase}
            leftIcon={isUnlockMode ? <Unlock size={16} /> : <Lock size={16} />}
          >
            {isUnlockMode ? 'Unlock Note' : 'Encrypt Note'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
