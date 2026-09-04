import React, { useMemo } from 'react';
import type { AutosaveStatus } from './hooks/useNoteAutosave';

interface EditorFooterStatusProps {
  saveStatus: AutosaveStatus;
  content: string;
}

export const EditorFooterStatus: React.FC<EditorFooterStatusProps> = ({
  saveStatus,
  content
}) => {
  const { wordCount, charCount, readTimeMinutes } = useMemo(() => {
    const text = content.trim();
    if (!text) {
      return { wordCount: 0, charCount: 0, readTimeMinutes: 1 };
    }
    const words = text.split(/\s+/).filter(Boolean).length;
    const chars = text.length;
    const readTime = Math.max(1, Math.ceil(words / 200));
    return { wordCount: words, charCount: chars, readTimeMinutes: readTime };
  }, [content]);

  return (
    <div 
      className="editor-floating-status-badge"
      title={`Live document metrics · Autosave: ${saveStatus}`}
    >
      <span className={`floating-autosave-dot ${saveStatus}`} />
      <span className="floating-autosave-label">
        {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'unsaved' ? 'Unsaved' : 'Autosave active'}
      </span>
      <span className="floating-badge-sep">·</span>
      <span className="floating-badge-val">
        <strong>{wordCount.toLocaleString()}</strong> words
      </span>
      <span className="floating-badge-sep">·</span>
      <span className="floating-badge-val">
        <strong>{charCount.toLocaleString()}</strong> chars
      </span>
      <span className="floating-badge-sep">·</span>
      <span className="floating-badge-sub">~{readTimeMinutes}m read</span>
    </div>
  );
};
