import React, { useState, useEffect } from 'react';
import type { Note, Flashcard } from '../types';
import { flashcardService } from '../services/flashcards';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { 
  GraduationCap, 
  RotateCw, 
  Sparkles, 
  Layers, 
  Clock, 
  Flame, 
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface StudyModeModalProps {
  isOpen: boolean;
  notes: Note[];
  currentNote: Note | null;
  onClose: () => void;
}

export const StudyModeModal: React.FC<StudyModeModalProps> = ({
  isOpen,
  notes,
  currentNote,
  onClose
}) => {
  const [deckFilter, setDeckFilter] = useState<'current' | 'due' | 'all'>('due');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionGrades, setSessionGrades] = useState<number[]>([]);

  // Sync and load cards on open
  useEffect(() => {
    if (!isOpen) return;

    const allCards = flashcardService.syncCardsForNotes(notes);
    let filtered: Flashcard[] = [];

    if (deckFilter === 'current' && currentNote) {
      filtered = allCards.filter((c) => c.noteId === currentNote.id);
    } else if (deckFilter === 'due') {
      filtered = flashcardService.getDueCards(allCards);
    } else {
      filtered = allCards;
    }

    setCards(filtered);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
    setReviewedCount(0);
    setSessionGrades([]);
  }, [isOpen, deckFilter, notes, currentNote]);

  const activeCard = cards[currentIndex];

  const handleRate = React.useCallback((grade: 1 | 2 | 3 | 4) => {
    if (!activeCard) return;

    const updated = flashcardService.scheduleCard(activeCard, grade);
    const updatedCards = [...cards];
    updatedCards[currentIndex] = updated;

    // Save update in service
    const all = flashcardService.getFlashcards();
    const idx = all.findIndex((c) => c.id === updated.id);
    if (idx >= 0) {
      all[idx] = updated;
      flashcardService.saveFlashcards(all);
    }

    setReviewedCount((prev) => prev + 1);
    setSessionGrades((prev) => [...prev, grade]);

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setSessionCompleted(true);
    }
  }, [activeCard, cards, currentIndex]);

  // Keyboard controls: Space to flip, 1-4 to grade
  useEffect(() => {
    if (!isOpen || sessionCompleted || cards.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if target is an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleRate(1);
        if (e.key === '2') handleRate(2);
        if (e.key === '3') handleRate(3);
        if (e.key === '4') handleRate(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFlipped, cards.length, sessionCompleted, handleRate]);

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
    setReviewedCount(0);
    setSessionGrades([]);
  };

  const accuracy = sessionGrades.length > 0
    ? Math.round((sessionGrades.filter((g) => g >= 3).length / sessionGrades.length) * 100)
    : 100;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Study Mode & Spaced Repetition"
      subtitle="Active recall system powered by SuperMemo-2 (SM-2)"
      icon={<GraduationCap size={20} color="var(--color-primary)" />}
      maxWidth={680}
    >
      {/* Deck Selector Tabs */}
      <div className="study-deck-bar">
        <div className="study-deck-filters">
          <button
            className={`study-filter-btn ${deckFilter === 'due' ? 'active' : ''}`}
            onClick={() => setDeckFilter('due')}
          >
            <Clock size={14} />
            <span>Due for Review</span>
          </button>
          {currentNote && (
            <button
              className={`study-filter-btn ${deckFilter === 'current' ? 'active' : ''}`}
              onClick={() => setDeckFilter('current')}
            >
              <BookOpen size={14} />
              <span>This Note</span>
            </button>
          )}
          <button
            className={`study-filter-btn ${deckFilter === 'all' ? 'active' : ''}`}
            onClick={() => setDeckFilter('all')}
          >
            <Layers size={14} />
            <span>All Cards ({cards.length})</span>
          </button>
        </div>

        {cards.length > 0 && !sessionCompleted && (
          <div className="study-counter-chip">
            <span>Card {currentIndex + 1} of {cards.length}</span>
          </div>
        )}
      </div>

      {/* Empty State */}
      {cards.length === 0 ? (
        <div className="study-empty-state">
          <Sparkles size={36} color="var(--color-primary)" />
          <h4>No flashcards found in this deck</h4>
          <p>
            Add items to your notes using any of these simple formats:
          </p>
          <div className="study-syntax-tips">
            <code>Q: What is React? / A: A UI library</code>
            <code>Front: Mitosis / Back: Cell division</code>
            <code>Photosynthesis :: Process plants use to convert light</code>
            <code>==Hidden Cloze Term==</code>
          </div>
        </div>
      ) : sessionCompleted ? (
        /* Completed Summary View */
        <div className="study-summary-view">
          <div className="study-summary-badge">
            <Flame size={40} color="var(--color-warning)" />
          </div>
          <h3>Session Complete! Great Focus!</h3>
          <p className="study-summary-sub">
            You reviewed <strong>{reviewedCount}</strong> card{reviewedCount !== 1 ? 's' : ''} with <strong>{accuracy}%</strong> retention.
          </p>

          <div className="study-stats-grid">
            <div className="study-stat-card">
              <span className="stat-label">Cards Reviewed</span>
              <span className="stat-value">{reviewedCount}</span>
            </div>
            <div className="study-stat-card">
              <span className="stat-label">Retention Rate</span>
              <span className="stat-value" style={{ color: 'var(--color-success)' }}>{accuracy}%</span>
            </div>
            <div className="study-stat-card">
              <span className="stat-label">Mastery Interval</span>
              <span className="stat-value">SM-2</span>
            </div>
          </div>

          <div className="study-summary-actions">
            <Button variant="secondary" onClick={handleRestart} leftIcon={<RotateCw size={15} />}>
              Review Again
            </Button>
            <Button variant="primary" onClick={onClose} rightIcon={<ArrowRight size={15} />}>
              Back to Notes
            </Button>
          </div>
        </div>
      ) : (
        /* Active 3D Flashcard Presentation */
        <div className="study-active-arena">
          <div 
            className={`study-flashcard-3d ${isFlipped ? 'flipped' : ''}`}
            onClick={() => setIsFlipped(!isFlipped)}
            title="Click or press Space to flip"
          >
            <div className="study-card-face study-card-front">
              <div className="card-face-header">
                <Badge variant="primary">{activeCard.type.toUpperCase()}</Badge>
                <span className="card-source-title">{activeCard.noteTitle}</span>
              </div>
              <div className="card-face-content">
                <p className="card-question-text">{activeCard.question}</p>
              </div>
              <div className="card-face-footer">
                <span className="flip-hint">Space / Click to reveal answer</span>
              </div>
            </div>

            <div className="study-card-face study-card-back">
              <div className="card-face-header">
                <Badge variant="success">ANSWER</Badge>
                <span className="card-source-title">{activeCard.noteTitle}</span>
              </div>
              <div className="card-face-content">
                <p className="card-answer-text">{activeCard.answer}</p>
              </div>
              <div className="card-face-footer">
                <span className="flip-hint">Rate recall difficulty below</span>
              </div>
            </div>
          </div>

          {/* Rating Buttons (Revealed when card is flipped) */}
          <div className="study-rating-strip">
            {isFlipped ? (
              <div className="study-grades-container">
                <button 
                  className="study-grade-btn grade-again"
                  onClick={() => handleRate(1)}
                  title="Press 1"
                >
                  <span className="grade-key">1</span>
                  <span className="grade-label">Again</span>
                  <span className="grade-sub">&lt; 1 day</span>
                </button>
                <button 
                  className="study-grade-btn grade-hard"
                  onClick={() => handleRate(2)}
                  title="Press 2"
                >
                  <span className="grade-key">2</span>
                  <span className="grade-label">Hard</span>
                  <span className="grade-sub">1 day</span>
                </button>
                <button 
                  className="study-grade-btn grade-good"
                  onClick={() => handleRate(3)}
                  title="Press 3"
                >
                  <span className="grade-key">3</span>
                  <span className="grade-label">Good</span>
                  <span className="grade-sub">{activeCard.interval || 2}d</span>
                </button>
                <button 
                  className="study-grade-btn grade-easy"
                  onClick={() => handleRate(4)}
                  title="Press 4"
                >
                  <span className="grade-key">4</span>
                  <span className="grade-label">Easy</span>
                  <span className="grade-sub">{Math.round((activeCard.interval || 2) * 1.3)}d</span>
                </button>
              </div>
            ) : (
              <Button 
                variant="secondary" 
                fullWidth 
                onClick={() => setIsFlipped(true)}
                leftIcon={<RotateCw size={15} />}
              >
                Reveal Answer (Space)
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
