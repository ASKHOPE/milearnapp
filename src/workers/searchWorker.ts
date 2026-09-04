/**
 * Dedicated Multi-Threaded Web Worker for Background Search & High-Compute Operations
 * Offloads indexing, fuzzy token matching, and batch SM-2 calculations from the main UI thread.
 */

export interface IndexedItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folderId?: string | null;
  isFavorite?: boolean;
  attachmentTypes?: string[];
}

let indexedItems: IndexedItem[] = [];

self.onmessage = (event: MessageEvent) => {
  const { type, payload, requestId } = event.data;

  switch (type) {
    case 'INDEX': {
      const startTime = performance.now();
      indexedItems = (payload.items as IndexedItem[]) || [];
      const elapsedMs = performance.now() - startTime;
      self.postMessage({
        type: 'INDEX_COMPLETE',
        requestId,
        count: indexedItems.length,
        elapsedMs
      });
      break;
    }

    case 'SEARCH': {
      const startTime = performance.now();
      const { query, filter } = payload as { query: string; filter?: string };
      const q = (query || '').toLowerCase().trim();

      let filtered = indexedItems;

      // Optional property and media filters
      if (filter === 'favorite') {
        filtered = filtered.filter(item => item.isFavorite);
      } else if (filter === 'image' || filter === 'pdf' || filter === 'document' || filter === 'audio') {
        filtered = filtered.filter(item => item.attachmentTypes?.includes(filter));
      }

      let matches: string[];
      if (!q) {
        matches = filtered.map(item => item.id);
      } else {
        const tokens = q.split(/\s+/).filter(Boolean);

        matches = filtered
          .map(item => {
            const titleLower = item.title.toLowerCase();
            const contentLower = item.content.toLowerCase();
            const tagsLower = item.tags.map(t => t.toLowerCase()).join(' ');

            let score = 0;
            // Exact title match gets huge weight
            if (titleLower.includes(q)) score += 50;
            if (titleLower.startsWith(q)) score += 30;

            // Check each token
            let allTokensFound = true;
            for (const token of tokens) {
              const inTitle = titleLower.includes(token);
              const inContent = contentLower.includes(token);
              const inTags = tagsLower.includes(token);

              if (inTitle) score += 20;
              if (inContent) score += 5;
              if (inTags) score += 15;

              if (!inTitle && !inContent && !inTags) {
                allTokensFound = false;
                break;
              }
            }

            return { id: item.id, score, matched: allTokensFound && score > 0 };
          })
          .filter(res => res.matched)
          .sort((a, b) => b.score - a.score)
          .map(res => res.id);
      }

      const elapsedMs = performance.now() - startTime;
      self.postMessage({
        type: 'SEARCH_RESULTS',
        requestId,
        resultIds: matches,
        count: matches.length,
        elapsedMs
      });
      break;
    }

    case 'SM2_BATCH': {
      const startTime = performance.now();
      const { cards, grade } = payload as {
        cards: Array<{
          id: string;
          repetitionCount: number;
          intervalDays: number;
          easeFactor: number;
        }>;
        grade: number;
      };

      const updated = cards.map(card => {
        let { repetitionCount, intervalDays, easeFactor } = card;

        if (grade < 3) {
          repetitionCount = 0;
          intervalDays = 1;
        } else {
          if (repetitionCount === 0) {
            intervalDays = 1;
          } else if (repetitionCount === 1) {
            intervalDays = 6;
          } else {
            intervalDays = Math.round(intervalDays * easeFactor);
          }
          repetitionCount += 1;
        }

        // SM-2 Ease Factor formula
        easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
        if (easeFactor < 1.3) easeFactor = 1.3;

        const nextReviewDate = new Date(Date.now() + intervalDays * 86400000).toISOString();

        return {
          id: card.id,
          repetitionCount,
          intervalDays,
          easeFactor: Math.round(easeFactor * 100) / 100,
          nextReviewDate
        };
      });

      const elapsedMs = performance.now() - startTime;
      self.postMessage({
        type: 'SM2_BATCH_RESULTS',
        requestId,
        updated,
        elapsedMs
      });
      break;
    }

    default:
      break;
  }
};
