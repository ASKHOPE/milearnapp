import React, { useState, useEffect } from 'react';
import { 
  Keyboard, 
  Zap, 
  Activity, 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  X, 
  TrendingUp, 
  Award,
  Play,
  Trophy,
  Sparkles,
  Check
} from 'lucide-react';
import { typingMetrics, type TypingSessionStats, type PracticeGameSession, type PassageItem } from '../services/typingMetrics';
import type { Note } from '../types';

interface TypingMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes?: Note[];
}

export const TypingMetricsModal: React.FC<TypingMetricsModalProps> = ({ isOpen, onClose, notes }) => {
  const [activeTab, setActiveTab] = useState<'game' | 'history'>('game');
  const [stats, setStats] = useState<TypingSessionStats>(() => typingMetrics.calculateStats());
  const [history, setHistory] = useState<PracticeGameSession[]>(() => typingMetrics.getSessionHistory());

  // Dynamic Passages loaded from PostgreSQL / Vault
  const [passages, setPassages] = useState<PassageItem[]>([]);

  // Practice Mode State
  const [selectedPassageIdx, setSelectedPassageIdx] = useState(0);
  const [practiceInput, setPracticeInput] = useState('');
  const [isPracticing, setIsPracticing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [bestWpm, setBestWpm] = useState<number>(() => {
    const hist = typingMetrics.getSessionHistory();
    return hist.length > 0 ? Math.max(...hist.map((h) => h.wpm)) : 0;
  });

  useEffect(() => {
    if (isOpen) {
      const hist = typingMetrics.getSessionHistory();
      setHistory(hist);
      setStats(typingMetrics.calculateStats());
      if (hist.length > 0) {
        setBestWpm(Math.max(...hist.map((h) => h.wpm)));
      }

      // Fetch dynamic passages from PostgreSQL or user vault notes
      typingMetrics.getPracticePassages(notes).then((loaded) => {
        if (loaded && loaded.length > 0) {
          setPassages(loaded);
        }
      });
    }
  }, [isOpen, notes]);

  useEffect(() => {
    const unsubscribe = typingMetrics.subscribe((newStats) => {
      setStats(newStats);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  if (!isOpen) return null;

  const currentPassage = passages[selectedPassageIdx] || passages[0] || {
    id: 'default-passage',
    title: 'Dynamic Sprint',
    category: 'Tech' as const,
    difficulty: 'beginner' as const,
    text: 'Local-first architecture guarantees real-time responsiveness and full user data autonomy.'
  };

  const handlePracticeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isPracticing && !isCompleted) {
      setIsPracticing(true);
      typingMetrics.startSession(currentPassage.title);
    }
    typingMetrics.recordKeyDown(e.nativeEvent);
  };

  const handlePracticeKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    typingMetrics.recordKeyUp(e.nativeEvent);
  };

  const handlePracticeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPracticeInput(val);

    if (val === currentPassage.text) {
      setIsCompleted(true);
      setIsPracticing(false);
      const gameRecord = typingMetrics.endSessionAndPersist(currentPassage.difficulty);
      setStats(gameRecord);
      const updatedHistory = typingMetrics.getSessionHistory();
      setHistory(updatedHistory);
      setBestWpm(Math.max(...updatedHistory.map((h) => h.wpm)));
    }
  };

  const handleResetPractice = () => {
    setPracticeInput('');
    setIsPracticing(false);
    setIsCompleted(false);
    typingMetrics.cancelSession();
  };

  return (
    <div className="selector-modal-overlay" onClick={onClose}>
      <div 
        className="selector-modal-card" 
        style={{ maxWidth: '800px', borderRadius: '16px', overflow: 'hidden' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="selector-modal-header" style={{ borderBottom: '1px solid var(--border-color)', padding: '18px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)'
            }}>
              <Keyboard size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>Typing Practice Game & Sprint</h3>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  Zero Note Logging
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Practice sprints are recorded in your personal speed arcade. Everyday note editing is never logged.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {bestWpm > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#f59e0b',
                fontSize: '12px',
                fontWeight: 600
              }}>
                <Trophy size={14} />
                <span>PB: {bestWpm} WPM</span>
              </div>
            )}
            <button type="button" className="editor-icon-btn" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 24px',
          background: 'var(--bg-subtle, rgba(0, 0, 0, 0.02))',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <button
            type="button"
            className={`library-tab-pill ${activeTab === 'game' ? 'active' : ''}`}
            onClick={() => setActiveTab('game')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Play size={13} />
            <span>Practice Sprint Game</span>
          </button>
          <button
            type="button"
            className={`library-tab-pill ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <TrendingUp size={13} />
            <span>Game Logs & Arcade History ({history.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '68vh' }}>
          {activeTab === 'game' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Passage Category Selector Strip */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Choose Sprint Passage:
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {passages.map((pass, i) => (
                    <button
                      key={pass.id}
                      type="button"
                      style={{
                        padding: '5px 12px',
                        fontSize: '12px',
                        borderRadius: '8px',
                        border: selectedPassageIdx === i 
                          ? '1px solid var(--accent-primary)' 
                          : '1px solid var(--border-color)',
                        background: selectedPassageIdx === i ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        color: selectedPassageIdx === i ? 'var(--accent-primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontWeight: selectedPassageIdx === i ? 600 : 400,
                        transition: 'all 0.15s ease'
                      }}
                      onClick={() => {
                        setSelectedPassageIdx(i);
                        handleResetPractice();
                      }}
                    >
                      {pass.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Passage Card Display */}
              <div style={{
                position: 'relative',
                padding: '20px',
                background: 'var(--bg-card, rgba(255, 255, 255, 0.04))',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                borderRadius: '12px',
                fontSize: '16px',
                lineHeight: 1.7,
                letterSpacing: '0.01em',
                userSelect: 'none'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  fontSize: '11px',
                  color: 'var(--text-muted)'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currentPassage.title}</span>
                  <span>•</span>
                  <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{currentPassage.difficulty}</span>
                </div>

                <div>
                  {currentPassage.text.split('').map((char, index) => {
                    let color = 'var(--text-muted)';
                    let bg = 'transparent';

                    if (index < practiceInput.length) {
                      if (practiceInput[index] === char) {
                        color = '#10b981'; // Correct letter
                      } else {
                        color = '#ef4444'; // Error
                        bg = 'rgba(239, 68, 68, 0.25)';
                      }
                    } else if (index === practiceInput.length) {
                      bg = 'rgba(99, 102, 241, 0.35)'; // Active typing cursor target
                      color = '#ffffff';
                    }

                    return (
                      <span key={index} style={{ color, backgroundColor: bg, borderRadius: '2px' }}>
                        {char}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Typing Input Field */}
              <div>
                <input
                  type="text"
                  autoFocus
                  disabled={isCompleted}
                  placeholder="Click here and start typing to begin sprint..."
                  value={practiceInput}
                  onKeyDown={handlePracticeKeyDown}
                  onKeyUp={handlePracticeKeyUp}
                  onChange={handlePracticeChange}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    fontSize: '15px',
                    borderRadius: '10px',
                    border: isCompleted ? '2px solid #10b981' : '1px solid var(--accent-primary)',
                    background: 'var(--bg-input, var(--bg-card))',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxShadow: isPracticing ? '0 0 0 3px rgba(99, 102, 241, 0.2)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                />
              </div>

              {/* Live Game Telemetry Meter */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px'
              }}>
                <div style={{
                  padding: '14px',
                  background: 'var(--bg-card)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--accent-primary)', marginBottom: '4px' }}>
                    <Zap size={15} />
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>SPEED</span>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-primary)' }}>
                    {stats.wpm} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>WPM</span>
                  </div>
                </div>

                <div style={{
                  padding: '14px',
                  background: 'var(--bg-card)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#10b981', marginBottom: '4px' }}>
                    <CheckCircle2 size={15} />
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>ACCURACY</span>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981' }}>
                    {stats.accuracy}%
                  </div>
                </div>

                <div style={{
                  padding: '14px',
                  background: 'var(--bg-card)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#f59e0b', marginBottom: '4px' }}>
                    <Clock size={15} />
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>ELAPSED</span>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b' }}>
                    {stats.durationSeconds}s
                  </div>
                </div>

                <div style={{
                  padding: '14px',
                  background: 'var(--bg-card)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#8b5cf6', marginBottom: '4px' }}>
                    <Activity size={15} />
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>RHYTHM</span>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#8b5cf6' }}>
                    {stats.consistencyScore}%
                  </div>
                </div>
              </div>

              {/* Completion Banner */}
              {isCompleted && (
                <div style={{
                  padding: '18px 24px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(99, 102, 241, 0.15))',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff'
                    }}>
                      <Check size={22} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#10b981' }}>
                        Sprint Completed!
                      </h4>
                      <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        You scored <strong>{stats.wpm} WPM</strong> with <strong>{stats.accuracy}% accuracy</strong>. Saved to game log!
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-small-primary"
                    onClick={handleResetPractice}
                    style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <RotateCcw size={14} />
                    <span>Sprint Again</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: GAME LOGS & ARCADE HISTORY */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Logged Sprint Games ({history.length})
                </span>
                {history.length > 0 && (
                  <button
                    type="button"
                    className="btn-small-ghost danger"
                    onClick={() => {
                      if (confirm('Clear all practice typing records?')) {
                        typingMetrics.clearHistory();
                        setHistory([]);
                        setBestWpm(0);
                      }
                    }}
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    Clear History
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px dashed var(--border-color)',
                  color: 'var(--text-muted)'
                }}>
                  <Sparkles size={32} color="var(--accent-primary)" style={{ margin: '0 auto 12px' }} />
                  <h4 style={{ margin: '0 0 6px', fontSize: '15px', color: 'var(--text-primary)' }}>No sprint games recorded yet</h4>
                  <p style={{ margin: 0, fontSize: '12px' }}>Complete a practice sprint above to record your speed and accuracy in the arcade log.</p>
                </div>
              ) : (
                history.map((sess) => (
                  <div
                    key={sess.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      fontSize: '13px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: sess.wpm >= 60 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                        color: sess.wpm >= 60 ? '#10b981' : 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Award size={16} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '15px' }}>{sess.wpm} WPM</strong>
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>· {sess.cpm} CPM</span>
                          <span style={{
                            color: sess.accuracy >= 95 ? '#10b981' : '#f59e0b',
                            fontWeight: 600,
                            fontSize: '12px'
                          }}>
                            · {sess.accuracy}% Acc
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {sess.passageTitle || 'Practice Sprint'} ({sess.difficulty})
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      <span>Rhythm: {sess.consistencyScore}%</span>
                      <span>{new Date(sess.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
