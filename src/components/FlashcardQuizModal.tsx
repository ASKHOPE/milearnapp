import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  X, 
  RotateCw, 
  Award, 
  Flame,
  BookOpen
} from 'lucide-react';
import type { Note } from '../types';
import { triggerConfetti } from '../services/animations';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  sourceNoteTitle: string;
}

interface FlashcardQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNote: Note | null;
  allNotes: Note[];
}

export const FlashcardQuizModal: React.FC<FlashcardQuizModalProps> = ({
  isOpen,
  onClose,
  currentNote,
  allNotes
}) => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [scope, setScope] = useState<'current' | 'all'>('current');

  // Extract flashcards from notes
  useEffect(() => {
    if (!isOpen) return;

    const sourceNotes = scope === 'current' && currentNote ? [currentNote] : allNotes;
    const extracted: Flashcard[] = [];

    sourceNotes.forEach((n) => {
      const content = n.content || '';
      
      // Pattern 1: Q: ... \n A: ...
      const qaRegex = /(?:^|\n)[Qq](?:uestion)?:\s*([^\n]+)\s*\n[Aa](?:nswer)?:\s*([^\n]+)/g;
      for (const match of content.matchAll(qaRegex)) {
        if (match[1] && match[2]) {
          extracted.push({
            id: `qa-${n.id}-${extracted.length}`,
            front: match[1].trim(),
            back: match[2].trim(),
            sourceNoteTitle: n.title || 'Untitled'
          });
        }
      }

      // Pattern 2: Front ?? Back
      const doubleQuestionRegex = /(?:^|\n)([^\n?]+)\s*\?\?\s*([^\n]+)/g;
      for (const match of content.matchAll(doubleQuestionRegex)) {
        if (match[1] && match[2] && !match[1].startsWith('#')) {
          extracted.push({
            id: `dq-${n.id}-${extracted.length}`,
            front: match[1].trim(),
            back: match[2].trim(),
            sourceNoteTitle: n.title || 'Untitled'
          });
        }
      }

      // Pattern 3: Callout > [!QUESTION] ... > [!ANSWER]
      const calloutRegex = />\s*\[!QUESTION\]\s*([^\n]+)[\s\S]*?>\s*\[!ANSWER\]\s*([^\n]+)/g;
      for (const match of content.matchAll(calloutRegex)) {
        if (match[1] && match[2]) {
          extracted.push({
            id: `callout-${n.id}-${extracted.length}`,
            front: match[1].trim(),
            back: match[2].trim(),
            sourceNoteTitle: n.title || 'Untitled'
          });
        }
      }
    });

    // Fallback card if note has no Q&A syntax yet
    if (extracted.length === 0 && currentNote) {
      extracted.push({
        id: 'sample-1',
        front: `What is the core concept of "${currentNote.title || 'this note'}"?`,
        back: currentNote.content.slice(0, 180).replace(/[#*`_]/g, '').trim() || 'Add notes using Q: Question / A: Answer syntax to auto-generate active recall cards.',
        sourceNoteTitle: currentNote.title || 'Untitled'
      });
    }

    setCards(extracted);
    setCurrentIndex(0);
    setIsFlipped(false);
    setScore(0);
    setStreak(0);
    setIsCompleted(false);
  }, [isOpen, scope, currentNote, allNotes]);

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleRate = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (rating === 'good' || rating === 'easy') {
      setScore((s) => s + 1);
      setStreak((st) => st + 1);
    } else {
      setStreak(0);
    }

    if (currentIndex + 1 < cards.length) {
      setIsFlipped(false);
      setCurrentIndex((idx) => idx + 1);
    } else {
      setIsCompleted(true);
      triggerConfetti();
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setScore(0);
    setStreak(0);
    setIsCompleted(false);
  };

  if (!isOpen) return null;

  const currentCard = cards[currentIndex];
  const progressPercent = cards.length > 0 ? Math.round(((currentIndex + 1) / cards.length) * 100) : 0;

  return (
    <div className="modal-overlay visual-studio-overlay" onClick={onClose}>
      <div 
        className="modal-container flashcard-quiz-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '90vw', maxWidth: '640px', minHeight: '520px' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="studio-header-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
              <GraduationCap size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Active Recall Flashcards</h3>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                Spaced Repetition • {cards.length} cards detected • Click card or press Space to flip
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Scope Toggle */}
            <div className="quiz-scope-toggle">
              <button
                type="button"
                className={`scope-pill ${scope === 'current' ? 'active' : ''}`}
                onClick={() => setScope('current')}
              >
                This Note
              </button>
              <button
                type="button"
                className={`scope-pill ${scope === 'all' ? 'active' : ''}`}
                onClick={() => setScope('all')}
              >
                All Notes
              </button>
            </div>

            <button type="button" className="editor-icon-btn" onClick={onClose} title="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '20px' }}>
          {!isCompleted && currentCard ? (
            <>
              {/* Progress & Stats Bar */}
              <div className="quiz-progress-row">
                <span className="quiz-progress-text">Card {currentIndex + 1} of {cards.length}</span>
                <div className="quiz-streak-badge">
                  <Flame size={13} color="#f59e0b" />
                  <span>{streak} Streak</span>
                </div>
              </div>
              <div className="quiz-progress-bar-track">
                <div className="quiz-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
              </div>

              {/* 3D Flip Card Container */}
              <div 
                className={`flashcard-3d-card ${isFlipped ? 'flipped' : ''}`}
                onClick={handleFlip}
                title="Click to flip card"
              >
                <div className="flashcard-face flashcard-front">
                  <div className="flashcard-badge">Question</div>
                  <div className="flashcard-text">{currentCard.front}</div>
                  <div className="flashcard-hint">
                    <RotateCw size={12} />
                    <span>Click to reveal answer</span>
                  </div>
                </div>

                <div className="flashcard-face flashcard-back">
                  <div className="flashcard-badge success">Answer</div>
                  <div className="flashcard-text">{currentCard.back}</div>
                  <div className="flashcard-source">
                    <BookOpen size={11} />
                    <span>From: {currentCard.sourceNoteTitle}</span>
                  </div>
                </div>
              </div>

              {/* Rating Controls (SuperMemo-2 Intervals) */}
              {isFlipped ? (
                <div className="flashcard-rate-row">
                  <button type="button" className="btn-rate again" onClick={() => handleRate('again')}>
                    <strong>Again</strong>
                    <span>&lt; 1 min</span>
                  </button>
                  <button type="button" className="btn-rate hard" onClick={() => handleRate('hard')}>
                    <strong>Hard</strong>
                    <span>12 hours</span>
                  </button>
                  <button type="button" className="btn-rate good" onClick={() => handleRate('good')}>
                    <strong>Good</strong>
                    <span>1 day</span>
                  </button>
                  <button type="button" className="btn-rate easy" onClick={() => handleRate('easy')}>
                    <strong>Easy</strong>
                    <span>4 days</span>
                  </button>
                </div>
              ) : (
                <div className="flashcard-flip-action">
                  <button type="button" className="btn-reveal-answer" onClick={handleFlip}>
                    <RotateCw size={14} />
                    <span>Reveal Answer</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Completed Deck Summary */
            <div className="quiz-completed-view">
              <div className="quiz-trophy-circle">
                <Award size={48} color="#f59e0b" />
              </div>
              <h3>Session Complete!</h3>
              <p>You reviewed {cards.length} active recall flashcards.</p>

              <div className="quiz-summary-stats">
                <div className="summary-stat-box">
                  <strong>{score}</strong>
                  <span>Mastered</span>
                </div>
                <div className="summary-stat-box">
                  <strong>{Math.round((score / Math.max(1, cards.length)) * 100)}%</strong>
                  <span>Accuracy</span>
                </div>
                <div className="summary-stat-box">
                  <strong>{streak}</strong>
                  <span>Final Streak</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" onClick={handleRestart}>
                  <RotateCw size={14} />
                  <span>Review Again</span>
                </button>
                <button type="button" className="btn-primary" onClick={onClose}>
                  <span>Done</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
