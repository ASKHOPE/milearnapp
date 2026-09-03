import type { SecuritySettings } from '../types';

const SECURITY_STORAGE_KEY = 'noteflow_security_settings';

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  autoLockMinutes: 0, // 0 = disabled
  lockAction: 'entireApp'
};

export class InactivityLockManager {
  private timer: any = null;
  private onLockCallback: (() => void) | null = null;
  private settings: SecuritySettings = { ...DEFAULT_SECURITY_SETTINGS };

  constructor() {
    this.settings = this.getSettings();
  }

  public getSettings(): SecuritySettings {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(SECURITY_STORAGE_KEY);
        if (raw) return { ...DEFAULT_SECURITY_SETTINGS, ...JSON.parse(raw) };
      }
      return { ...this.settings };
    } catch {
      return { ...this.settings };
    }
  }

  public saveSettings(settings: SecuritySettings): void {
    this.settings = { ...settings };
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(settings));
      }
    } catch (err) {}
    this.restartTimer();
  }

  public getRemainingSeconds(): number {
    return (this.settings.autoLockMinutes || 0) * 60;
  }

  public triggerImmediateLock(): void {
    if (this.onLockCallback) {
      this.onLockCallback();
    }
  }

  public start(onLock: () => void): void {
    this.onLockCallback = onLock;

    if (typeof window === 'undefined') return;

    // Reset inactivity timer on any user gesture
    const handleActivity = () => {
      this.resetTimer();
    };

    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('pointerdown', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });

    this.restartTimer();
  }

  private resetTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.restartTimer();
  }

  private restartTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (!this.settings.autoLockMinutes || this.settings.autoLockMinutes <= 0) {
      return; // Disabled
    }

    const ms = this.settings.autoLockMinutes * 60 * 1000;
    this.timer = setTimeout(() => {
      if (this.onLockCallback) {
        this.onLockCallback();
      }
    }, ms);
  }

  public stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export const inactivityLockManager = new InactivityLockManager();
