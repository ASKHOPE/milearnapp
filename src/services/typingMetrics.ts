/**
 * Typing Metrics Service
 * Implementation of typing rhythm, WPM, CPM, Key Hold Time, Key Flight Time,
 * Error Rate, Consistency, and Keystroke Dynamics running 100% locally on-device.
 * Inspired by https://github.com/balindam/typing-metrics
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
}

export interface DailyTypingMetrics {
  date: string; // YYYY-MM-DD
  totalWordsTyped: number;
  totalCharactersTyped: number;
  totalTimeSeconds: number;
  averageWpm: number;
  peakWpm: number;
  averageAccuracy: number;
  sessionCount: number;
}

class TypingMetricsService {
  private currentKeystrokes: KeystrokeEvent[] = [];
  private lastKeyUpTime: number = 0;
  private activeKeyDowns: Map<string, number> = new Map();
  private sessionStartTime: number = 0;
  private isListening: boolean = false;

  private listeners: Set<(stats: TypingSessionStats) => void> = new Set();

  constructor() {
    this.initDailyPersistence();
  }

  private initDailyPersistence() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const existing = this.getDailyMetrics(today);
      if (!existing) {
        this.saveDailyMetrics({
          date: today,
          totalWordsTyped: 0,
          totalCharactersTyped: 0,
          totalTimeSeconds: 0,
          averageWpm: 0,
          peakWpm: 0,
          averageAccuracy: 100,
          sessionCount: 0
        });
      }
    } catch {}
  }

  public startSession() {
    this.currentKeystrokes = [];
    this.activeKeyDowns.clear();
    this.sessionStartTime = performance.now();
    this.lastKeyUpTime = performance.now();
    this.isListening = true;
  }

  public recordKeyDown(e: KeyboardEvent) {
    if (!this.isListening) {
      this.startSession();
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
    const durationMs = Math.max(1000, now - (this.sessionStartTime || now));
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
      if (stroke.flightTime !== undefined && stroke.flightTime < 2000) { // filter out idle pauses
        totalFlightTime += stroke.flightTime;
        flightTimes.push(stroke.flightTime);
        validFlightCount++;
      }
    }

    const correctKeystrokes = Math.max(0, totalKeystrokes - errorCount);
    const accuracy = totalKeystrokes > 0 ? (correctKeystrokes / totalKeystrokes) * 100 : 100;

    // Standard metric: 1 word = 5 keystrokes
    const rawWpm = Math.round((totalKeystrokes / 5) / durationMinutes) || 0;
    const netWpm = Math.round((correctKeystrokes / 5) / durationMinutes) || 0;
    const cpm = Math.round(totalKeystrokes / durationMinutes) || 0;

    const averageHoldTime = validHoldCount > 0 ? Math.round(totalHoldTime / validHoldCount) : 0;
    const averageFlightTime = validFlightCount > 0 ? Math.round(totalFlightTime / validFlightCount) : 0;

    // Consistency score (standard deviation of flight times, normalized 0-100)
    let consistencyScore = 100;
    if (flightTimes.length > 5) {
      const mean = averageFlightTime;
      const variance = flightTimes.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / flightTimes.length;
      const stdDev = Math.sqrt(variance);
      // Lower standard deviation means higher consistency
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
      timestamp: new Date().toISOString()
    };
  }

  public endSessionAndPersist(): TypingSessionStats {
    const stats = this.calculateStats();
    if (stats.totalKeystrokes >= 10) {
      this.accumulateToDaily(stats);
      this.saveHistorySession(stats);
    }
    this.currentKeystrokes = [];
    this.activeKeyDowns.clear();
    this.isListening = false;
    return stats;
  }

  private accumulateToDaily(stats: TypingSessionStats) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const daily = this.getDailyMetrics(today) || {
        date: today,
        totalWordsTyped: 0,
        totalCharactersTyped: 0,
        totalTimeSeconds: 0,
        averageWpm: 0,
        peakWpm: 0,
        averageAccuracy: 100,
        sessionCount: 0
      };

      const wordsTyped = Math.round(stats.correctKeystrokes / 5);
      const newSessionCount = daily.sessionCount + 1;
      const newTotalWords = daily.totalWordsTyped + wordsTyped;
      const newTotalChars = daily.totalCharactersTyped + stats.totalKeystrokes;
      const newTotalTime = daily.totalTimeSeconds + stats.durationSeconds;
      const newPeakWpm = Math.max(daily.peakWpm, stats.wpm);
      const newAvgWpm = Math.round((daily.averageWpm * daily.sessionCount + stats.wpm) / newSessionCount);
      const newAvgAcc = Math.round(((daily.averageAccuracy * daily.sessionCount + stats.accuracy) / newSessionCount) * 10) / 10;

      const updated: DailyTypingMetrics = {
        date: today,
        totalWordsTyped: newTotalWords,
        totalCharactersTyped: newTotalChars,
        totalTimeSeconds: newTotalTime,
        averageWpm: newAvgWpm,
        peakWpm: newPeakWpm,
        averageAccuracy: newAvgAcc,
        sessionCount: newSessionCount
      };

      this.saveDailyMetrics(updated);
    } catch (e) {
      console.error('Failed to save daily typing metrics:', e);
    }
  }

  public getDailyMetrics(dateStr: string): DailyTypingMetrics | null {
    try {
      const raw = localStorage.getItem(`milearnapp_typing_daily_${dateStr}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public saveDailyMetrics(data: DailyTypingMetrics) {
    try {
      localStorage.setItem(`milearnapp_typing_daily_${data.date}`, JSON.stringify(data));
    } catch {}
  }

  public getSessionHistory(): TypingSessionStats[] {
    try {
      const raw = localStorage.getItem('milearnapp_typing_sessions_history');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveHistorySession(stats: TypingSessionStats) {
    try {
      const history = this.getSessionHistory();
      const updated = [stats, ...history].slice(0, 50); // Keep last 50 sessions
      localStorage.setItem('milearnapp_typing_sessions_history', JSON.stringify(updated));
    } catch {}
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
