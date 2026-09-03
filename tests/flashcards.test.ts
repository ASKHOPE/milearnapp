import { describe, it, expect } from 'bun:test';
import { flashcardService } from '../src/services/flashcards';
import type { Note, Flashcard } from '../src/types';

describe('Flashcard Extraction & SuperMemo-2 (SM-2) Spaced Repetition Tests', () => {
  const sampleNote: Note = {
    id: 'note-study-1',
    title: 'Computer Science & Biology Notes',
    content: `# Learning Topic

Q: What is a closure in JavaScript?
A: A function bundled with references to its lexical environment.

Front: Mitochondria
Back: The powerhouse of the eukaryotic cell.

DNS :: Domain Name System translating hostnames to IP addresses.

The speed of light in vacuum is ==299,792,458 m/s== exactly.
`,
    folderId: null,
    tags: ['study'],
    isFavorite: false,
    isPinned: false,
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('extracts all card syntax types (Q&A, Front/Back, Concept::Definition, Cloze) from markdown', () => {
    const cards = flashcardService.extractCardsFromNote(sampleNote);

    expect(cards.length).toBe(4);

    // 1. Q&A
    const qa = cards.find((c) => c.question.includes('closure'));
    expect(qa).toBeDefined();
    expect(qa?.answer).toContain('lexical environment');
    expect(qa?.type).toBe('qa');

    // 2. Front/Back
    const fb = cards.find((c) => c.question.includes('Mitochondria'));
    expect(fb).toBeDefined();
    expect(fb?.answer).toContain('powerhouse');

    // 3. Concept :: Definition
    const concept = cards.find((c) => c.question === 'DNS');
    expect(concept).toBeDefined();
    expect(concept?.answer).toContain('Domain Name System');
    expect(concept?.type).toBe('concept');

    // 4. Cloze Deletion
    const cloze = cards.find((c) => c.type === 'cloze');
    expect(cloze).toBeDefined();
    expect(cloze?.answer).toBe('299,792,458 m/s');
    expect(cloze?.question).toContain('[ ... ? ... ]');
  });

  it('does not extract cards from locked notes (zero-knowledge privacy)', () => {
    const lockedNote: Note = {
      ...sampleNote,
      isLocked: true
    };
    const cards = flashcardService.extractCardsFromNote(lockedNote);
    expect(cards.length).toBe(0);
  });

  it('SM-2 Algorithm: Grade 1 (Again) resets repetition count and interval to 1 day', () => {
    const card: Flashcard = {
      id: 'fc-1',
      noteId: 'n-1',
      noteTitle: 'Test',
      question: 'Q',
      answer: 'A',
      type: 'qa',
      repetition: 4,
      interval: 18,
      easeFactor: 2.5,
      nextReviewDate: '2026-09-01'
    };

    const updated = flashcardService.scheduleCard(card, 1);
    expect(updated.repetition).toBe(0);
    expect(updated.interval).toBe(1);
    expect(updated.easeFactor).toBeLessThan(2.5);
  });

  it('SM-2 Algorithm: Grade 3 (Good) scales interval by ease factor', () => {
    const card: Flashcard = {
      id: 'fc-2',
      noteId: 'n-1',
      noteTitle: 'Test',
      question: 'Q',
      answer: 'A',
      type: 'qa',
      repetition: 2,
      interval: 6,
      easeFactor: 2.5,
      nextReviewDate: '2026-09-01'
    };

    const updated = flashcardService.scheduleCard(card, 3);
    expect(updated.repetition).toBe(3);
    expect(updated.interval).toBe(Math.round(6 * 2.5)); // 15 days
  });

  it('SM-2 Algorithm: Grade 4 (Easy) increases ease factor and awards bonus interval', () => {
    const card: Flashcard = {
      id: 'fc-3',
      noteId: 'n-1',
      noteTitle: 'Test',
      question: 'Q',
      answer: 'A',
      type: 'qa',
      repetition: 2,
      interval: 6,
      easeFactor: 2.5,
      nextReviewDate: '2026-09-01'
    };

    const updated = flashcardService.scheduleCard(card, 4);
    expect(updated.repetition).toBe(3);
    expect(updated.easeFactor).toBeGreaterThan(2.5);
    expect(updated.interval).toBeGreaterThan(Math.round(6 * 2.5));
  });

  it('SM-2 Algorithm: clamps ease factor to minimum 1.3 to prevent stagnation', () => {
    let card: Flashcard = {
      id: 'fc-4',
      noteId: 'n-1',
      noteTitle: 'Hard concept',
      question: 'Q',
      answer: 'A',
      type: 'qa',
      repetition: 0,
      interval: 1,
      easeFactor: 1.4,
      nextReviewDate: '2026-09-01'
    };

    // Repeat failure
    for (let i = 0; i < 5; i++) {
      card = flashcardService.scheduleCard(card, 1);
    }

    expect(card.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('filters due cards accurately according to nextReviewDate', () => {
    const cards: Flashcard[] = [
      { id: '1', noteId: 'n', noteTitle: 'T', question: 'Q1', answer: 'A1', type: 'qa', repetition: 1, interval: 1, easeFactor: 2.5, nextReviewDate: '2026-09-01' },
      { id: '2', noteId: 'n', noteTitle: 'T', question: 'Q2', answer: 'A2', type: 'qa', repetition: 1, interval: 1, easeFactor: 2.5, nextReviewDate: '2026-09-03' },
      { id: '3', noteId: 'n', noteTitle: 'T', question: 'Q3', answer: 'A3', type: 'qa', repetition: 1, interval: 10, easeFactor: 2.5, nextReviewDate: '2026-09-20' }
    ];

    const dueToday = flashcardService.getDueCards(cards, '2026-09-03');
    expect(dueToday.length).toBe(2);
    expect(dueToday.map((c) => c.id)).toEqual(['1', '2']);
  });
});
