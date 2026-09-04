/**
 * English Dictionary & Abbreviations Service
 * Provides local definition lookups using 'en-dictionary',
 * plus a custom user-editable dictionary and abbreviations registry with expansion tools.
 */

// Import en-dictionary
// Note: en-dictionary exports a Dictionary class or default
import Dictionary from 'en-dictionary';

export interface CustomWordDefinition {
  id: string;
  word: string;
  partOfSpeech?: string;
  definition: string;
  example?: string;
  tags?: string[];
  createdAt: string;
}

export interface AbbreviationEntry {
  id: string;
  shortForm: string; // e.g., "TL;DR", "IMO", "API", "K8s"
  fullForm: string;  // e.g., "Too Long; Didn't Read", "Application Programming Interface"
  category?: string; // e.g., "Tech", "Chat", "Acronym", "Medical"
  description?: string;
  createdAt: string;
}

export interface LookupResult {
  word: string;
  found: boolean;
  source: 'custom' | 'en-dictionary' | 'offline-lexicon' | 'not-found';
  partOfSpeech?: string;
  definitions: string[];
  examples?: string[];
  synonyms?: string[];
}

const DEFAULT_CUSTOM_WORDS: CustomWordDefinition[] = [
  {
    id: 'cw-1',
    word: 'Local-First',
    partOfSpeech: 'adjective',
    definition: 'Software architecture where data is stored and processed locally on user devices first, with seamless optional multi-master synchronization.',
    example: 'MiLEARNAPP uses a local-first vault design ensuring zero cloud vendor lock-in.',
    tags: ['Computing', 'Architecture'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'cw-2',
    word: 'Spaced Repetition',
    partOfSpeech: 'noun',
    definition: 'An evidence-based learning technique that incorporates increasing intervals of time between subsequent review of previously learned material.',
    example: 'SuperMemo-2 algorithm optimizes spaced repetition flashcards for memory consolidation.',
    tags: ['Learning', 'Cognition'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'cw-3',
    word: 'Zero-Knowledge',
    partOfSpeech: 'adjective',
    definition: 'Security property where an application or storage server has zero capability to decrypt or read user secret keys or plaintexts.',
    example: 'Notes locked with AES-256-GCM operate under strict zero-knowledge parameters.',
    tags: ['Cryptography', 'Privacy'],
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_ABBREVIATIONS: AbbreviationEntry[] = [
  { id: 'abb-1', shortForm: 'API', fullForm: 'Application Programming Interface', category: 'Tech', description: 'A set of protocols and tools for building software applications.', createdAt: new Date().toISOString() },
  { id: 'abb-2', shortForm: 'WPM', fullForm: 'Words Per Minute', category: 'Metrics', description: 'Standard measure of typing speed.', createdAt: new Date().toISOString() },
  { id: 'abb-3', shortForm: 'CPM', fullForm: 'Characters Per Minute', category: 'Metrics', description: 'Total keystroke frequency per minute.', createdAt: new Date().toISOString() },
  { id: 'abb-4', shortForm: 'K8s', fullForm: 'Kubernetes', category: 'DevOps', description: 'Open-source container orchestration system.', createdAt: new Date().toISOString() },
  { id: 'abb-5', shortForm: 'TL;DR', fullForm: "Too Long; Didn't Read", category: 'General', description: 'Summary shorthand for lengthy documentation.', createdAt: new Date().toISOString() },
  { id: 'abb-6', shortForm: 'AEAD', fullForm: 'Authenticated Encryption with Associated Data', category: 'Crypto', description: 'Form of encryption that simultaneously assures confidentiality and authenticity.', createdAt: new Date().toISOString() },
  { id: 'abb-7', shortForm: 'SM-2', fullForm: 'SuperMemo Algorithm 2', category: 'Learning', description: 'Spaced repetition calculation formula.', createdAt: new Date().toISOString() },
  { id: 'abb-8', shortForm: 'WYSIWYG', fullForm: 'What You See Is What You Get', category: 'Tech', description: 'Live preview editor interface.', createdAt: new Date().toISOString() }
];

class DictionaryService {
  private enDictInstance: any = null;
  private customWords: CustomWordDefinition[] = [];
  private abbreviations: AbbreviationEntry[] = [];

  constructor() {
    this.loadCustomData();
    this.initEnDictionary();
  }

  private loadCustomData() {
    try {
      const savedWords = localStorage.getItem('milearnapp_custom_dictionary');
      this.customWords = savedWords ? JSON.parse(savedWords) : DEFAULT_CUSTOM_WORDS;

      const savedAbbs = localStorage.getItem('milearnapp_abbreviations_list');
      this.abbreviations = savedAbbs ? JSON.parse(savedAbbs) : DEFAULT_ABBREVIATIONS;
    } catch {
      this.customWords = DEFAULT_CUSTOM_WORDS;
      this.abbreviations = DEFAULT_ABBREVIATIONS;
    }
  }

  private async initEnDictionary() {
    try {
      const DictConstructor: any = Dictionary;
      if (typeof DictConstructor === 'function') {
        try {
          this.enDictInstance = new DictConstructor();
        } catch {
          this.enDictInstance = DictConstructor;
        }
      } else {
        this.enDictInstance = DictConstructor;
      }

      if (this.enDictInstance?.init && typeof this.enDictInstance.init === 'function') {
        await this.enDictInstance.init();
      }
    } catch (e) {
      console.warn('en-dictionary initialize note:', e);
    }
  }

  // --- Lookup Engine ---
  public async lookup(rawQuery: string): Promise<LookupResult> {
    const query = rawQuery.trim();
    if (!query) {
      return { word: '', found: false, source: 'not-found', definitions: [] };
    }

    const clean = query.toLowerCase();

    // 1. Check Custom User Dictionary First
    const customMatch = this.customWords.find((w) => w.word.toLowerCase() === clean);
    if (customMatch) {
      return {
        word: customMatch.word,
        found: true,
        source: 'custom',
        partOfSpeech: customMatch.partOfSpeech,
        definitions: [customMatch.definition],
        examples: customMatch.example ? [customMatch.example] : []
      };
    }

    // 2. Check Abbreviations
    const abbMatch = this.abbreviations.find((a) => a.shortForm.toLowerCase() === clean);
    if (abbMatch) {
      return {
        word: abbMatch.shortForm,
        found: true,
        source: 'custom',
        partOfSpeech: 'abbreviation / acronym',
        definitions: [`${abbMatch.fullForm}${abbMatch.description ? ` — ${abbMatch.description}` : ''}`]
      };
    }

    // 3. Check en-dictionary (npm package)
    if (this.enDictInstance) {
      try {
        let result: any = null;
        if (typeof this.enDictInstance.lookup === 'function') {
          result = await this.enDictInstance.lookup(query);
        } else if (typeof this.enDictInstance.get === 'function') {
          result = await this.enDictInstance.get(query);
        }

        if (result) {
          const definitions: string[] = [];
          let partOfSpeech = '';

          if (typeof result === 'string') {
            definitions.push(result);
          } else if (Array.isArray(result)) {
            result.forEach((item) => {
              if (typeof item === 'string') definitions.push(item);
              else if (item?.definition) definitions.push(item.definition);
            });
          } else if (typeof result === 'object') {
            if (result.definition) definitions.push(result.definition);
            if (result.definitions) {
              const defs = Array.isArray(result.definitions) ? result.definitions : [result.definitions];
              defs.forEach((d: any) => definitions.push(typeof d === 'string' ? d : d.definition || JSON.stringify(d)));
            }
            if (result.partOfSpeech) partOfSpeech = result.partOfSpeech;
          }

          if (definitions.length > 0) {
            return {
              word: query,
              found: true,
              source: 'en-dictionary',
              partOfSpeech,
              definitions
            };
          }
        }
      } catch {}
    }

    // 4. Fallback: Word Not Found
    return {
      word: query,
      found: false,
      source: 'not-found',
      definitions: [`No built-in definition found for "${query}". You can add it directly to your custom vault dictionary!`]
    };
  }

  // --- Custom Words CRUD ---
  public getCustomWords(): CustomWordDefinition[] {
    return [...this.customWords];
  }

  public addCustomWord(wordData: Omit<CustomWordDefinition, 'id' | 'createdAt'>): CustomWordDefinition {
    const newWord: CustomWordDefinition = {
      ...wordData,
      id: `cw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    this.customWords.unshift(newWord);
    this.saveCustomWords();
    return newWord;
  }

  public updateCustomWord(id: string, updates: Partial<CustomWordDefinition>): boolean {
    const idx = this.customWords.findIndex((w) => w.id === id);
    if (idx === -1) return false;
    this.customWords[idx] = { ...this.customWords[idx], ...updates };
    this.saveCustomWords();
    return true;
  }

  public deleteCustomWord(id: string): boolean {
    this.customWords = this.customWords.filter((w) => w.id !== id);
    this.saveCustomWords();
    return true;
  }

  private saveCustomWords() {
    try {
      localStorage.setItem('milearnapp_custom_dictionary', JSON.stringify(this.customWords));
    } catch {}
  }

  // --- Abbreviations CRUD ---
  public getAbbreviations(): AbbreviationEntry[] {
    return [...this.abbreviations];
  }

  public addAbbreviation(entry: Omit<AbbreviationEntry, 'id' | 'createdAt'>): AbbreviationEntry {
    const newEntry: AbbreviationEntry = {
      ...entry,
      id: `abb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    this.abbreviations.unshift(newEntry);
    this.saveAbbreviations();
    return newEntry;
  }

  public updateAbbreviation(id: string, updates: Partial<AbbreviationEntry>): boolean {
    const idx = this.abbreviations.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    this.abbreviations[idx] = { ...this.abbreviations[idx], ...updates };
    this.saveAbbreviations();
    return true;
  }

  public deleteAbbreviation(id: string): boolean {
    this.abbreviations = this.abbreviations.filter((a) => a.id !== id);
    this.saveAbbreviations();
    return true;
  }

  private saveAbbreviations() {
    try {
      localStorage.setItem('milearnapp_abbreviations_list', JSON.stringify(this.abbreviations));
    } catch {}
  }

  // --- Smart text expander: expands abbreviations in string ---
  public expandAbbreviationsInText(text: string): { expandedText: string; replacementsCount: number } {
    let result = text;
    let count = 0;

    for (const abb of this.abbreviations) {
      const regex = new RegExp(`\\b${abb.shortForm}\\b`, 'g');
      const matches = result.match(regex);
      if (matches) {
        count += matches.length;
        result = result.replace(regex, `${abb.shortForm} (${abb.fullForm})`);
      }
    }

    return { expandedText: result, replacementsCount: count };
  }
}

export const dictionaryService = new DictionaryService();
