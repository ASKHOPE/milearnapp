import type { Note } from '../types';

export interface MindConcept {
  id: string;
  term: string;
  definition?: string;
  originNoteId: string;
  originNoteTitle: string;
  occurrences: {
    noteId: string;
    noteTitle: string;
    snippet: string;
  }[];
  tags: string[];
  type: 'concept' | 'wikilink' | 'heading' | 'keyword';
  firstSeen: string;
}

export interface MindAnalytics {
  totalTerms: number;
  totalDefinitions: number;
  conceptClusters: { tag: string; count: number }[];
  mostConnectedTerms: { term: string; noteCount: number }[];
  vocabularyRichness: number; // percentage based on unique terms / total words
  orphanTermsCount: number; // terms appearing in only 1 note
}

export class InternalMindService {
  /**
   * Scans all notes to build the personal knowledge lexicon
   */
  public buildDictionary(notes: Note[]): {
    concepts: MindConcept[];
    analytics: MindAnalytics;
  } {
    const conceptMap = new Map<string, MindConcept>();
    let totalWordCount = 0;
    const allUniqueWords = new Set<string>();

    const activeNotes = notes.filter((n) => !n.isTrashed && !n.isLocked);

    for (const note of activeNotes) {
      const lines = note.content.split('\n');
      const noteWords = note.content.toLowerCase().match(/[a-z0-9_-]{3,}/gi) || [];
      totalWordCount += noteWords.length;
      noteWords.forEach((w) => allUniqueWords.add(w));

      lines.forEach((line) => {
        const cleanLine = line.trim();

        // 1. Concept Syntax: Term :: Definition
        if (cleanLine.includes('::')) {
          const parts = cleanLine.split('::');
          const term = parts[0].replace(/^[-*#\s]+/, '').trim();
          const def = parts.slice(1).join('::').trim();

          if (term.length >= 2 && def.length >= 3) {
            this.registerConcept(conceptMap, {
              term,
              definition: def,
              noteId: note.id,
              noteTitle: note.title,
              snippet: cleanLine,
              tags: note.tags || [],
              type: 'concept'
            });
          }
        }

        // 2. Wikilinks: [[Concept Name]]
        const wikiMatches = cleanLine.match(/\[\[(.*?)\]\]/g);
        if (wikiMatches) {
          wikiMatches.forEach((wm) => {
            const term = wm.slice(2, -2).trim();
            if (term.length >= 2) {
              this.registerConcept(conceptMap, {
                term,
                noteId: note.id,
                noteTitle: note.title,
                snippet: cleanLine,
                tags: note.tags || [],
                type: 'wikilink'
              });
            }
          });
        }

        // 3. Bold definitions: **Term**: definition
        const boldMatch = cleanLine.match(/^\*\*([^*]+)\*\*:\s*(.+)/);
        if (boldMatch) {
          const term = boldMatch[1].trim();
          const def = boldMatch[2].trim();
          if (term.length >= 2) {
            this.registerConcept(conceptMap, {
              term,
              definition: def,
              noteId: note.id,
              noteTitle: note.title,
              snippet: cleanLine,
              tags: note.tags || [],
              type: 'concept'
            });
          }
        }

        // 4. Significant Headings (# Heading)
        if (cleanLine.startsWith('#') && !cleanLine.startsWith('####')) {
          const headingText = cleanLine.replace(/^#+\s*/, '').replace(/^[^\w\s]+/, '').trim();
          if (headingText.length >= 3 && !headingText.toLowerCase().includes('welcome')) {
            this.registerConcept(conceptMap, {
              term: headingText,
              noteId: note.id,
              noteTitle: note.title,
              snippet: cleanLine,
              tags: note.tags || [],
              type: 'heading'
            });
          }
        }
      });
    }

    // Now cross-reference occurrences across all notes for each indexed term
    const concepts = Array.from(conceptMap.values());
    for (const concept of concepts) {
      const termRegex = new RegExp(`\\b${this.escapeRegex(concept.term)}\\b`, 'i');

      for (const note of activeNotes) {
        // If not already in occurrences
        if (!concept.occurrences.some((o) => o.noteId === note.id)) {
          if (termRegex.test(note.content)) {
            const matchedLine = note.content.split('\n').find((l) => termRegex.test(l)) || '';
            concept.occurrences.push({
              noteId: note.id,
              noteTitle: note.title,
              snippet: matchedLine.trim().slice(0, 140)
            });
          }
        }
      }
    }

    // Sort concepts by occurrences count descending
    concepts.sort((a, b) => b.occurrences.length - a.occurrences.length || a.term.localeCompare(b.term));

    // Compute analytics
    const tagClusterMap = new Map<string, number>();
    for (const c of concepts) {
      c.tags.forEach((t) => tagClusterMap.set(t, (tagClusterMap.get(t) || 0) + 1));
    }

    const conceptClusters = Array.from(tagClusterMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const mostConnectedTerms = concepts
      .slice(0, 6)
      .map((c) => ({ term: c.term, noteCount: c.occurrences.length }));

    const orphanTermsCount = concepts.filter((c) => c.occurrences.length <= 1).length;
    const richnessRatio = totalWordCount > 0 ? (allUniqueWords.size / totalWordCount) * 100 : 0;

    const analytics: MindAnalytics = {
      totalTerms: concepts.length,
      totalDefinitions: concepts.filter((c) => !!c.definition).length,
      conceptClusters,
      mostConnectedTerms,
      vocabularyRichness: Math.round(richnessRatio),
      orphanTermsCount
    };

    return { concepts, analytics };
  }

  private registerConcept(
    map: Map<string, MindConcept>,
    data: {
      term: string;
      definition?: string;
      noteId: string;
      noteTitle: string;
      snippet: string;
      tags: string[];
      type: 'concept' | 'wikilink' | 'heading' | 'keyword';
    }
  ) {
    const key = data.term.toLowerCase();
    const existing = map.get(key);

    if (existing) {
      if (!existing.definition && data.definition) {
        existing.definition = data.definition;
      }
      if (!existing.occurrences.some((o) => o.noteId === data.noteId)) {
        existing.occurrences.push({
          noteId: data.noteId,
          noteTitle: data.noteTitle,
          snippet: data.snippet
        });
      }
      data.tags.forEach((t) => {
        if (!existing.tags.includes(t)) existing.tags.push(t);
      });
    } else {
      map.set(key, {
        id: `concept-${Math.random().toString(36).slice(2, 9)}`,
        term: data.term,
        definition: data.definition,
        originNoteId: data.noteId,
        originNoteTitle: data.noteTitle,
        occurrences: [
          {
            noteId: data.noteId,
            noteTitle: data.noteTitle,
            snippet: data.snippet
          }
        ],
        tags: [...data.tags],
        type: data.type,
        firstSeen: new Date().toISOString()
      });
    }
  }

  public searchDictionary(concepts: MindConcept[], query: string, tagFilter?: string): MindConcept[] {
    const q = query.toLowerCase().trim();
    return concepts.filter((c) => {
      const matchesQuery = !q || c.term.toLowerCase().includes(q) || (c.definition && c.definition.toLowerCase().includes(q));
      const matchesTag = !tagFilter || c.tags.some((t) => t.toLowerCase() === tagFilter.toLowerCase());
      return matchesQuery && matchesTag;
    });
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export const internalMindService = new InternalMindService();
