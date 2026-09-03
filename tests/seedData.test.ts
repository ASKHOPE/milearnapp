import { describe, it, expect } from 'bun:test';
import { 
  SAMPLE_WORKSPACES, 
  SAMPLE_BOOKS, 
  SAMPLE_FOLDERS, 
  SAMPLE_NOTES, 
  SAMPLE_DRAWING_DATA 
} from '../src/services/seedData';

describe('Initial Seed Data & Interactive Tutorial Content Tests', () => {
  it('defines 4 distinct personas and workspaces', () => {
    expect(SAMPLE_WORKSPACES.length).toBe(4);
    const ids = SAMPLE_WORKSPACES.map((w) => w.id);
    expect(ids).toContain('ws-personal');
    expect(ids).toContain('ws-learning');
    expect(ids).toContain('ws-work');
    expect(ids).toContain('ws-creative');
  });

  it('defines structured books with ordered chapters', () => {
    expect(SAMPLE_BOOKS.length).toBe(3);
    const mathBook = SAMPLE_BOOKS.find((b) => b.id === 'book-math-ai');
    expect(mathBook).toBeDefined();

    const bookNotes = SAMPLE_NOTES.filter((n) => n.bookId === 'book-math-ai');
    expect(bookNotes.length).toBeGreaterThanOrEqual(2);
    expect(bookNotes.every((n) => typeof n.pageOrder === 'number')).toBe(true);
  });

  it('contains comprehensive tutorial notes covering all power features', () => {
    // 1. Welcome Master Tutorial
    const welcome = SAMPLE_NOTES.find((n) => n.id === 'n-welcome');
    expect(welcome).toBeDefined();
    expect(welcome?.content).toContain('[[Active Recall & Flashcard Master Deck]]');
    expect(welcome?.tags).toContain('tutorial');

    // 2. Flashcards
    const flashcards = SAMPLE_NOTES.find((n) => n.id === 'n-flashcards');
    expect(flashcards).toBeDefined();
    expect(flashcards?.content).toContain('Q:');
    expect(flashcards?.content).toContain('DNS ::');
    expect(flashcards?.content).toContain('==299,792,458 m/s==');

    // 3. LaTeX Math
    const math = SAMPLE_NOTES.find((n) => n.id === 'n-math');
    expect(math).toBeDefined();
    expect(math?.content).toContain('E = mc^2');
    expect(math?.content).toContain('\\int_{-\\infty}^{\\infty}');

    // 4. Mermaid Diagrams
    const diagrams = SAMPLE_NOTES.find((n) => n.id === 'n-diagrams');
    expect(diagrams).toBeDefined();
    expect(diagrams?.content).toContain('```mermaid');
    expect(diagrams?.content).toContain('sequenceDiagram');

    // 5. Drawing & Sketches
    const drawings = SAMPLE_NOTES.find((n) => n.id === 'n-drawings');
    expect(drawings).toBeDefined();
    expect(drawings?.attachments.length).toBeGreaterThan(0);
    expect(drawings?.attachments[0].dataUrl).toContain('data:image/svg+xml');

    // 6. Zero-Knowledge Crypto Guide
    const cryptoGuide = SAMPLE_NOTES.find((n) => n.id === 'n-crypto-guide');
    expect(cryptoGuide).toBeDefined();
    expect(cryptoGuide?.content).toContain('AES-256-GCM');
    expect(cryptoGuide?.content).toContain('PBKDF2');

    // 7. Daily Journal
    const daily = SAMPLE_NOTES.find((n) => n.id === 'n-daily-journal');
    expect(daily).toBeDefined();
    expect(daily?.tags).toContain('daily');
    expect(daily?.content).toContain('Habit Checklist');
  });

  it('embeds valid drawing vector data URL', () => {
    expect(SAMPLE_DRAWING_DATA.startsWith('data:image/svg+xml')).toBe(true);
    expect(SAMPLE_DRAWING_DATA).toContain('<svg');
  });
});
