/**
 * Typing Metrics Service & Practice Engine
 * 
 * Provides keystroke dynamics, real-time WPM, accuracy, rhythm consistency,
 * and persistent practice session logs.
 * 
 * USER PRIVACY & INTENT:
 * Normal note editing is NOT tracked or logged into daily logs. Keystroke telemetry
 * and persistent session history are scoped strictly to the interactive Typing Practice Game.
 */

export interface KeystrokeEvent {
  key: string;
  code: string;
  pressTime: number;
  releaseTime?: number;
  holdTime?: number;      // Duration key was held down (ms)
  flightTime?: number;    // Time from previous keyup to this keydown (ms)
  isError: boolean;
}

export interface TypingSessionStats {
  wpm: number;
  rawWpm: number;
  cpm: number;
  accuracy: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  errorKeystrokes: number;
  backspaceCount: number;
  averageHoldTime: number;     // ms
  averageFlightTime: number;   // ms
  consistencyScore: number;    // 0-100%
  durationSeconds: number;
  timestamp: string;
  passageTitle?: string;
}

export interface PracticeGameSession extends TypingSessionStats {
  id: string;
  difficulty: 'beginner' | 'intermediate' | 'expert' | 'code';
}

export interface PassageItem {
  id: string;
  title: string;
  category: 'Tech' | 'Science' | 'Code' | 'Wisdom';
  difficulty: 'beginner' | 'intermediate' | 'expert' | 'code';
  text: string;
}

class TypingMetricsService {
  private currentKeystrokes: KeystrokeEvent[] = [];
  private lastKeyUpTime: number = 0;
  private activeKeyDowns: Map<string, number> = new Map();
  private sessionStartTime: number = 0;
  private isListening: boolean = false;
  private currentPassageTitle: string = 'Practice Sprint';

  private listeners: Set<(stats: TypingSessionStats) => void> = new Set();

  public isSessionActive(): boolean {
    return this.isListening;
  }

  public startSession(passageTitle = 'Practice Sprint') {
    this.currentKeystrokes = [];
    this.activeKeyDowns.clear();
    this.sessionStartTime = performance.now();
    this.lastKeyUpTime = performance.now();
    this.isListening = true;
    this.currentPassageTitle = passageTitle;
    this.notifySubscribers();
  }

  public recordKeyDown(e: KeyboardEvent) {
    if (!this.isListening) {
      return; // Do NOT listen or track keystrokes outside of active practice games
    }

    const now = performance.now();
    const key = e.key;

    // Avoid multiple triggers for holding a key
    if (this.activeKeyDowns.has(e.code)) return;

    this.activeKeyDowns.set(e.code, now);

    const flightTime = this.lastKeyUpTime > 0 ? Math.max(0, now - this.lastKeyUpTime) : 0;
    const isBackspaceOrDelete = key === 'Backspace' || key === 'Delete';

    const event: KeystrokeEvent = {
      key,
      code: e.code,
      pressTime: now,
      flightTime,
      isError: isBackspaceOrDelete
    };

    this.currentKeystrokes.push(event);
    this.notifySubscribers();
  }

  public recordKeyUp(e: KeyboardEvent) {
    if (!this.isListening) return;

    const now = performance.now();
    this.lastKeyUpTime = now;

    const pressTime = this.activeKeyDowns.get(e.code);
    if (pressTime !== undefined) {
      const holdTime = Math.max(0, now - pressTime);
      this.activeKeyDowns.delete(e.code);

      // Update matching KeystrokeEvent
      for (let i = this.currentKeystrokes.length - 1; i >= 0; i--) {
        if (this.currentKeystrokes[i].code === e.code && !this.currentKeystrokes[i].releaseTime) {
          this.currentKeystrokes[i].releaseTime = now;
          this.currentKeystrokes[i].holdTime = holdTime;
          break;
        }
      }
    }

    this.notifySubscribers();
  }

  public calculateStats(): TypingSessionStats {
    const now = performance.now();
    const durationMs = Math.max(500, now - (this.sessionStartTime || now));
    const durationSeconds = Math.round(durationMs / 1000);
    const durationMinutes = durationMs / 60000;

    const totalKeystrokes = this.currentKeystrokes.length;
    let backspaceCount = 0;
    let errorCount = 0;
    let totalHoldTime = 0;
    let validHoldCount = 0;
    let totalFlightTime = 0;
    let validFlightCount = 0;
    const flightTimes: number[] = [];

    for (const stroke of this.currentKeystrokes) {
      if (stroke.key === 'Backspace' || stroke.key === 'Delete') {
        backspaceCount++;
        errorCount++;
      }
      if (stroke.holdTime !== undefined) {
        totalHoldTime += stroke.holdTime;
        validHoldCount++;
      }
      if (stroke.flightTime !== undefined && stroke.flightTime < 2000) {
        totalFlightTime += stroke.flightTime;
        flightTimes.push(stroke.flightTime);
        validFlightCount++;
      }
    }

    const correctKeystrokes = Math.max(0, totalKeystrokes - errorCount);
    const accuracy = totalKeystrokes > 0 ? (correctKeystrokes / totalKeystrokes) * 100 : 100;

    const rawWpm = durationMinutes > 0 ? Math.round((totalKeystrokes / 5) / durationMinutes) : 0;
    const netWpm = durationMinutes > 0 ? Math.round((correctKeystrokes / 5) / durationMinutes) : 0;
    const cpm = durationMinutes > 0 ? Math.round(totalKeystrokes / durationMinutes) : 0;

    const averageHoldTime = validHoldCount > 0 ? Math.round(totalHoldTime / validHoldCount) : 0;
    const averageFlightTime = validFlightCount > 0 ? Math.round(totalFlightTime / validFlightCount) : 0;

    let consistencyScore = 100;
    if (flightTimes.length > 5) {
      const mean = averageFlightTime;
      const variance = flightTimes.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / flightTimes.length;
      const stdDev = Math.sqrt(variance);
      consistencyScore = Math.max(10, Math.min(100, Math.round(100 - (stdDev / 10))));
    }

    return {
      wpm: Math.max(0, netWpm),
      rawWpm: Math.max(0, rawWpm),
      cpm: Math.max(0, cpm),
      accuracy: Math.round(accuracy * 10) / 10,
      totalKeystrokes,
      correctKeystrokes,
      errorKeystrokes: errorCount,
      backspaceCount,
      averageHoldTime,
      averageFlightTime,
      consistencyScore,
      durationSeconds,
      timestamp: new Date().toISOString(),
      passageTitle: this.currentPassageTitle
    };
  }

  /**
   * Finalizes a completed practice game and saves it to the persistent practice log.
   */
  public endSessionAndPersist(difficulty: 'beginner' | 'intermediate' | 'expert' | 'code' = 'intermediate'): PracticeGameSession {
    const stats = this.calculateStats();
    const gameSession: PracticeGameSession = {
      ...stats,
      id: 'type-game-' + Date.now().toString(36),
      difficulty
    };

    if (stats.totalKeystrokes >= 5) {
      this.savePracticeSession(gameSession);
    }

    this.currentKeystrokes = [];
    this.activeKeyDowns.clear();
    this.isListening = false;
    this.notifySubscribers();
    return gameSession;
  }

  public cancelSession() {
    this.currentKeystrokes = [];
    this.activeKeyDowns.clear();
    this.isListening = false;
    this.notifySubscribers();
  }

  public getSessionHistory(): PracticeGameSession[] {
    try {
      const raw = localStorage.getItem('milearnapp_typing_practice_logs');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public clearHistory(): void {
    try {
      localStorage.removeItem('milearnapp_typing_practice_logs');
    } catch {}
  }

  private savePracticeSession(session: PracticeGameSession) {
    try {
      const history = this.getSessionHistory();
      const updated = [session, ...history].slice(0, 100);
      localStorage.setItem('milearnapp_typing_practice_logs', JSON.stringify(updated));
    } catch {}
  }

  public async getPracticePassages(vaultNotes?: Array<{ id: string; title: string; content?: string }>): Promise<PassageItem[]> {
    let basePassages: PassageItem[] = [];

    // 1. Fetch live from PostgreSQL backend
    try {
      const res = await fetch('/api/typing-passages');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          basePassages = data;
          localStorage.setItem('milearnapp_typing_passages', JSON.stringify(data));
        }
      }
    } catch {}

    // 2. Cache fallback
    if (basePassages.length === 0) {
      try {
        const cached = localStorage.getItem('milearnapp_typing_passages');
        if (cached) {
          basePassages = JSON.parse(cached);
        }
      } catch {}
    }

    // 3. Dynamic Vault Passages from active user notes
    const dynamicVaultPassages: PassageItem[] = [];
    if (vaultNotes && vaultNotes.length > 0) {
      vaultNotes.slice(0, 5).forEach((n) => {
        if (!n.content || n.content.length < 50) return;
        const cleanText = n.content
          .replace(/[#*`_~[\]()]/g, '')
          .replace(/\n+/g, ' ')
          .trim()
          .slice(0, 180);

        if (cleanText.length > 30) {
          dynamicVaultPassages.push({
            id: `note-pass-${n.id}`,
            title: `Vault: ${n.title}`,
            category: 'Tech',
            difficulty: cleanText.length > 120 ? 'intermediate' : 'beginner',
            text: cleanText
          });
        }
      });
    }

    return [...dynamicVaultPassages, ...basePassages];
  }

  public subscribe(callback: (stats: TypingSessionStats) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifySubscribers() {
    if (this.listeners.size === 0) return;
    const stats = this.calculateStats();
    this.listeners.forEach((cb) => cb(stats));
  }
}

export const typingMetrics = new TypingMetricsService();
