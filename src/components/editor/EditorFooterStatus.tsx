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
    <div 
      className="editor-floating-status-badge"
      title={`Live document metrics · Autosave: ${saveStatus}`}
    >
      {/* Autosave Status */}
      <div className="floating-status-section">
        <span className={`floating-autosave-dot ${saveStatus}`} />
        <span className="floating-autosave-label">
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'unsaved' ? 'Unsaved' : 'Autosaved'}
        </span>
      </div>

      <span className="floating-badge-sep">|</span>

      {/* Metrics: Words, Chars, Sentences, Paragraphs, Read Time */}
      <div className="floating-status-metrics">
        <span className="floating-badge-val" title="Word count">
          <strong>{wordCount.toLocaleString()}</strong> words
        </span>
        <span className="floating-badge-sep">·</span>
        <span className="floating-badge-val" title="Character count">
          <strong>{charCount.toLocaleString()}</strong> chars
        </span>
        <span className="floating-badge-sep">·</span>
        <span className="floating-badge-val" title="Sentence count">
          <strong>{sentenceCount.toLocaleString()}</strong> sent
        </span>
        <span className="floating-badge-sep">·</span>
        <span className="floating-badge-val" title="Paragraph count">
          <strong>{paragraphCount.toLocaleString()}</strong> para
        </span>
        <span className="floating-badge-sep">·</span>
        <span className="floating-badge-sub" title="Estimated reading time">~{readTimeMinutes}m read</span>
      </div>

      {/* Live / Split / Markdown Mode Pill Switcher */}
      {mode && setMode && (
        <>
          <span className="floating-badge-sep">|</span>
          <div className="floating-mode-toggle-group">
            <button
              type="button"
              className={`floating-mode-btn ${mode === 'live' ? 'active' : ''}`}
              onClick={() => setMode('live')}
              title="Interactive Live Document (WYSIWYG)"
            >
              <Sparkles size={11} />
              <span>Live</span>
            </button>
            <button
              type="button"
              className={`floating-mode-btn ${mode === 'split' ? 'active' : ''}`}
              onClick={() => setMode('split')}
              title="Side-by-Side Split View"
            >
              <Columns size={11} />
              <span>Split</span>
            </button>
            <button
              type="button"
              className={`floating-mode-btn ${mode === 'source' ? 'active' : ''}`}
              onClick={() => setMode('source')}
              title="Raw Markdown Source Editor"
            >
              <Edit3 size={11} />
              <span>Markdown</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
