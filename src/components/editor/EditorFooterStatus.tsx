import React, { useMemo } from 'react';
import type { AutosaveStatus } from './hooks/useNoteAutosave';
import { Sparkles, Columns, Edit3 } from 'lucide-react';

interface EditorFooterStatusProps {
  saveStatus: AutosaveStatus;
  content: string;
  mode?: 'live' | 'split' | 'source';
  setMode?: (mode: 'live' | 'split' | 'source') => void;
}

export const EditorFooterStatus: React.FC<EditorFooterStatusProps> = ({
  saveStatus,
  content,
  mode,
  setMode
}) => {
  const { wordCount, charCount, sentenceCount, paragraphCount, readTimeMinutes } = useMemo(() => {
    const text = content.trim();
    if (!text) {
      return { wordCount: 0, charCount: 0, sentenceCount: 0, paragraphCount: 0, readTimeMinutes: 1 };
    }
    const words = text.split(/\s+/).filter(Boolean).length;
    const chars = text.length;

    // Sentences: match ending punctuation (. ! ?) followed by whitespace or end of string
    const sentenceMatches = text.match(/[^.!?]+(?:[.!?]+["']?|$)/g);
    const sentences = sentenceMatches ? sentenceMatches.filter(s => s.trim().length > 0).length : 0;

    // Paragraphs: non-empty chunks split by double newlines or block breaks
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

    const readTime = Math.max(1, Math.ceil(words / 200));
    return {
      wordCount: words,
      charCount: chars,
      sentenceCount: sentences,
      paragraphCount: Math.max(paragraphs, words > 0 ? 1 : 0),
      readTimeMinutes: readTime
    };
  }, [content]);

  return (
    <footer 
      className="editor-bottom-status-bar"
      role="status"
      aria-label="Editor Status and Document Metrics"
    >
      {/* Left: Autosave Status */}
      <div className="editor-status-left">
        <div className="floating-status-section" title={`Autosave status: ${saveStatus}`}>
          <span className={`floating-autosave-dot ${saveStatus}`} />
          <span className="floating-autosave-label">
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'unsaved' ? 'Unsaved' : 'Autosaved'}
          </span>
        </div>
      </div>

      {/* Center: Live Document Metrics (Words, Chars, Sentences, Paragraphs, Read Time) */}
      <div className="editor-status-center">
        <div className="floating-status-metrics">
          <span className="floating-badge-val" title="Word count">
            <strong>{wordCount.toLocaleString()}</strong> <span className="metric-label">words</span>
          </span>
          <span className="floating-badge-sep">·</span>
          <span className="floating-badge-val" title="Character count">
            <strong>{charCount.toLocaleString()}</strong> <span className="metric-label">chars</span>
          </span>
          <span className="floating-badge-sep hide-sm">·</span>
          <span className="floating-badge-val hide-sm" title="Sentence count">
            <strong>{sentenceCount.toLocaleString()}</strong> <span className="metric-label">sent</span>
          </span>
          <span className="floating-badge-sep hide-sm">·</span>
          <span className="floating-badge-val hide-sm" title="Paragraph count">
            <strong>{paragraphCount.toLocaleString()}</strong> <span className="metric-label">para</span>
          </span>
          <span className="floating-badge-sep">·</span>
          <span className="floating-badge-sub" title="Estimated reading time">~{readTimeMinutes}m read</span>
        </div>
      </div>

      {/* Right: Live / Split / Markdown Mode Switcher */}
      <div className="editor-status-right">
        {mode && setMode && (
          <div className="floating-mode-toggle-group" role="tablist" aria-label="Editor View Mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'live'}
              className={`floating-mode-btn ${mode === 'live' ? 'active' : ''}`}
              onClick={() => setMode('live')}
              title="Interactive Live Document (WYSIWYG)"
            >
              <Sparkles size={11} />
              <span>Live</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'split'}
              className={`floating-mode-btn ${mode === 'split' ? 'active' : ''}`}
              onClick={() => setMode('split')}
              title="Side-by-Side Split View"
            >
              <Columns size={11} />
              <span>Split</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'source'}
              className={`floating-mode-btn ${mode === 'source' ? 'active' : ''}`}
              onClick={() => setMode('source')}
              title="Raw Markdown Source Editor"
            >
              <Edit3 size={11} />
              <span>Markdown</span>
            </button>
          </div>
        )}
      </div>
    </footer>
  );
};
