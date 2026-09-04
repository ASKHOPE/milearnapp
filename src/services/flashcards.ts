import type { Flashcard, Note } from '../types';

const STORAGE_KEY = 'noteflow_flashcards_v1';
const memoryStore = new Map<string, string>();

function safeGetItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
  } catch {}
  return memoryStore.get(key) || null;
}

function safeSetItem(key: string, val: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, val);
      return;
    }
  } catch {}
  memoryStore.set(key, val);
}

export class FlashcardService {
  /**
   * Load all flashcards from persistent storage
   */
  public getFlashcards(): Flashcard[] {
    try {
      const raw = safeGetItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save flashcards to storage
   */
  public saveFlashcards(cards: Flashcard[]): void {
    try {
      safeSetItem(STORAGE_KEY, JSON.stringify(cards));
    } catch (err) {
      console.error('Failed to save flashcards', err);
    }
  }

  /**
   * Parse notes and extract flashcard candidates
   * Supports:
   * 1. Q: [Question] / A: [Answer]
   * 2. Front: [Front] / Back: [Back]
   * 3. [Concept] :: [Definition]
   * 4. Cloze deletions: ==[Hidden Answer]== or {{c1::[Hidden Answer]}}
   * 5. Cornell Notes table (Cues | Notes)
   */
  public extractCardsFromNote(note: Note): Flashcard[] {
    if (!note.content || note.isLocked) return [];

    const cards: Flashcard[] = [];
    const lines = note.content.split('\n');
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Q&A and Front/Back matching
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      const nextLine = lines[i + 1].trim();

      // Q: ... / A: ...
      const qMatch = line.match(/^(?:Q|Question):\s*(.+)$/i);
      const aMatch = nextLine.match(/^(?:A|Answer):\s*(.+)$/i);
      if (qMatch && aMatch) {
        cards.push({
          id: `fc-qa-${note.id}-${i}`,
          noteId: note.id,
          noteTitle: note.title || 'Untitled Note',
          question: qMatch[1].trim(),
          answer: aMatch[1].trim(),
          type: 'qa',
          repetition: 0,
          interval: 1,
          easeFactor: 2.5,
          nextReviewDate: todayStr
        });
        i++; // skip next line
        continue;
      }

      // Front: ... / Back: ...
      const fMatch = line.match(/^Front:\s*(.+)$/i);
      const bMatch = nextLine.match(/^Back:\s*(.+)$/i);
      if (fMatch && bMatch) {
        cards.push({
          id: `fc-fb-${note.id}-${i}`,
          noteId: note.id,
          noteTitle: note.title || 'Untitled Note',
          question: fMatch[1].trim(),
          answer: bMatch[1].trim(),
          type: 'qa',
          repetition: 0,
          interval: 1,
          easeFactor: 2.5,
          nextReviewDate: todayStr
        });
        i++;
        continue;
      }
    }

    // 2. Concept :: Definition matching
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.includes('::')) {
        const [left, ...rest] = trimmed.split('::');
        const question = left.replace(/^[-*#\d.]+\s*/, '').trim();
        const answer = rest.join('::').trim();
        if (question.length > 2 && answer.length > 2) {
          cards.push({
            id: `fc-concept-${note.id}-${idx}`,
            noteId: note.id,
            noteTitle: note.title || 'Untitled Note',
            question,
            answer,
            type: 'concept',
            repetition: 0,
            interval: 1,
            easeFactor: 2.5,
            nextReviewDate: todayStr
          });
        }
      }
    });

    // 3. Cloze Deletion matching: ==secret== or {{c1::secret}}
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      const clozeRegex = /==([^=]+)==|\{\{c\d+::([^}]+)\}\}/g;
      let match: RegExpExecArray | null;

      while ((match = clozeRegex.exec(trimmed)) !== null) {
        const hiddenAnswer = match[1] || match[2];
        if (hiddenAnswer && hiddenAnswer.length > 1) {
          const maskedPrompt = trimmed.replace(match[0], '[ ... ? ... ]');
          cards.push({
            id: `fc-cloze-${note.id}-${idx}-${match.index}`,
            noteId: note.id,
            noteTitle: note.title || 'Untitled Note',
            question: maskedPrompt,
            answer: hiddenAnswer,
            type: 'cloze',
            repetition: 0,
            interval: 1,
            easeFactor: 2.5,
            nextReviewDate: todayStr
          });
        }
      }
    });

    return cards;
  }

  /**
   * SuperMemo-2 (SM-2) Spaced Repetition Scheduling Algorithm
   * @param card Flashcard to update
   * @param grade Grade 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
   */
  public scheduleCard(card: Flashcard, grade: 1 | 2 | 3 | 4): Flashcard {
    let repetition = card.repetition;
    let interval = card.interval;
    let easeFactor = card.easeFactor;

    // SM-2 formula maps grade (1-4) to 0-5 scale
    const sm2Grade = grade === 1 ? 0 : grade === 2 ? 2 : grade === 3 ? 4 : 5;

    if (sm2Grade >= 3) {
      if (repetition === 0) {
        interval = 1;
      } else if (repetition === 1) {
        interval = 6;
      } else {
        const multiplier = grade === 4 ? 1.3 : 1.0;
        interval = Math.round(interval * easeFactor * multiplier);
      }
      repetition += 1;
    } else {
      repetition = 0;
      interval = 1;
    }

    // Update ease factor: EF' = EF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
    easeFactor = easeFactor + (0.1 - (5 - sm2Grade) * (0.08 + (5 - sm2Grade) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    // Calculate next review date
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);
    const nextReviewDate = nextDate.toISOString().split('T')[0];

    const todayStr = new Date().toISOString().split('T')[0];
    const history = [...(card.gradeHistory || []), { date: todayStr, grade }];

    return {
      ...card,
      repetition,
      interval,
      easeFactor: parseFloat(easeFactor.toFixed(2)),
      nextReviewDate,
      lastReviewed: todayStr,
      gradeHistory: history
    };
  }

  /**
   * Filter cards due for review today or overdue
   */
  public getDueCards(cards: Flashcard[], targetDate = new Date().toISOString().split('T')[0]): Flashcard[] {
    return cards.filter((c) => c.nextReviewDate <= targetDate);
  }

  /**
   * Merges newly extracted cards with existing card schedules so review history is preserved
   */
  public syncCardsForNotes(notes: Note[]): Flashcard[] {
    const existingCards = this.getFlashcards();
    const existingMap = new Map<string, Flashcard>();
    existingCards.forEach((c) => existingMap.set(c.id, c));

    const updatedList: Flashcard[] = [];
    const seenIds = new Set<string>();

    notes.forEach((note) => {
      const extracted = this.extractCardsFromNote(note);
      extracted.forEach((card) => {
        seenIds.add(card.id);
        const prev = existingMap.get(card.id);
        if (prev) {
          // Keep schedule, update question/answer if note was edited
          updatedList.push({
            ...prev,
            question: card.question,
            answer: card.answer,
            noteTitle: note.title
          });
        } else {
          updatedList.push(card);
        }
      });
    });

    // Retain manual user-created cards and cards from notes not currently in the batch
    existingCards.forEach((c) => {
      if (c.isManual && !seenIds.has(c.id)) {
        updatedList.push(c);
      }
    });

    this.saveFlashcards(updatedList);
    return updatedList;
  }

  /**
   * Adds a user-created manual flashcard / quiz question
   */
  public addManualCard(card: Omit<Flashcard, 'id' | 'repetition' | 'interval' | 'easeFactor' | 'nextReviewDate'>): Flashcard {
    const todayStr = new Date().toISOString().split('T')[0];
    const newCard: Flashcard = {
      ...card,
      id: 'manual-fc-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      repetition: 0,
      interval: 1,
      easeFactor: 2.5,
      nextReviewDate: todayStr,
      isManual: true
    };

    const existing = this.getFlashcards();
    const updated = [newCard, ...existing];
    this.saveFlashcards(updated);
    return newCard;
  }

  /**
   * Deletes a flashcard from storage
   */
  public deleteCard(cardId: string): void {
    const existing = this.getFlashcards();
    const updated = existing.filter((c) => c.id !== cardId);
    this.saveFlashcards(updated);
  }

  /**
   * Evaluates retention level for a specific note based on SuperMemo-2 card metrics
   */
  public getNoteRetention(noteId: string, cards?: Flashcard[]): NoteRetentionInfo {
    const allCards = cards || this.getFlashcards();
    const noteCards = allCards.filter((c) => c.noteId === noteId);

    if (noteCards.length === 0) {
      return {
        status: 'unreviewed',
        cardCount: 0,
        dueCount: 0,
        avgEaseFactor: 2.5,
        color: '#94a3b8',
        label: 'Unreviewed'
      };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const dueCount = noteCards.filter((c) => c.nextReviewDate <= todayStr).length;
    const avgEase = noteCards.reduce((acc, c) => acc + (c.easeFactor || 2.5), 0) / noteCards.length;

    if (dueCount > 0) {
      return {
        status: 'due',
        cardCount: noteCards.length,
        dueCount,
        avgEaseFactor: Math.round(avgEase * 10) / 10,
        color: '#eab308',
        label: `${dueCount} Due`
      };
    }

    if (avgEase < 2.0) {
      return {
        status: 'struggling',
        cardCount: noteCards.length,
        dueCount: 0,
        avgEaseFactor: Math.round(avgEase * 10) / 10,
        color: '#ef4444',
        label: 'Struggling'
      };
    }

    const isMastered = noteCards.some((c) => (c.interval || 0) >= 14 || ((c.repetition || 0) >= 2 && (c.easeFactor || 0) >= 2.4));
    if (isMastered) {
      return {
        status: 'mastered',
        cardCount: noteCards.length,
        dueCount: 0,
        avgEaseFactor: Math.round(avgEase * 10) / 10,
        color: '#22c55e',
        label: 'Mastered'
      };
    }

    return {
      status: 'due',
      cardCount: noteCards.length,
      dueCount: 0,
      avgEaseFactor: Math.round(avgEase * 10) / 10,
      color: '#3b82f6',
      label: 'Learning'
    };
  }

  /**
   * Generates a fast lookup Map of retention metrics for a list of notes
   */
  public getRetentionMap(notes: Note[]): Map<string, NoteRetentionInfo> {
    const cards = this.getFlashcards();
    const map = new Map<string, NoteRetentionInfo>();
    notes.forEach((n) => {
      map.set(n.id, this.getNoteRetention(n.id, cards));
    });
    return map;
  }
}

export type RetentionStatus = 'mastered' | 'due' | 'struggling' | 'unreviewed';

export interface NoteRetentionInfo {
  status: RetentionStatus;
  cardCount: number;
  dueCount: number;
  avgEaseFactor: number;
  color: string;
  label: string;
}

export const flashcardService = new FlashcardService();
