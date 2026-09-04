import { describe, it, expect, beforeEach } from 'bun:test';

// In-memory localStorage mock for headless Bun test runtime
const storageStore: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => (key in storageStore ? storageStore[key] : null),
  setItem: (key: string, val: string) => {
    storageStore[key] = String(val);
  },
  removeItem: (key: string) => {
    delete storageStore[key];
  },
  clear: () => {
    Object.keys(storageStore).forEach((k) => delete storageStore[k]);
  }
};

import { citationService, SEED_CITATIONS } from '../src/services/citationService';

describe('Academic Citation Service (Citation.js)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads seed citations when local storage is empty', () => {
    const list = citationService.getCitations();
    expect(list.length).toBe(SEED_CITATIONS.length);
    expect(list[0].title).toBe('Attention Is All You Need');
  });

  it('parses raw BibTeX strings accurately into structured CitationItems', () => {
    const bibtex = `@article{einstein1905,
      author = {Albert Einstein},
      title = {Zur Elektrodynamik bewegter Korper},
      journal = {Annalen der Physik},
      volume = {17},
      pages = {891--921},
      year = {1905}
    }`;

    const parsed = citationService.parseInput(bibtex);
    expect(parsed.length).toBe(1);
    expect(parsed[0].title).toContain('Zur Elektrodynamik');
    expect(parsed[0].author[0].family).toBe('Einstein');
    expect(parsed[0].year).toBe(1905);
  });

  it('formats APA and Vancouver in-text citations', () => {
    const sample = SEED_CITATIONS[0]; // Vaswani et al. 2017
    const apaInText = citationService.formatInText(sample, 'apa');
    expect(apaInText).toContain('Vaswani');
    expect(apaInText).toContain('2017');

    const vancouverInText = citationService.formatInText(sample, 'vancouver', 1);
    expect(vancouverInText).toBe('[1]');
  });

  it('generates APA formatted bibliography', () => {
    const formatted = citationService.formatBibliography([SEED_CITATIONS[0]], 'apa');
    expect(formatted).toContain('Vaswani');
    expect(formatted).toContain('Attention');
    expect(formatted).toContain('2017');
  });

  it('generates Vancouver formatted bibliography', () => {
    const formatted = citationService.formatBibliography([SEED_CITATIONS[0]], 'vancouver');
    expect(formatted.length).toBeGreaterThan(10);
    expect(formatted).toContain('Vaswani');
  });

  it('exports items to standard BibTeX representation', () => {
    const bibtex = citationService.exportToBibTeX([SEED_CITATIONS[0]]);
    expect(bibtex).toContain('@');
    expect(bibtex).toContain('Vaswani');
    expect(bibtex).toContain('Attention');
  });

  it('saves and deletes citations in storage', () => {
    const custom = {
      id: 'custom-test-1',
      type: 'book',
      title: 'The Art of Computer Programming',
      author: [{ given: 'Donald E.', family: 'Knuth', literal: 'Donald E. Knuth' }],
      year: 1968,
      dateAdded: new Date().toISOString()
    };

    citationService.saveCitation(custom);
    let current = citationService.getCitations();
    expect(current.some((c) => c.id === 'custom-test-1')).toBe(true);

    citationService.deleteCitation('custom-test-1');
    current = citationService.getCitations();
    expect(current.some((c) => c.id === 'custom-test-1')).toBe(false);
  });
});
