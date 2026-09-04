import Cite from 'citation-js';

export interface Author {
  given?: string;
  family?: string;
  literal?: string;
}

export interface CitationItem {
  id: string;
  type: string;
  title: string;
  author: Author[];
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

export const SEED_CITATIONS: CitationItem[] = [
  {
    id: 'vaswani2017',
    type: 'paper-conference',
    title: 'Attention Is All You Need',
    author: [
      { given: 'Ashish', family: 'Vaswani' },
      { given: 'Noam', family: 'Shazeer' },
      { given: 'Niki', family: 'Parmar' },
      { given: 'Jakob', family: 'Uszkoreit' },
      { given: 'Llion', family: 'Jones' },
      { given: 'Aidan N.', family: 'Gomez' },
      { given: 'Lukasz', family: 'Kaiser' },
      { given: 'Illia', family: 'Polosukhin' }
    ],
    issued: { 'date-parts': [[2017]] },
    year: 2017,
    'container-title': 'Advances in Neural Information Processing Systems (NeurIPS)',
    volume: '30',
    page: '5998-6008',
    URL: 'https://arxiv.org/abs/1706.03762',
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose the Transformer, a novel architecture based solely on attention mechanisms.',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'shannon1948',
    type: 'article-journal',
    title: 'A Mathematical Theory of Communication',
    author: [{ given: 'Claude E.', family: 'Shannon' }],
    issued: { 'date-parts': [[1948]] },
    year: 1948,
    'container-title': 'Bell System Technical Journal',
    volume: '27',
    issue: '3',
    page: '379-423',
    DOI: '10.1002/j.1538-7305.1948.tb01338.x',
    abstract: 'The fundamental problem of communication is that of reproducing at one point either exactly or approximately a message selected at another point.',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'turing1936',
    type: 'article-journal',
    title: 'On Computable Numbers, with an Application to the Entscheidungsproblem',
    author: [{ given: 'Alan M.', family: 'Turing' }],
    issued: { 'date-parts': [[1936]] },
    year: 1936,
    'container-title': 'Proceedings of the London Mathematical Society',
    volume: '42',
    issue: '1',
    page: '230-265',
    DOI: '10.1112/plms/s2-42.1.230',
    abstract: 'The computable numbers may be described briefly as the real numbers whose expressions as a decimal are calculable by finite means.',
    dateAdded: new Date().toISOString()
  }
];

class CitationService {
  public getCitations(): CitationItem[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}

    // Initialize with seed citations
    this.saveAllCitations(SEED_CITATIONS);
    return SEED_CITATIONS;
  }

  public saveCitation(item: CitationItem): void {
    const list = this.getCitations();
    const existingIndex = list.findIndex((c) => c.id === item.id);
    if (existingIndex >= 0) {
      list[existingIndex] = item;
    } else {
      list.unshift(item);
    }
    this.saveAllCitations(list);
  }

  public deleteCitation(id: string): void {
    const list = this.getCitations().filter((c) => c.id !== id);
    this.saveAllCitations(list);
  }

  public saveAllCitations(items: CitationItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }

  /**
   * Parse raw BibTeX string or DOI into CitationItem list using Citation.js
   */
  public parseInput(input: string): CitationItem[] {
    try {
      const cite = new Cite(input.trim());
      const dataList = cite.get();

      return dataList.map((data: any) => {
        const authors: Author[] = (data.author || []).map((a: any) => ({
          given: a.given || '',
          family: a.family || '',
          literal: a.literal || `${a.given || ''} ${a.family || ''}`.trim()
        }));

        let year: number | undefined;
        if (data.issued?.['date-parts']?.[0]?.[0]) {
          year = data.issued['date-parts'][0][0];
        } else if (data.issued?.raw) {
          const match = data.issued.raw.match(/\b(19|20)\d{2}\b/);
          if (match) year = parseInt(match[0], 10);
        }

        return {
          id: data.id || `cite-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: data.type || 'article-journal',
          title: data.title || 'Untitled Reference',
          author: authors.length > 0 ? authors : [{ literal: 'Anonymous' }],
          issued: year ? { 'date-parts': [[year]] } : undefined,
          year: year || undefined,
          'container-title': data['container-title'] || data.journal || data.booktitle || undefined,
          publisher: data.publisher || undefined,
          volume: data.volume ? String(data.volume) : undefined,
          issue: data.issue ? String(data.issue) : undefined,
          page: data.page ? String(data.page) : undefined,
          DOI: data.DOI || undefined,
          URL: data.URL || undefined,
          abstract: data.abstract || undefined,
          dateAdded: new Date().toISOString()
        };
      });
    } catch (err: any) {
      console.error('Error parsing citation with Citation.js:', err);
      throw new Error(`Failed to parse citation: ${err.message || 'Invalid format'}`);
    }
  }

  /**
   * Format references list in selected academic style
   */
  public formatBibliography(items: CitationItem[], style: 'apa' | 'vancouver' = 'apa'): string {
    if (items.length === 0) return '';
    try {
      const cslData = items.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        author: item.author.map((a) => ({
          given: a.given,
          family: a.family,
          literal: a.literal
        })),
        issued: item.issued || (item.year ? { 'date-parts': [[Number(item.year)]] } : undefined),
        'container-title': item['container-title'],
        publisher: item.publisher,
        volume: item.volume,
        issue: item.issue,
        page: item.page,
        DOI: item.DOI,
        URL: item.URL
      }));

      const cite = new Cite(cslData);
      return cite.format('bibliography', {
        format: 'text',
        template: style === 'vancouver' ? 'vancouver' : 'apa'
      });
    } catch (err: any) {
      console.error('Error formatting bibliography:', err);
      // Fallback manual formatting
      return items.map((item, idx) => {
        const authors = item.author.map(a => a.family ? `${a.family}, ${a.given?.[0] || ''}.` : (a.literal || 'Anon')).join(', ');
        const yr = item.year ? `(${item.year}).` : '(n.d.).';
        const source = item['container-title'] ? `*${item['container-title']}*` : '';
        return `${style === 'vancouver' ? `${idx + 1}. ` : ''}${authors} ${yr} ${item.title}. ${source}`.trim();
      }).join('\n\n');
    }
  }

  /**
   * Format in-text citation e.g. (Einstein, 1905) or (Vaswani et al., 2017)
   */
  public formatInText(item: CitationItem, style: 'apa' | 'vancouver' = 'apa', index = 1): string {
    if (style === 'vancouver') {
      return `[${index}]`;
    }

    try {
      const cite = new Cite({
        id: item.id,
        type: item.type,
        title: item.title,
        author: item.author,
        issued: item.issued || (item.year ? { 'date-parts': [[Number(item.year)]] } : undefined)
      });
      const inText = cite.format('citation', { template: 'apa' });
      return inText.trim();
    } catch {
      // Fallback
      const firstAuthor = item.author[0];
      const name = firstAuthor?.family || firstAuthor?.literal || 'Author';
      const etAl = item.author.length > 2 ? ' et al.' : item.author.length === 2 && item.author[1]?.family ? ` & ${item.author[1].family}` : '';
      return `(${name}${etAl}, ${item.year || 'n.d.'})`;
    }
  }

  /**
   * Export references as standard BibTeX format
   */
  public exportToBibTeX(items: CitationItem[]): string {
    if (items.length === 0) return '';
    try {
      const cite = new Cite(items);
      return cite.format('bibtex');
    } catch {
      // Fallback
      return items.map((item) => {
        const key = item.id.replace(/[^a-zA-Z0-9]/g, '');
        const authors = item.author.map(a => a.family ? `${a.family}, ${a.given || ''}` : (a.literal || 'Anon')).join(' and ');
        return `@article{${key},\n  author = {${authors}},\n  title = {${item.title}},\n  year = {${item.year || ''}},\n  journal = {${item['container-title'] || ''}}\n}`;
      }).join('\n\n');
    }
  }
}

export const citationService = new CitationService();
