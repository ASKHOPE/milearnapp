import { describe, it, expect } from 'bun:test';
import { searchWorkerBridge } from '../src/services/searchWorkerBridge';
import type { Note } from '../src/types';

describe('Multi-Threaded Web Worker & Background Compute Bridge Tests', () => {
  const sampleNotes: Note[] = [
    {
      id: 'note-worker-1',
      title: 'Quantum Entanglement & Superposition',
      content: 'Detailed treatise on Bell state experiments and quantum information entropy.',
      tags: ['physics', 'quantum'],
      folderId: 'f1',
      isFavorite: true,
      isPinned: false,
      attachments: [{ id: 'a1', name: 'diagram.png', type: 'image', size: 1024, url: '' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'note-worker-2',
      title: 'Neural Network Architecture & Backprop',
      content: 'Derivation of matrix calculus gradients in deep convolutional neural nets.',
      tags: ['ai', 'neural-nets'],
      folderId: 'f2',
      isFavorite: false,
      isPinned: false,
      attachments: [{ id: 'a2', name: 'paper.pdf', type: 'pdf', size: 2048, url: '' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'note-worker-3',
      title: 'Rust Memory Safety & Borrow Checker',
      content: 'Lifetimes and ownership semantics enforcing zero-cost concurrency guarantees.',
      tags: ['systems', 'rust'],
      folderId: 'f1',
      isFavorite: false,
      isPinned: false,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  it('indexes notes into the worker bridge and returns item count', async () => {
    const res = await searchWorkerBridge.indexNotes(sampleNotes);
    expect(res.count).toBe(3);
  });

  it('performs keyword and multi-token search returning ranked results', async () => {
    await searchWorkerBridge.indexNotes(sampleNotes);

    // Search for "quantum"
    const qRes = await searchWorkerBridge.search('quantum');
    expect(qRes.resultIds).toContain('note-worker-1');
    expect(qRes.count).toBe(1);

    // Search for "neural backprop"
    const aiRes = await searchWorkerBridge.search('neural backprop');
    expect(aiRes.resultIds).toContain('note-worker-2');
    expect(aiRes.count).toBe(1);

    // Search for non-existent token
    const emptyRes = await searchWorkerBridge.search('nonexistentxyz');
    expect(emptyRes.count).toBe(0);
  });

  it('filters results by favorite status and attachment media types', async () => {
    await searchWorkerBridge.indexNotes(sampleNotes);

    const favRes = await searchWorkerBridge.search('', 'favorite');
    expect(favRes.resultIds).toEqual(['note-worker-1']);

    const imgRes = await searchWorkerBridge.search('', 'image');
    expect(imgRes.resultIds).toEqual(['note-worker-1']);

    const pdfRes = await searchWorkerBridge.search('', 'pdf');
    expect(pdfRes.resultIds).toEqual(['note-worker-2']);
  });

  it('calculates SuperMemo-2 (SM-2) batch spaced repetition intervals', async () => {
    const cards = [
      { id: 'c1', repetitionCount: 0, intervalDays: 1, easeFactor: 2.5 },
      { id: 'c2', repetitionCount: 1, intervalDays: 1, easeFactor: 2.5 },
      { id: 'c3', repetitionCount: 2, intervalDays: 6, easeFactor: 2.5 }
    ];

    const result = await searchWorkerBridge.calculateSM2Batch(cards, 4); // Grade 4: Good
    expect(result.updated.length).toBe(3);

    // Card 1: rep 0 -> rep 1, interval 1
    expect(result.updated[0].repetitionCount).toBe(1);
    expect(result.updated[0].intervalDays).toBe(1);

    // Card 2: rep 1 -> rep 2, interval 6
    expect(result.updated[1].repetitionCount).toBe(2);
    expect(result.updated[1].intervalDays).toBe(6);

    // Card 3: rep 2 -> rep 3, interval scaled by ease factor (6 * 2.5 = 15)
    expect(result.updated[2].repetitionCount).toBe(3);
    expect(result.updated[2].intervalDays).toBe(15);
  });
});
