/**
 * OCR Service — Tesseract.js powered text extraction
 * Lazy-loaded worker, multi-language support (9 languages).
 * API: extractText, extractTextFromFile, extractTextFromUrl, terminateOcrWorker
 */

import { createWorker } from 'tesseract.js';

export type OcrLanguage = 'eng' | 'hin' | 'fra' | 'deu' | 'spa' | 'por' | 'chi_sim' | 'ara' | 'jpn';

export interface OcrResult {
  text: string;
  confidence: number;
}

export interface OcrProgress {
  status: string;
  progress: number;
}

export const OCR_LANGUAGES: Array<{ code: OcrLanguage; label: string; flag: string }> = [
  { code: 'eng', label: 'English', flag: '🇺🇸' },
  { code: 'hin', label: 'Hindi', flag: '🇮🇳' },
  { code: 'fra', label: 'French', flag: '🇫🇷' },
  { code: 'deu', label: 'German', flag: '🇩🇪' },
  { code: 'spa', label: 'Spanish', flag: '🇪🇸' },
  { code: 'por', label: 'Portuguese', flag: '🇧🇷' },
  { code: 'chi_sim', label: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'ara', label: 'Arabic', flag: '🇸🇦' },
  { code: 'jpn', label: 'Japanese', flag: '🇯🇵' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let workerCache: any = null;
let currentLang: OcrLanguage = 'eng';

async function getWorker(lang: OcrLanguage = 'eng') {
  if (workerCache && currentLang === lang) return workerCache;
  if (workerCache) {
    await workerCache.terminate();
    workerCache = null;
  }
  currentLang = lang;
  workerCache = await createWorker(lang, 1, { logger: () => {} });
  return workerCache;
}

export async function extractText(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  imageSource: any,
  lang: OcrLanguage = 'eng'
): Promise<OcrResult> {
  const worker = await getWorker(lang);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (worker as any).recognize(imageSource);
  return {
    text: (data.text || '').trim(),
    confidence: data.confidence || 0,
  };
}

export async function extractTextFromFile(file: File, lang: OcrLanguage = 'eng'): Promise<OcrResult> {
  if (!file.type.startsWith('image/')) throw new Error(`OCR: unsupported type "${file.type}"`);
  return extractText(file, lang);
}

export async function extractTextFromUrl(url: string, lang: OcrLanguage = 'eng'): Promise<OcrResult> {
  return extractText(url, lang);
}

export async function terminateOcrWorker(): Promise<void> {
  if (workerCache) {
    await workerCache.terminate();
    workerCache = null;
  }
}
