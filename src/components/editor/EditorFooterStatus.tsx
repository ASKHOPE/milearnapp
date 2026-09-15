import React, { useMemo, useState } from 'react';
import type { AutosaveStatus } from './hooks/useNoteAutosave';
import type { Note, Book, UserProfile, Attachment } from '../../types';
import { Sparkles, Columns, Edit3, ChevronLeft, ChevronRight, BookOpen, Plus, User, Paperclip } from 'lucide-react';
import { AttachmentManager } from '../AttachmentManager';

interface EditorFooterStatusProps {
  saveStatus: AutosaveStatus;
  content: string;
  mode?: 'live' | 'split' | 'source';
  setMode?: (mode: 'live' | 'split' | 'source') => void;
  currentNote?: Note;
  book?: Book;
  allBookPages?: Note[];
  onSelectPage?: (noteId: string) => void;
  onAddPageToBook?: (bookId: string) => void;
  onManualSave?: () => void;
  userProfile?: UserProfile;
  onOpenProfile?: () => void;
  attachments?: Attachment[];
  onAddAttachment?: (attachment: Attachment) => void;
  onDeleteAttachment?: (attachmentId: string) => void;
}

export const EditorFooterStatus: React.FC<EditorFooterStatusProps> = ({
  saveStatus,
  content,
  mode,
  setMode,
  currentNote,
  book,
  allBookPages,
  onSelectPage,
  onAddPageToBook,
  onManualSave,
  userProfile,
  onOpenProfile,
  attachments = [],
  onAddAttachment,
  onDeleteAttachment
}) => {
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);
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

  // Sort pages for book navigation
  const sortedPages = useMemo(() => {
    if (!allBookPages || allBookPages.length === 0) return [];
    return [...allBookPages].sort((a, b) => (a.pageOrder || 0) - (b.pageOrder || 0));
  }, [allBookPages]);

  const currentIndex = useMemo(() => {
    if (!currentNote || sortedPages.length === 0) return -1;
    return sortedPages.findIndex((p) => p.id === currentNote.id);
  }, [currentNote, sortedPages]);

  const prevPage = currentIndex > 0 ? sortedPages[currentIndex - 1] : null;
  const nextPage = currentIndex >= 0 && currentIndex < sortedPages.length - 1 ? sortedPages[currentIndex + 1] : null;

  const hasBook = !!(book && sortedPages.length > 0);

  return (
    <footer 
      className={`editor-bottom-status-bar ${hasBook ? 'has-book-nav' : ''}`}
      role="status"
      aria-label="Editor Status and Document Metrics"
    >
      {/* Left: User Profile & Autosave Status */}
      <div className="editor-status-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {userProfile && (
          <button
            type="button"
            className="footer-profile-chip"
            onClick={onOpenProfile}
            title={`Profile: ${userProfile.name || 'User'} · Click to view profile settings`}
          >
            <span className="footer-avatar">
              {userProfile.avatarType === 'image' || userProfile.avatarType === 'gif' ? (
                <img src={userProfile.avatarValue} alt="Avatar" className="footer-avatar-img" />
              ) : userProfile.avatarValue ? (
                <span>{userProfile.avatarValue}</span>
              ) : (
                <User size={11} />
              )}
            </span>
            <span className="footer-profile-name">{userProfile.name || 'Alex Mercer'}</span>
          </button>
        )}

        <button
          type="button"
          className="floating-status-section"
          onClick={onManualSave}
          disabled={saveStatus === 'saving'}
          title={saveStatus === 'unsaved' ? 'Unsaved changes · Click to save (Cmd+S)' : `Autosave status: ${saveStatus}`}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: onManualSave ? 'pointer' : 'default',
            font: 'inherit',
            color: 'inherit'
          }}
        >
          <span className={`floating-autosave-dot ${saveStatus}`} />
          <span className="floating-autosave-label">
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'unsaved' ? 'Save Now' : 'Autosaved'}
          </span>
        </button>

        {/* Footer Attachments & Media Popover Button */}
        {onAddAttachment && onDeleteAttachment && (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={`footer-attachment-chip ${attachments.length > 0 ? 'has-items' : ''}`}
              onClick={() => setIsAttachmentsOpen(!isAttachmentsOpen)}
              title="View and Manage Attachments & Media"
            >
              <Paperclip size={11} />
              <span>Attachments ({attachments.length})</span>
            </button>

            {isAttachmentsOpen && (
              <>
                <div 
                  className="dropdown-backdrop" 
                  onClick={(e) => { e.stopPropagation(); setIsAttachmentsOpen(false); }} 
                />
                <div 
                  className="footer-attachment-popover-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="footer-attachment-header">
                    <span>📎 Attachments & Media ({attachments.length})</span>
                    <button 
                      type="button" 
                      className="footer-popover-close-btn"
                      onClick={() => setIsAttachmentsOpen(false)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="footer-attachment-body">
                    <AttachmentManager
                      attachments={attachments}
                      onAddAttachment={onAddAttachment}
                      onDeleteAttachment={onDeleteAttachment}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Center: Book / Chapter Page Navigator OR Document Metrics */}
      {hasBook && book ? (
        <div className="footer-book-nav-container">
          {/* Previous Page Button */}
          <button
            type="button"
            className="footer-book-btn prev"
            disabled={!prevPage}
            onClick={() => prevPage && onSelectPage && onSelectPage(prevPage.id)}
            title={prevPage ? `Go to previous page: ${prevPage.title}` : 'First page'}
          >
            <ChevronLeft size={13} className="footer-book-arrow" />
            <div className="footer-book-btn-text">
              <span className="footer-book-label">PREVIOUS</span>
              <span className="footer-book-title">{prevPage ? prevPage.title : 'None'}</span>
            </div>
          </button>

          {/* Book Center Badge */}
          <div className="footer-book-pill" style={{ borderColor: book.color || 'var(--accent-primary)' }}>
            <BookOpen size={13} color={book.color || 'var(--accent-primary)'} />
            <span className="footer-book-name">{book.title}</span>
            <span className="footer-book-counter">
              Page {currentIndex !== -1 ? currentIndex + 1 : 1} of {sortedPages.length}
            </span>
          </div>

          {/* Add Page Button */}
          {onAddPageToBook && (
            <button
              type="button"
              className="footer-book-add-btn"
              onClick={() => onAddPageToBook(book.id)}
              title="Add a new chapter / page to this book"
            >
              <Plus size={12} />
              <span>New Page</span>
            </button>
          )}

          {/* Next Page Button */}
          <button
            type="button"
            className="footer-book-btn next"
            disabled={!nextPage}
            onClick={() => nextPage && onSelectPage && onSelectPage(nextPage.id)}
            title={nextPage ? `Go to next page: ${nextPage.title}` : 'Last page'}
          >
            <div className="footer-book-btn-text" style={{ textAlign: 'right' }}>
              <span className="footer-book-label">NEXT</span>
              <span className="footer-book-title">{nextPage ? nextPage.title : 'End of Book'}</span>
            </div>
            <ChevronRight size={13} className="footer-book-arrow" />
          </button>
        </div>
      ) : (
        <div className="editor-status-center">
          <div className="floating-status-metrics">
            <span className="floating-badge-val" title="Word count">
              <strong>{wordCount.toLocaleString()}</strong> <span className="metric-label">words</span>
            </span>
            <span className="floating-badge-sep">·</span>
            <span className="floating-badge-val" title="Character count">
              <strong>{charCount.toLocaleString()}</strong> <span className="metric-label">chars</span>
            </span>
            <span className="floating-badge-sep">·</span>
            <span className="floating-badge-val" title="Sentence count">
              <strong>{sentenceCount.toLocaleString()}</strong> <span className="metric-label">sentences</span>
            </span>
            <span className="floating-badge-sep">·</span>
            <span className="floating-badge-val" title="Paragraph count">
              <strong>{paragraphCount.toLocaleString()}</strong> <span className="metric-label">paragraphs</span>
            </span>
            <span className="floating-badge-sep">·</span>
            <span className="floating-badge-sub" title="Estimated reading time">~{readTimeMinutes}m read</span>
          </div>
        </div>
      )}

      {/* Right: Metrics (when book active) & View Mode Switcher */}
      <div className="editor-status-right">
        {hasBook && (
          <div className="floating-status-metrics" style={{ marginRight: '8px' }}>
            <span className="floating-badge-val">
              <strong>{wordCount.toLocaleString()}</strong> <span className="metric-label">words</span>
            </span>
            <span className="floating-badge-sep">·</span>
            <span className="floating-badge-val">
              <strong>{paragraphCount.toLocaleString()}</strong> <span className="metric-label">paras</span>
            </span>
            <span className="floating-badge-sep">·</span>
            <span className="floating-badge-sub">~{readTimeMinutes}m read</span>
          </div>
        )}

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
