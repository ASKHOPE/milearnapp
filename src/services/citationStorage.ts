export interface CitationAuthor {
  given?: string;
  family?: string;
  literal?: string;
}

export interface StoredCitationItem {
  id: string;
  type: string;
  title: string;
  author: CitationAuthor[];
  issued?: { 'date-parts': number[][] };
  year?: string | number;
  'container-title'?: string;
  publisher?: string;
  volume?: string;
  issue?: string;
  page?: string;
  DOI?: string;
  URL?: string;
  abstract?: string;
  rawBibtex?: string;
  dateAdded: string;
}

const STORAGE_KEY = 'milearnapp_citations_library';

export const citationStorage = {
  getCitations(): StoredCitationItem[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  },

  saveCitation(item: StoredCitationItem): void {
    try {
      const list = this.getCitations();
      const idx = list.findIndex((c) => c.id === item.id);
      if (idx >= 0) {
        list[idx] = item;
      } else {
        list.unshift(item);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
  }
};
