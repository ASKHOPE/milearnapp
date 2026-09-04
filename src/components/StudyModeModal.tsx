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
  Flame, 
  ArrowRight,
  Plus,
  Trash2,
  Trophy,
  Zap,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { triggerConfetti } from '../services/animations';

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
  const [activeTab, setActiveTab] = useState<'study' | 'quiz' | 'creator'>('study');
  const [deckFilter, setDeckFilter] = useState<'current' | 'due' | 'all'>('due');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionGrades, setSessionGrades] = useState<number[]>([]);

  // Gamified Quiz State
  const [quizScore, setQuizScore] = useState(0);
  const [quizStreak, setQuizStreak] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState<boolean | null>(null);

  // Manual Card Creator State
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newCardType, setNewCardType] = useState<'qa' | 'concept' | 'cloze'>('qa');
  const [cardCreatedNotice, setCardCreatedNotice] = useState(false);

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
    setQuizScore(0);
    setQuizStreak(0);
    setQuizAnswered(null);
  }, [isOpen, deckFilter, notes, currentNote]);

  const activeCard = cards[currentIndex];

  const handleRate = React.useCallback((grade: 1 | 2 | 3 | 4) => {
    if (!activeCard) return;

    const updated = flashcardService.scheduleCard(activeCard, grade);
    const updatedCards = [...cards];
    updatedCards[currentIndex] = updated;

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
      triggerConfetti();
    }
  }, [activeCard, cards, currentIndex]);

  // Gamified Quiz Handler (Correct vs Incorrect + Multipliers)
  const handleQuizAnswer = (isCorrect: boolean) => {
    setQuizAnswered(isCorrect);
    setIsFlipped(true);

    if (isCorrect) {
      const nextStreak = quizStreak + 1;
      const multiplier = Math.min(nextStreak, 5);
      const points = 100 * multiplier;
      setQuizStreak(nextStreak);
      setQuizScore((prev) => prev + points);
    } else {
      setQuizStreak(0);
    }

    setTimeout(() => {
      setQuizAnswered(null);
      if (currentIndex + 1 < cards.length) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
      } else {
        setSessionCompleted(true);
        triggerConfetti();
      }
    }, 1200);
  };

  // Create Manual Card
  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    const created = flashcardService.addManualCard({
      noteId: currentNote?.id || 'general-deck',
      noteTitle: currentNote?.title || newCategory,
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      type: newCardType,
      deckCategory: newCategory.trim()
    });

    setCards((prev) => [created, ...prev]);
    setNewQuestion('');
    setNewAnswer('');
    setCardCreatedNotice(true);
    setTimeout(() => setCardCreatedNotice(false), 2500);
  };

  const handleDeleteCard = (cardId: string) => {
    flashcardService.deleteCard(cardId);
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    if (currentIndex >= cards.length - 1) {
      setCurrentIndex(Math.max(0, cards.length - 2));
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
    setReviewedCount(0);
    setSessionGrades([]);
    setQuizScore(0);
    setQuizStreak(0);
    setQuizAnswered(null);
  };

  // Keyboard controls: Space to flip, 1-4 to grade
  useEffect(() => {
    if (!isOpen || sessionCompleted || cards.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped && activeTab === 'study') {
        if (e.key === '1') handleRate(1);
        if (e.key === '2') handleRate(2);
        if (e.key === '3') handleRate(3);
        if (e.key === '4') handleRate(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, sessionCompleted, cards.length, isFlipped, activeTab, handleRate]);

  // Accuracy calculation
  const goodGrades = sessionGrades.filter((g) => g >= 3).length;
  const accuracy = reviewedCount > 0 ? Math.round((goodGrades / reviewedCount) * 100) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Study Arena & Flashcard Studio"
      subtitle="Master concepts with SuperMemo-2 Spaced Repetition & Gamified Quizzes"
      icon={<GraduationCap size={20} color="var(--color-primary)" />}
      maxWidth={720}
    >
      <div className="study-modal-container">
        {/* Top Segmented Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '12px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`library-tab-pill ${activeTab === 'study' ? 'active' : ''}`}
              onClick={() => setActiveTab('study')}
            >
              <Sparkles size={13} />
              <span>Spaced Repetition</span>
            </button>
            <button
              type="button"
              className={`library-tab-pill ${activeTab === 'quiz' ? 'active' : ''}`}
              onClick={() => setActiveTab('quiz')}
            >
              <Trophy size={13} />
              <span>Gamified Quiz</span>
            </button>
            <button
              type="button"
              className={`library-tab-pill ${activeTab === 'creator' ? 'active' : ''}`}
              onClick={() => setActiveTab('creator')}
            >
              <Plus size={13} />
              <span>Create Q&A Card</span>
            </button>
          </div>

          {activeTab === 'quiz' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#f59e0b'
              }}>
                <Flame size={14} />
                <span>{quizStreak} Streak</span>
              </div>
              <div style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary)',
                fontSize: '12px',
                fontWeight: 700
              }}>
                {quizScore} PTS
              </div>
            </div>
          )}
        </div>

        {/* TAB 1 & 2: STUDY / QUIZ ARENA */}
        {activeTab !== 'creator' && (
          <>
            {/* Filter Deck Strip */}
            <div className="study-header-bar">
              <div className="study-filter-group">
                <button
                  type="button"
                  className={`study-filter-btn ${deckFilter === 'due' ? 'active' : ''}`}
                  onClick={() => setDeckFilter('due')}
                >
                  <Zap size={13} />
                  <span>Due Today</span>
                </button>
                {currentNote && (
                  <button
                    type="button"
                    className={`study-filter-btn ${deckFilter === 'current' ? 'active' : ''}`}
                    onClick={() => setDeckFilter('current')}
                  >
                    <span>This Note</span>
                  </button>
                )}
                <button
                  type="button"
                  className={`study-filter-btn ${deckFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setDeckFilter('all')}
                >
                  <Layers size={13} />
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
              <div className="study-empty-state" style={{ padding: '36px 20px', textAlign: 'center' }}>
                <Sparkles size={36} color="var(--color-primary)" style={{ margin: '0 auto 12px' }} />
                <h4>No flashcards found in this deck</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Create custom cards using the <strong>Create Q&A Card</strong> tab, or use note syntax like <code>Q: Question / A: Answer</code>.
                </p>
                <Button variant="primary" size="sm" onClick={() => setActiveTab('creator')} leftIcon={<Plus size={14} />}>
                  Create First Flashcard
                </Button>
              </div>
            ) : sessionCompleted ? (
              /* Completed Summary View */
              <div className="study-summary-view">
                <div className="study-summary-badge">
                  <Trophy size={42} color="#f59e0b" />
                </div>
                <h3>{activeTab === 'quiz' ? 'Quiz Completed!' : 'Session Complete! Great Focus!'}</h3>
                <p className="study-summary-sub">
                  {activeTab === 'quiz' ? (
                    <>You scored <strong>{quizScore} points</strong> across {cards.length} cards!</>
                  ) : (
                    <>You reviewed <strong>{reviewedCount}</strong> card{reviewedCount !== 1 ? 's' : ''} with <strong>{accuracy}%</strong> retention.</>
                  )}
                </p>

                <div className="study-stats-grid">
                  <div className="study-stat-card">
                    <span className="stat-label">Cards Completed</span>
                    <span className="stat-value">{cards.length}</span>
                  </div>
                  <div className="study-stat-card">
                    <span className="stat-label">{activeTab === 'quiz' ? 'Score' : 'Retention Rate'}</span>
                    <span className="stat-value" style={{ color: 'var(--color-success)' }}>
                      {activeTab === 'quiz' ? quizScore : `${accuracy}%`}
                    </span>
                  </div>
                  <div className="study-stat-card">
                    <span className="stat-label">Mastery Mode</span>
                    <span className="stat-value">{activeTab === 'quiz' ? 'Streak Multiplier' : 'SM-2 Interval'}</span>
                  </div>
                </div>

                <div className="study-summary-actions">
                  <Button variant="secondary" onClick={handleRestart} leftIcon={<RotateCw size={15} />}>
                    Play Again
                  </Button>
                  <Button variant="primary" onClick={onClose} rightIcon={<ArrowRight size={15} />}>
                    Back to Notes
                  </Button>
                </div>
              </div>
            ) : (
              /* Active 3D Card Presentation */
              <div className="study-active-arena">
                <div 
                  className={`study-flashcard-3d ${isFlipped ? 'flipped' : ''}`}
                  onClick={() => setIsFlipped(!isFlipped)}
                  title="Click or press Space to flip"
                  style={{ cursor: 'pointer' }}
                >
                  <div className="study-card-face study-card-front">
                    <div className="card-face-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Badge variant="primary">{activeCard.type.toUpperCase()}</Badge>
                      <span className="card-source-title">{activeCard.noteTitle}</span>
                      {activeCard.isManual && (
                        <button
                          type="button"
                          className="editor-icon-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCard(activeCard.id);
                          }}
                          title="Delete Card"
                        >
                          <Trash2 size={13} color="#ef4444" />
                        </button>
                      )}
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
                      <span className="flip-hint">{activeTab === 'quiz' ? 'Did you get it right?' : 'Rate recall difficulty below'}</span>
                    </div>
                  </div>
                </div>

                {/* Rating Controls */}
                {activeTab === 'study' ? (
                  <div className="study-rating-strip" style={{ opacity: isFlipped ? 1 : 0.45 }}>
                    <button
                      type="button"
                      className="rating-grade-btn grade-again"
                      onClick={() => handleRate(1)}
                      disabled={!isFlipped}
                    >
                      <strong>Again</strong>
                      <span>&lt; 1d</span>
                      <kbd>1</kbd>
                    </button>
                    <button
                      type="button"
                      className="rating-grade-btn grade-hard"
                      onClick={() => handleRate(2)}
                      disabled={!isFlipped}
                    >
                      <strong>Hard</strong>
                      <span>{Math.max(1, Math.round(activeCard.interval * 1.2))}d</span>
                      <kbd>2</kbd>
                    </button>
                    <button
                      type="button"
                      className="rating-grade-btn grade-good"
                      onClick={() => handleRate(3)}
                      disabled={!isFlipped}
                    >
                      <strong>Good</strong>
                      <span>{Math.max(2, Math.round(activeCard.interval * activeCard.easeFactor))}d</span>
                      <kbd>3</kbd>
                    </button>
                    <button
                      type="button"
                      className="rating-grade-btn grade-easy"
                      onClick={() => handleRate(4)}
                      disabled={!isFlipped}
                    >
                      <strong>Easy</strong>
                      <span>{Math.max(4, Math.round(activeCard.interval * activeCard.easeFactor * 1.3))}d</span>
                      <kbd>4</kbd>
                    </button>
                  </div>
                ) : (
                  /* Gamified Quiz Answer Buttons */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '16px' }}>
                    {quizAnswered !== null && (
                      <div style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        background: quizAnswered ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: quizAnswered ? '#10b981' : '#ef4444',
                        border: quizAnswered ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)'
                      }}>
                        {quizAnswered ? `🔥 Great recall! +${100 * Math.min(quizStreak, 5)} points` : 'Keep practicing! Review this card soon.'}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                      <button
                        type="button"
                        onClick={() => handleQuizAnswer(false)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '10px',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontSize: '14px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <XCircle size={18} />
                        <span>Missed It</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuizAnswer(true)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '10px',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontSize: '14px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <CheckCircle2 size={18} />
                        <span>Nailed It! (+{100 * Math.min(quizStreak + 1, 5)})</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* TAB 3: CUSTOM CARD & QUIZ CREATOR */}
        {activeTab === 'creator' && (
          <form onSubmit={handleCreateCard} style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '8px 0' }}>
            {cardCreatedNotice && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={15} />
                <span>Card successfully saved and added to your deck!</span>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Question / Prompt (Front of Card)
              </label>
              <textarea
                required
                rows={3}
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="e.g. What is the difference between synchronous and asynchronous execution in Node.js?"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-input, var(--bg-card))',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Answer / Explanation (Back of Card)
              </label>
              <textarea
                required
                rows={3}
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="e.g. Synchronous code blocks the event loop; asynchronous code delegates I/O to libuv and invokes a callback or promise resolution."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-input, var(--bg-card))',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Deck Category / Subject
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Computer Science"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-input, var(--bg-card))',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Card Format
                </label>
                <select
                  value={newCardType}
                  onChange={(e) => setNewCardType(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-input, var(--bg-card))',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                >
                  <option value="qa">Question & Answer (Standard)</option>
                  <option value="concept">Concept & Definition</option>
                  <option value="cloze">Fill-in-the-Blank Cloze</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <Button type="button" variant="ghost" onClick={() => setActiveTab('study')}>
                View Study Deck
              </Button>
              <Button type="submit" variant="primary" leftIcon={<Plus size={15} />}>
                Save Flashcard
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
