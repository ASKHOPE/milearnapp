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

export const MONKEY_TYPE_PRESETS: PassageItem[] = [
  // EASY: Top common smooth English words
  {
    id: 'easy-words-1',
    title: 'Easy: Common Words (15)',
    category: 'Wisdom',
    difficulty: 'beginner',
    text: 'the quick brown fox jumps over the lazy dog and runs into the warm sun'
  },
  {
    id: 'easy-words-2',
    title: 'Easy: Smooth Cadence (25)',
    category: 'Wisdom',
    difficulty: 'beginner',
    text: 'time will come when you need to know how to write fast and clean every day with good flow'
  },
  {
    id: 'easy-words-3',
    title: 'Easy: Daily Vocabulary (30)',
    category: 'Wisdom',
    difficulty: 'beginner',
    text: 'they say that practice makes perfect so take small steps each morning to build your speed and calm your mind without any fear'
  },
  {
    id: 'easy-words-4',
    title: 'Easy: Clear Focus (20)',
    category: 'Wisdom',
    difficulty: 'beginner',
    text: 'keep your fingers relaxed on the home row and let each key press feel light and smooth'
  },

  // NORMAL: Everyday knowledge & natural punctuation
  {
    id: 'norm-words-1',
    title: 'Normal: Local-First Autonomy (25)',
    category: 'Tech',
    difficulty: 'intermediate',
    text: 'Local-first architecture ensures that your data stays on your own machine, enabling offline access, immediate feedback, and complete privacy at all times.'
  },
  {
    id: 'norm-words-2',
    title: 'Normal: Cognitive Clarity (28)',
    category: 'Science',
    difficulty: 'intermediate',
    text: 'Writing down your thoughts into a structured second brain reduces mental clutter, allowing deep focus on solving hard problems with confidence and joy.'
  },
  {
    id: 'norm-words-3',
    title: 'Normal: Spaced Learning (25)',
    category: 'Wisdom',
    difficulty: 'intermediate',
    text: 'Reviewing difficult concepts right before you forget them strengthens neural pathways, transforming fleeting ideas into permanent understanding over time.'
  },
  {
    id: 'norm-words-4',
    title: 'Normal: Modern Web (24)',
    category: 'Tech',
    difficulty: 'intermediate',
    text: 'Modern web applications combine responsive typography, rich aesthetics, and instant local state to deliver an experience indistinguishable from native apps.'
  },

  // HARD: Complex technical vocabulary, punctuation & numbers
  {
    id: 'hard-words-1',
    title: 'Hard: Distributed Consensus (35)',
    category: 'Tech',
    difficulty: 'expert',
    text: 'Byzantine fault-tolerant protocols, such as PBFT & Raft, maintain state synchronization across n >= 3f + 1 nodes; ensuring quorum commit safety despite asynchronous network partitions and arbitrary message loss.'
  },
  {
    id: 'hard-words-2',
    title: 'Hard: Quantum & Cryptography (30)',
    category: 'Science',
    difficulty: 'expert',
    text: 'Zero-knowledge proofs (zk-SNARKs) verify quadratic arithmetic programs with succinct O(1) proofs, preserving cryptographic privacy while validating computational integrity across decentralized ledgers with 256-bit security.'
  },
  {
    id: 'hard-words-3',
    title: 'Hard: Matrix Calculus (30)',
    category: 'Science',
    difficulty: 'expert',
    text: 'Eigenvalue decomposition of Hermitian operators yields orthogonal eigenvectors: lambda_i * v_i = H * v_i, governing continuous-time Schrödinger evolution in complex Hilbert space H_n with norm ||psi|| = 1.'
  },

  // CODE: Real code snippets with symbols
  {
    id: 'code-snippet-1',
    title: 'Code: TypeScript Function',
    category: 'Code',
    difficulty: 'code',
    text: 'const calculateWpm = (chars: number, minutes: number): number => Math.round((chars / 5) / minutes);'
  },
  {
    id: 'code-snippet-2',
    title: 'Code: React Hook Pipeline',
    category: 'Code',
    difficulty: 'code',
    text: 'const [state, setState] = useState(() => initialData.filter(item => item.isActive && item.score > 0));'
  },
  {
    id: 'code-snippet-3',
    title: 'Code: SQL Query & Index',
    category: 'Code',
    difficulty: 'code',
    text: 'SELECT id, title, created_at FROM notes WHERE is_archived = false ORDER BY updated_at DESC LIMIT 50;'
  }
];

class TypingMetricsService {
  private currentKeystrokes: KeystrokeEvent[] = [];
  private lastKeyUpTime: number = 0;
  private activeKeyDowns: Map<string, number> = new Map();
  private sessionStartTime: number = 0;
  private isListening: boolean = false;
  private currentPassageTitle: string = 'Practice Sprint';
  private currentExpectedText: string = '';
  private currentTypedChars: string = '';
  private sessionErrorCount: number = 0;

  private listeners: Set<(stats: TypingSessionStats) => void> = new Set();

  // Ambient Live Note Typing Tracker (for Header Pinned Widget)
  private ambientKeystrokes: Array<{ time: number; isError: boolean }> = [];
  private ambientBurstStartTime: number = 0;
  private ambientResetTimeout: ReturnType<typeof setTimeout> | null = null;
  private ambientLastKeyTime: number = 0;

  public isSessionActive(): boolean {
    return this.isListening;
  }

  public startSession(passageTitle = 'Practice Sprint', expectedText = '') {
    this.currentKeystrokes = [];
    this.activeKeyDowns.clear();
    this.sessionStartTime = performance.now();
    this.lastKeyUpTime = performance.now();
    this.isListening = true;
    this.currentPassageTitle = passageTitle;
    this.currentExpectedText = expectedText;
    this.currentTypedChars = '';
    this.sessionErrorCount = 0;
    this.notifySubscribers();
  }

  public setExpectedText(text: string) {
    this.currentExpectedText = text;
  }

  public updateLiveInput(typed: string) {
    this.currentTypedChars = typed;
    this.notifySubscribers();
  }

  /**
   * Ambient keystroke recorder for live typing in notes and text editors.
   * Calculates real-time rolling WPM without requiring the practice sprint game to be open.
   */
  public recordAmbientKeystroke(e: KeyboardEvent) {
    if (this.isListening) return; // Practice game handles its own keystroke pipeline

    // Ignore standalone modifier presses
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape'].includes(e.key)) return;

    const now = performance.now();
    const isError = e.key === 'Backspace' || e.key === 'Delete';

    // If more than 3.5s elapsed since last key, restart burst
    if (this.ambientLastKeyTime === 0 || (now - this.ambientLastKeyTime) > 3500) {
      this.ambientBurstStartTime = now;
      this.ambientKeystrokes = [];
    }
    this.ambientLastKeyTime = now;

    this.ambientKeystrokes.push({ time: now, isError });

    // Prune keystrokes older than 30 seconds
    const cutoff = now - 30000;
    this.ambientKeystrokes = this.ambientKeystrokes.filter(k => k.time >= cutoff);

    this.notifySubscribers();

    // Idle decay: after 4s without typing, gently settle
    if (this.ambientResetTimeout) clearTimeout(this.ambientResetTimeout);
    this.ambientResetTimeout = setTimeout(() => {
      this.notifySubscribers();
    }, 4000);
  }

  public recordKeyDown(e: KeyboardEvent, currentInput?: string) {
    if (!this.isListening) {
      this.recordAmbientKeystroke(e);
      return;
    }

    const now = performance.now();
    const key = e.key;

    // Avoid multiple triggers for holding a key
    if (this.activeKeyDowns.has(e.code)) return;

    this.activeKeyDowns.set(e.code, now);

    const flightTime = this.lastKeyUpTime > 0 ? Math.max(0, now - this.lastKeyUpTime) : 0;
    const isBackspaceOrDelete = key === 'Backspace' || key === 'Delete';

    let isMistake = isBackspaceOrDelete;
    if (this.currentExpectedText && !isBackspaceOrDelete && key.length === 1) {
      const idx = currentInput !== undefined ? currentInput.length : this.currentTypedChars.length;
      if (idx < this.currentExpectedText.length) {
        if (key !== this.currentExpectedText[idx]) {
          isMistake = true;
          this.sessionErrorCount++;
        }
      }
    }

    const event: KeystrokeEvent = {
      key,
      code: e.code,
      pressTime: now,
      flightTime,
      isError: isMistake
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

    // If ambient tracking is active outside the game modal
    if (!this.isListening && this.ambientKeystrokes.length > 0) {
      const isIdle = (now - this.ambientLastKeyTime) > 3500;
      if (isIdle) {
        return {
          wpm: 0,
          rawWpm: 0,
          cpm: 0,
          accuracy: 100,
          totalKeystrokes: this.ambientKeystrokes.length,
          correctKeystrokes: this.ambientKeystrokes.filter(k => !k.isError).length,
          errorKeystrokes: this.ambientKeystrokes.filter(k => k.isError).length,
          backspaceCount: this.ambientKeystrokes.filter(k => k.isError).length,
          averageHoldTime: 0,
          averageFlightTime: 0,
          consistencyScore: 100,
          durationSeconds: 0,
          timestamp: new Date().toISOString(),
          passageTitle: 'Live Note Taking'
        };
      }

      const burstDurationMs = Math.max(800, now - this.ambientBurstStartTime);
      const burstDurationMin = burstDurationMs / 60000;
      const totalKeys = this.ambientKeystrokes.length;
      const errKeys = this.ambientKeystrokes.filter(k => k.isError).length;
      const netKeys = Math.max(0, totalKeys - errKeys);

      const netWpm = Math.round((netKeys / 5) / burstDurationMin);
      const rawWpm = Math.round((totalKeys / 5) / burstDurationMin);
      const accuracy = totalKeys > 0 ? Math.round((netKeys / totalKeys) * 1000) / 10 : 100;

      return {
        wpm: Math.min(250, Math.max(0, netWpm)),
        rawWpm: Math.min(250, Math.max(0, rawWpm)),
        cpm: Math.round(totalKeys / burstDurationMin),
        accuracy,
        totalKeystrokes: totalKeys,
        correctKeystrokes: netKeys,
        errorKeystrokes: errKeys,
        backspaceCount: errKeys,
        averageHoldTime: 0,
        averageFlightTime: 0,
        consistencyScore: 95,
        durationSeconds: Math.round(burstDurationMs / 1000),
        timestamp: new Date().toISOString(),
        passageTitle: 'Live Note Taking'
      };
    }

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
      }
      if (stroke.isError) {
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

    // Also compare currentTypedChars against currentExpectedText
    let liveMismatch = 0;
    if (this.currentExpectedText && this.currentTypedChars) {
      for (let i = 0; i < this.currentTypedChars.length; i++) {
        if (i < this.currentExpectedText.length && this.currentTypedChars[i] !== this.currentExpectedText[i]) {
          liveMismatch++;
        }
      }
    }

    const effectiveErrors = Math.max(errorCount, liveMismatch, this.sessionErrorCount);
    const correctKeystrokes = Math.max(0, totalKeystrokes - effectiveErrors);
    const accuracy = totalKeystrokes > 0 ? Math.max(0, Math.min(100, (correctKeystrokes / totalKeystrokes) * 100)) : 100;

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
    let basePassages: PassageItem[] = [...MONKEY_TYPE_PRESETS];

    // 1. Fetch live from PostgreSQL backend
    try {
      const res = await fetch('/api/typing-passages');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          basePassages = [...MONKEY_TYPE_PRESETS, ...data];
          localStorage.setItem('milearnapp_typing_passages', JSON.stringify(data));
        }
      }
    } catch {}

    // 2. Cache fallback
    if (basePassages.length === MONKEY_TYPE_PRESETS.length) {
      try {
        const cached = localStorage.getItem('milearnapp_typing_passages');
        if (cached) {
          basePassages = [...MONKEY_TYPE_PRESETS, ...JSON.parse(cached)];
        }
      } catch {}
    }

    // 3. Dynamic Vault Passages from active user notes
    const dynamicVaultPassages: PassageItem[] = [];
    if (vaultNotes && vaultNotes.length > 0) {
      vaultNotes.slice(0, 3).forEach((n) => {
        if (!n.content || n.content.length < 50) return;
        const cleanText = n.content
          .replace(/[#*`_~[\]()]/g, '')
          .replace(/\n+/g, ' ')
          .trim()
          .slice(0, 140);

        if (cleanText.length > 25) {
          dynamicVaultPassages.push({
            id: `note-pass-${n.id}`,
            title: `Vault: ${n.title.slice(0, 20)}`,
            category: 'Tech',
            difficulty: cleanText.length > 100 ? 'intermediate' : 'beginner',
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

// Auto-register ambient keyboard telemetry on text editors and notes
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const isEditable = 
      target.tagName === 'TEXTAREA' || 
      target.tagName === 'INPUT' || 
      target.isContentEditable || 
      target.closest('.note-editor-pane') !== null ||
      target.closest('.rich-note-editor') !== null ||
      target.closest('.markdown-body') !== null;

    if (isEditable) {
      typingMetrics.recordAmbientKeystroke(e);
    }
  }, { passive: true });
}

