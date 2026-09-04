import React, { useState, useEffect } from 'react';
import { 
  Presentation, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2
} from 'lucide-react';
import type { Note } from '../types';

interface SlideDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
}

export const SlideDeckModal: React.FC<SlideDeckModalProps> = ({
  isOpen,
  onClose,
  note
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Split content by horizontal rules into slides
  const slides = React.useMemo(() => {
    if (!note || !note.content) return ['# Untitled Presentation\n\nNo content yet.'];
    const parts = note.content.split(/\n\s*(?:---|\*\*\*|___)\s*\n/g);
    return parts.map((p) => p.trim()).filter((p) => p.length > 0);
  }, [note]);

  useEffect(() => {
    setCurrentSlideIndex(0);
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        setCurrentSlideIndex((idx) => Math.min(slides.length - 1, idx + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault();
        setCurrentSlideIndex((idx) => Math.max(0, idx - 1));
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, slides.length, isFullscreen, onClose]);

  if (!isOpen || !note) return null;

  const currentSlideMarkdown = slides[currentSlideIndex] || '';

  return (
    <div className={`modal-overlay visual-studio-overlay ${isFullscreen ? 'fullscreen-mode' : ''}`} onClick={onClose}>
      <div 
        className={`modal-container slide-deck-modal ${isFullscreen ? 'fullscreen' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: isFullscreen ? '100vw' : '92vw',
          height: isFullscreen ? '100vh' : '88vh',
          maxWidth: isFullscreen ? 'none' : '1100px',
          borderRadius: isFullscreen ? '0' : '16px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top bar with progress indicator */}
        <div className="slide-deck-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Presentation size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{note.title || 'Slide Deck'}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ({currentSlideIndex + 1} / {slides.length})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="editor-icon-btn"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Presentation'}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
            <button type="button" className="editor-icon-btn" onClick={onClose} title="Close Presentation">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Slide Progress Bar */}
        <div className="quiz-progress-bar-track" style={{ height: '3px', borderRadius: 0 }}>
          <div 
            className="quiz-progress-bar-fill" 
            style={{ width: `${((currentSlideIndex + 1) / slides.length) * 100}%`, height: '100%' }} 
          />
        </div>

        {/* Slide Body */}
        <div className="slide-deck-stage">
          <div className="slide-content-sheet">
            {/* Simple Markdown Render for Slide Content */}
            <div className="slide-markdown-body">
              {currentSlideMarkdown.split('\n').map((line, lIdx) => {
                if (line.startsWith('# ')) {
                  return <h1 key={lIdx} className="slide-h1">{line.replace('# ', '')}</h1>;
                }
                if (line.startsWith('## ')) {
                  return <h2 key={lIdx} className="slide-h2">{line.replace('## ', '')}</h2>;
                }
                if (line.startsWith('### ')) {
                  return <h3 key={lIdx} className="slide-h3">{line.replace('### ', '')}</h3>;
                }
                if (line.startsWith('- ') || line.startsWith('* ')) {
                  return (
                    <li key={lIdx} className="slide-list-item">
                      {line.replace(/^[-*]\s+/, '')}
                    </li>
                  );
                }
                if (line.startsWith('> ')) {
                  return (
                    <blockquote key={lIdx} className="slide-quote">
                      {line.replace(/^>\s+/, '')}
                    </blockquote>
                  );
                }
                if (!line.trim()) {
                  return <div key={lIdx} style={{ height: '12px' }} />;
                }
                return <p key={lIdx} className="slide-p">{line}</p>;
              })}
            </div>
          </div>
        </div>

        {/* Presentation Controls Footer */}
        <div className="slide-deck-footer">
          <div className="slide-instruction-hint">
            <span>Use Left/Right arrows or Spacebar to navigate • Esc to exit</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn-slide-nav"
              disabled={currentSlideIndex === 0}
              onClick={() => setCurrentSlideIndex((idx) => Math.max(0, idx - 1))}
              title="Previous Slide (Left Arrow)"
            >
              <ChevronLeft size={16} />
              <span>Prev</span>
            </button>

            <span style={{ fontSize: '13px', fontWeight: 600, minWidth: '60px', textAlign: 'center' }}>
              {currentSlideIndex + 1} / {slides.length}
            </span>

            <button
              type="button"
              className="btn-slide-nav"
              disabled={currentSlideIndex === slides.length - 1}
              onClick={() => setCurrentSlideIndex((idx) => Math.min(slides.length - 1, idx + 1))}
              title="Next Slide (Right Arrow or Space)"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
