/**
 * Search & Background Compute Bridge
 * Bridges main React UI thread with the dedicated multi-threaded Web Worker.
 * Provides fallback to synchronous processing in non-worker environments (e.g. Bun/Node test runners).
 */
import type { Note } from '../types';

export interface SearchWorkerResult {
  resultIds: string[];
  count: number;
  elapsedMs: number;
}

export interface SM2WorkerResult {
  updated: Array<{
    id: string;
    repetitionCount: number;
    intervalDays: number;
    easeFactor: number;
    nextReviewDate: string;
  }>;
  elapsedMs: number;
}

class SearchWorkerBridge {
  private worker: Worker | null = null;
  private requestIdCounter = 0;
  private pendingRequests = new Map<number, (res: any) => void>();
  private indexedItems: Array<{
    id: string;
    title: string;
    content: string;
    tags: string[];
    folderId?: string | null;
    isFavorite?: boolean;
    attachmentTypes?: string[];
  }> = [];

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker(
          new URL('../workers/searchWorker.ts', import.meta.url),
          { type: 'module' }
        );

        this.worker.onmessage = (event: MessageEvent) => {
          const { requestId, ...data } = event.data;
          const resolver = this.pendingRequests.get(requestId);
          if (resolver) {
            this.pendingRequests.delete(requestId);
            resolver(data);
          }
        };

        this.worker.onerror = (err) => {
          console.warn('[SearchWorkerBridge] Worker error, falling back to sync execution:', err);
          this.worker = null;
        };
      } catch (err) {
        console.warn('[SearchWorkerBridge] Could not instantiate Web Worker:', err);
        this.worker = null;
      }
    }
  }

  public indexNotes(notes: Note[]): Promise<{ count: number; elapsedMs: number }> {
    const items = notes.map(n => ({
      id: n.id,
      title: n.title,
      content: n.content,
      tags: n.tags || [],
      folderId: n.folderId,
      isFavorite: n.isFavorite,
      attachmentTypes: n.attachments?.map(a => a.type) || []
    }));
    this.indexedItems = items;

    if (this.worker) {
      const requestId = ++this.requestIdCounter;
      return new Promise((resolve) => {
        this.pendingRequests.set(requestId, resolve);
        this.worker!.postMessage({
          type: 'INDEX',
          payload: { items },
          requestId
        });
      });
    }

    // Sync fallback
    return Promise.resolve({ count: items.length, elapsedMs: 0 });
  }

  public search(query: string, filter?: string): Promise<SearchWorkerResult> {
    if (this.worker) {
      const requestId = ++this.requestIdCounter;
      return new Promise((resolve) => {
        this.pendingRequests.set(requestId, (data: any) => {
          resolve({
            resultIds: data.resultIds,
            count: data.count,
            elapsedMs: data.elapsedMs
          });
        });
        this.worker!.postMessage({
          type: 'SEARCH',
          payload: { query, filter },
          requestId
        });
      });
    }

    // Main thread fallback
    const t0 = performance.now();
    const q = (query || '').toLowerCase().trim();
    let filtered = this.indexedItems;
    if (filter === 'favorite') {
      filtered = filtered.filter(item => item.isFavorite);
    } else if (filter === 'image' || filter === 'pdf' || filter === 'document' || filter === 'audio') {
      filtered = filtered.filter(item => item.attachmentTypes?.includes(filter));
    }

    let resultIds: string[];
    if (!q) {
      resultIds = filtered.map(item => item.id);
    } else {
      const tokens = q.split(/\s+/).filter(Boolean);
      resultIds = filtered
        .filter(item => {
          const t = item.title.toLowerCase();
          const c = item.content.toLowerCase();
          const tags = item.tags.map(x => x.toLowerCase()).join(' ');
          return tokens.every(tok => t.includes(tok) || c.includes(tok) || tags.includes(tok));
        })
        .map(item => item.id);
    }

    return Promise.resolve({
      resultIds,
      count: resultIds.length,
      elapsedMs: performance.now() - t0
    });
  }

  public calculateSM2Batch(
    cards: Array<{ id: string; repetitionCount: number; intervalDays: number; easeFactor: number }>,
    grade: number
  ): Promise<SM2WorkerResult> {
    if (this.worker) {
      const requestId = ++this.requestIdCounter;
      return new Promise((resolve) => {
        this.pendingRequests.set(requestId, (data: any) => {
          resolve({
            updated: data.updated,
            elapsedMs: data.elapsedMs
          });
        });
        this.worker!.postMessage({
          type: 'SM2_BATCH',
          payload: { cards, grade },
          requestId
        });
      });
    }

    // Main thread fallback
    const t0 = performance.now();
    const updated = cards.map(card => {
      let { repetitionCount, intervalDays, easeFactor } = card;
      if (grade < 3) {
        repetitionCount = 0;
        intervalDays = 1;
      } else {
        if (repetitionCount === 0) intervalDays = 1;
        else if (repetitionCount === 1) intervalDays = 6;
        else intervalDays = Math.round(intervalDays * easeFactor);
        repetitionCount += 1;
      }
      easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
      if (easeFactor < 1.3) easeFactor = 1.3;
      return {
        id: card.id,
        repetitionCount,
        intervalDays,
        easeFactor: Math.round(easeFactor * 100) / 100,
        nextReviewDate: new Date(Date.now() + intervalDays * 86400000).toISOString()
      };
    });

    return Promise.resolve({
      updated,
      elapsedMs: performance.now() - t0
    });
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.clear();
  }
}

export const searchWorkerBridge = new SearchWorkerBridge();
