import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, BookOpen, List, Settings, Minus, Plus, Sun, Moon, AlignLeft, Maximize2, Minimize2 } from 'lucide-react';
import ePub from 'epubjs';
import type { Book, Rendition, Location } from 'epubjs';

interface EpubViewerModalProps {
  isOpen: boolean;
  src: string | File | ArrayBuffer;
  filename?: string;
  onClose: () => void;
}

type FontSize = 14 | 16 | 18 | 20 | 22 | 24;
type Theme = 'dark' | 'light' | 'sepia';

const THEMES: Record<Theme, Record<string, string>> = {
  dark:  { body: 'background:#0f172a !important;color:#e2e8f0 !important', p: 'color:#e2e8f0 !important', h1: 'color:#f8fafc !important', h2: 'color:#f1f5f9 !important', a: 'color:#818cf8 !important' },
  light: { body: 'background:#ffffff !important;color:#1e293b !important', p: 'color:#1e293b !important', h1: 'color:#0f172a !important', h2: 'color:#1e293b !important', a: 'color:#6366f1 !important' },
  sepia: { body: 'background:#f5efe6 !important;color:#433422 !important', p: 'color:#433422 !important', h1: 'color:#2d1f0e !important', h2: 'color:#3b2a18 !important', a: 'color:#a0522d !important' },
};

const BG_COLORS: Record<Theme, string> = {
  dark: '#0f172a',
  light: '#ffffff',
  sepia: '#f5efe6',
};

export const EpubViewerModal: React.FC<EpubViewerModalProps> = ({
  isOpen,
  src,
  filename = 'Book',
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_currentChapter, setCurrentChapter] = useState('');
  const [currentProgress, setCurrentProgress] = useState(0);
  const [fontSize, setFontSize] = useState<FontSize>(18);
  const [theme, setTheme] = useState<Theme>('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toc, setToc] = useState<Array<{ label: string; href: string; subitems?: any[] }>>([]);

  const applyTheme = useCallback((rendition: Rendition, t: Theme, fs: number) => {
    Object.entries(THEMES[t]).forEach(([selector, rules]) => {
      rendition.themes.override(selector, rules);
    });
    rendition.themes.fontSize(`${fs}px`);
  }, []);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    setIsLoading(true);
    setError(null);

    const loadBook = async () => {
      try {
        let bookSrc: string | ArrayBuffer;
        if (typeof src === 'string') {
          bookSrc = src;
        } else if (src instanceof File) {
          bookSrc = await src.arrayBuffer();
        } else {
          bookSrc = src;
        }

        if (bookRef.current) {
          bookRef.current.destroy();
          bookRef.current = null;
        }

        const book = ePub(bookSrc as string);
        bookRef.current = book;

        const rendition = book.renderTo(containerRef.current!, {
          width: '100%',
          height: '100%',
          spread: 'none',
          flow: 'paginated',
        });
        renditionRef.current = rendition;

        // Apply initial theme & font size
        applyTheme(rendition, theme, fontSize);

        await rendition.display();
        setIsLoaded(true);
        setIsLoading(false);

        // Load TOC
        const navigation = await book.loaded.navigation;
        setToc(navigation.toc as any);

        // Track location
        rendition.on('locationChanged', (loc: Location) => {
          setCurrentChapter(loc.start?.href || '');
          if (book.locations?.percentageFromCfi) {
            try {
              const pct = book.locations.percentageFromCfi(loc.start.cfi);
              setCurrentProgress(Math.round(pct * 100));
            } catch {}
          }
        });

      } catch (e: any) {
        setError('Failed to open ePub: ' + (e?.message || 'Unknown error'));
        setIsLoading(false);
      }
    };

    loadBook();

    return () => {
      bookRef.current?.destroy();
      bookRef.current = null;
      renditionRef.current = null;
    };
  }, [isOpen, src, applyTheme, theme, fontSize]);

  useEffect(() => {
    if (!renditionRef.current) return;
    applyTheme(renditionRef.current, theme, fontSize);
  }, [theme, fontSize, applyTheme]);

  const prev = useCallback(() => renditionRef.current?.prev(), []);
  const next = useCallback(() => renditionRef.current?.next(), []);
  const goTo = (href: string) => {
    renditionRef.current?.display(href);
    setIsTocOpen(false);
  };

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
    if (e.key === 'Escape') onClose();
  }, [next, prev, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, handleKey]);

  if (!isOpen) return null;

  return (
    <div className={`epub-viewer-overlay ${isFullscreen ? 'fullscreen' : ''}`} style={{ background: BG_COLORS[theme] }}>
      {/* Top Toolbar */}
      <div className="epub-toolbar" style={{ background: theme === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.95)' }}>
        <div className="epub-toolbar-left">
          <BookOpen size={16} color="var(--accent-primary)" />
          <span className="epub-book-title">{filename}</span>
          {currentProgress > 0 && <span className="epub-progress-badge">{currentProgress}%</span>}
        </div>
        <div className="epub-toolbar-right">
          <button className="epub-icon-btn" onClick={() => setIsTocOpen(t => !t)} title="Table of Contents"><List size={15} /></button>
          <button className="epub-icon-btn" onClick={() => setIsSettingsOpen(s => !s)} title="Reading Settings"><Settings size={15} /></button>
          <button className="epub-icon-btn" onClick={() => setIsFullscreen(f => !f)} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button className="epub-icon-btn danger" onClick={onClose} title="Close Reader"><X size={15} /></button>
        </div>
      </div>

      <div className="epub-body">
        {/* TOC Sidebar */}
        {isTocOpen && (
          <div className="epub-toc-panel" style={{ background: theme === 'light' ? '#f8fafc' : '#0f172a' }}>
            <div className="epub-toc-header">
              <span>Contents</span>
              <button className="epub-icon-btn" onClick={() => setIsTocOpen(false)}><X size={13} /></button>
            </div>
            <ul className="epub-toc-list">
              {toc.map((item, i) => (
                <li key={i}>
                  <button className="epub-toc-item" onClick={() => goTo(item.href)}>{item.label}</button>
                  {item.subitems?.map((sub, j) => (
                    <button key={j} className="epub-toc-item sub" onClick={() => goTo(sub.href)}>{sub.label}</button>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Render Area */}
        <div className="epub-render-area">
          <button className="epub-page-nav left" onClick={prev} title="Previous Page (←)">
            <ChevronLeft size={22} />
          </button>
          
          <div className="epub-canvas-container">
            {isLoading && (
              <div className="epub-loading">
                <div className="epub-spinner" />
                <p style={{ color: theme === 'light' ? '#64748b' : '#94a3b8' }}>Loading book…</p>
              </div>
            )}
            {error && <div className="epub-error"><p>{error}</p></div>}
            <div
              ref={containerRef}
              className="epub-container"
              style={{ visibility: isLoading || error ? 'hidden' : 'visible' }}
            />
          </div>

          <button className="epub-page-nav right" onClick={next} title="Next Page (→)">
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Settings Panel */}
        {isSettingsOpen && (
          <div className="epub-settings-panel" style={{ background: theme === 'light' ? '#f8fafc' : '#0f172a' }}>
            <div className="epub-toc-header">
              <span>Reading Settings</span>
              <button className="epub-icon-btn" onClick={() => setIsSettingsOpen(false)}><X size={13} /></button>
            </div>
            <div className="epub-setting-row">
              <span className="epub-setting-label">Theme</span>
              <div className="epub-theme-buttons">
                <button className={`epub-theme-btn dark ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')} title="Dark Theme"><Moon size={13} /></button>
                <button className={`epub-theme-btn light ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')} title="Light Theme"><Sun size={13} /></button>
                <button className={`epub-theme-btn sepia ${theme === 'sepia' ? 'active' : ''}`} onClick={() => setTheme('sepia')} title="Sepia Theme"><AlignLeft size={13} /></button>
              </div>
            </div>
            <div className="epub-setting-row">
              <span className="epub-setting-label">Font Size</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button className="epub-icon-btn" onClick={() => setFontSize(f => Math.max(14, f - 2) as FontSize)}><Minus size={13} /></button>
                <span style={{ fontSize: '13px', color: theme === 'light' ? '#1e293b' : '#e2e8f0', minWidth: '30px', textAlign: 'center' }}>{fontSize}px</span>
                <button className="epub-icon-btn" onClick={() => setFontSize(f => Math.min(24, f + 2) as FontSize)}><Plus size={13} /></button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isLoaded && (
        <div className="epub-progress-bar-track">
          <div className="epub-progress-bar-fill" style={{ width: `${currentProgress}%` }} />
        </div>
      )}
    </div>
  );
};
