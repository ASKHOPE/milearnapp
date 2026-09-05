import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Keyboard, 
  Zap, 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  X, 
  TrendingUp, 
  Award,
  Play,
  Trophy,
  Sparkles,
  Check,
  Timer,
  FileText
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
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'expert' | 'code'>('beginner');
  const [selectedPassageIdx, setSelectedPassageIdx] = useState(0);
  const [practiceInput, setPracticeInput] = useState('');
  const [isPracticing, setIsPracticing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [bestWpm, setBestWpm] = useState<number>(() => {
    const hist = typingMetrics.getSessionHistory();
    return hist.length > 0 ? Math.max(...hist.map((h) => h.wpm)) : 0;
  });

  // Customizer Controls
  const [sprintMode, setSprintMode] = useState<'time' | 'passage'>('time');
  const [timeLimit, setTimeLimit] = useState<number>(30); // 15, 30, 60, 120 or custom
  const [customTimeInput, setCustomTimeInput] = useState<string>('45');
  const [isCustomTime, setIsCustomTime] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);

  // Text Customization Modifiers
  const [includeCaps, setIncludeCaps] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(false);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Filter passages by chosen difficulty tab
  const filteredPassages = useMemo(() => {
    return selectedDifficulty === 'all'
      ? passages
      : passages.filter((p) => p.difficulty === selectedDifficulty);
  }, [passages, selectedDifficulty]);

  const activePassagesList = filteredPassages.length > 0 ? filteredPassages : passages;
  const rawCurrentPassage = activePassagesList[selectedPassageIdx] || activePassagesList[0] || {
    id: 'default-passage',
    title: 'Dynamic Sprint',
    category: 'Tech' as const,
    difficulty: 'beginner' as const,
    text: 'the quick brown fox jumps over the lazy dog and runs into the warm sun and brings energy to every living being across the open field'
  };

  // Transform passage text according to active customization options
  const transformedText = useMemo(() => {
    let base = rawCurrentPassage.text;
    // Repeat short sentences so there is plenty of text space for long timed sprints
    if (base.length < 120) {
      base = `${base} ${base} ${base}`;
    } else if (base.length < 240) {
      base = `${base} ${base}`;
    }

    if (!includeCaps) {
      base = base.toLowerCase();
    } else {
      // Capitalize first letters of sentences
      base = base.replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
    }

    if (includeNumbers) {
      const words = base.split(' ');
      base = words.map((w, i) => (i % 6 === 3 ? `${w} ${(i * 7 + 12) % 99 + 1}` : w)).join(' ');
    }

    if (includeSymbols) {
      const symbols = ['!', '@', '#', '$', '%', '&', '*', '(', ')', '_', '+', '=', '{', '}', ';', ':'];
      const words = base.split(' ');
      base = words.map((w, i) => (i % 5 === 2 ? `${w}${symbols[i % symbols.length]}` : w)).join(' ');
    }

    return base.trim();
  }, [rawCurrentPassage.text, includeCaps, includeNumbers, includeSymbols]);

  // Timed Sprint Countdown logic
  const handleCompleteSprintRef = useRef<() => void>(() => {});

  const handleCompleteSprint = () => {
    setIsCompleted(true);
    setIsPracticing(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const gameRecord = typingMetrics.endSessionAndPersist(rawCurrentPassage.difficulty);
    setStats(gameRecord);
    const updatedHistory = typingMetrics.getSessionHistory();
    setHistory(updatedHistory);
    if (updatedHistory.length > 0) {
      setBestWpm(Math.max(...updatedHistory.map((h) => h.wpm)));
    }
  };

  handleCompleteSprintRef.current = handleCompleteSprint;

  useEffect(() => {
    if (isPracticing && sprintMode === 'time') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            handleCompleteSprintRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPracticing, sprintMode]);

  const handlePracticeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isPracticing && !isCompleted) {
      setIsPracticing(true);
      typingMetrics.startSession(rawCurrentPassage.title, transformedText);
    }
    typingMetrics.recordKeyDown(e.nativeEvent, practiceInput);
  };

  const handlePracticeKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    typingMetrics.recordKeyUp(e.nativeEvent);
  };

  const handlePracticeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isCompleted) return;
    const val = e.target.value;
    setPracticeInput(val);
    typingMetrics.updateLiveInput(val);

    // Passage completion
    if (sprintMode === 'passage' && val === transformedText) {
      handleCompleteSprint();
    }
  };

  const handleResetPractice = (customTime?: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPracticeInput('');
    setIsPracticing(false);
    setIsCompleted(false);
    const selectedTime = customTime !== undefined ? customTime : (isCustomTime ? parseInt(customTimeInput) || 30 : timeLimit);
    setTimeLeft(selectedTime);
    typingMetrics.cancelSession();
    setStats(typingMetrics.calculateStats());
  };

  if (!isOpen) return null;

  return (
    <div className="selector-modal-overlay" onClick={onClose}>
      <div 
        className="selector-modal-card" 
        style={{ maxWidth: '860px', borderRadius: '16px', overflow: 'hidden' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="selector-modal-header" style={{ borderBottom: '1px solid var(--border-color)', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
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
                Customize time sprints, text sets, capital letters, numbers, and symbols.
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
          padding: '10px 24px',
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
        <div style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: '70vh' }}>
          {activeTab === 'game' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Comprehensive Customizer Control Bar */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                padding: '12px 16px',
                background: 'var(--bg-subtle, rgba(255, 255, 255, 0.03))',
                borderRadius: '12px',
                border: '1px solid var(--border-color)'
              }}>
                {/* Row 1: Mode (Time vs Passage) & Time Selection */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  {/* Sprint Mode: Time vs Full Passage */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                      Sprint Mode:
                    </span>
                    <div style={{ display: 'flex', gap: '3px', background: 'rgba(0, 0, 0, 0.25)', padding: '2px', borderRadius: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSprintMode('time');
                          handleResetPractice();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          fontSize: '11.5px',
                          fontWeight: sprintMode === 'time' ? 700 : 500,
                          borderRadius: '6px',
                          border: 'none',
                          background: sprintMode === 'time' ? 'var(--accent-primary, #6366f1)' : 'transparent',
                          color: sprintMode === 'time' ? '#fff' : 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        <Timer size={12} />
                        <span>Timed Test</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSprintMode('passage');
                          handleResetPractice();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          fontSize: '11.5px',
                          fontWeight: sprintMode === 'passage' ? 700 : 500,
                          borderRadius: '6px',
                          border: 'none',
                          background: sprintMode === 'passage' ? 'var(--accent-primary, #6366f1)' : 'transparent',
                          color: sprintMode === 'passage' ? '#fff' : 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        <FileText size={12} />
                        <span>Full Passage</span>
                      </button>
                    </div>
                  </div>

                  {/* Timed Presets & Custom Seconds */}
                  {sprintMode === 'time' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Time:</span>
                      {[15, 30, 60, 120].map((sec) => {
                        const isSelected = !isCustomTime && timeLimit === sec;
                        return (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => {
                              setIsCustomTime(false);
                              setTimeLimit(sec);
                              handleResetPractice(sec);
                            }}
                            style={{
                              padding: '3px 8px',
                              fontSize: '11px',
                              borderRadius: '6px',
                              border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                              background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                              color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)',
                              cursor: 'pointer',
                              fontWeight: isSelected ? 700 : 500
                            }}
                          >
                            {sec >= 60 ? `${sec / 60}m` : `${sec}s`}
                          </button>
                        );
                      })}

                      {/* Custom Time Option */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomTime(true);
                            const val = parseInt(customTimeInput) || 45;
                            handleResetPractice(val);
                          }}
                          style={{
                            padding: '3px 8px',
                            fontSize: '11px',
                            borderRadius: '6px',
                            border: isCustomTime ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                            background: isCustomTime ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                            color: isCustomTime ? 'var(--accent-primary)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontWeight: isCustomTime ? 700 : 500
                          }}
                        >
                          Custom:
                        </button>
                        <input
                          type="number"
                          min="5"
                          max="600"
                          value={customTimeInput}
                          onChange={(e) => {
                            setCustomTimeInput(e.target.value);
                            setIsCustomTime(true);
                            const val = parseInt(e.target.value) || 30;
                            handleResetPractice(val);
                          }}
                          style={{
                            width: '50px',
                            padding: '2px 6px',
                            fontSize: '11px',
                            borderRadius: '5px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            textAlign: 'center'
                          }}
                        />
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>sec</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Row 2: Text Customization & Compact Passage Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px' }}>
                  {/* Text Style Customizers: Capital letters, Numbers, Symbols */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                      Text Modifiers:
                    </span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={includeCaps}
                        onChange={(e) => {
                          setIncludeCaps(e.target.checked);
                          handleResetPractice();
                        }}
                        style={{ accentColor: 'var(--accent-primary)' }}
                      />
                      <span>Capitals (Aa)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={includeNumbers}
                        onChange={(e) => {
                          setIncludeNumbers(e.target.checked);
                          handleResetPractice();
                        }}
                        style={{ accentColor: 'var(--accent-primary)' }}
                      />
                      <span>Numbers (123)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={includeSymbols}
                        onChange={(e) => {
                          setIncludeSymbols(e.target.checked);
                          handleResetPractice();
                        }}
                        style={{ accentColor: 'var(--accent-primary)' }}
                      />
                      <span>Symbols (#$%)</span>
                    </label>
                  </div>

                  {/* Reduced Passage Selector Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Passage:
                    </span>
                    <select
                      value={selectedPassageIdx}
                      onChange={(e) => {
                        setSelectedPassageIdx(Number(e.target.value));
                        handleResetPractice();
                      }}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11.5px',
                        fontWeight: 500,
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card, #161b22)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        outline: 'none',
                        maxWidth: '250px'
                      }}
                    >
                      {activePassagesList.map((pass, i) => (
                        <option key={pass.id} value={i}>
                          {pass.title} ({pass.difficulty})
                        </option>
                      ))}
                    </select>

                    {/* Difficulty Pill Filter */}
                    <div style={{ display: 'flex', gap: '2px', background: 'rgba(0, 0, 0, 0.2)', padding: '2px', borderRadius: '6px' }}>
                      {(['all', 'beginner', 'intermediate', 'expert', 'code'] as const).map((diff) => {
                        const shortLabels: Record<string, string> = {
                          all: 'All',
                          beginner: 'Easy',
                          intermediate: 'Norm',
                          expert: 'Hard',
                          code: 'Code'
                        };
                        const isActive = selectedDifficulty === diff;
                        return (
                          <button
                            key={diff}
                            type="button"
                            onClick={() => {
                              setSelectedDifficulty(diff);
                              setSelectedPassageIdx(0);
                              handleResetPractice();
                            }}
                            style={{
                              padding: '2px 6px',
                              fontSize: '10.5px',
                              fontWeight: isActive ? 700 : 500,
                              borderRadius: '4px',
                              border: 'none',
                              background: isActive ? 'var(--accent-primary, #6366f1)' : 'transparent',
                              color: isActive ? '#fff' : 'var(--text-muted)',
                              cursor: 'pointer'
                            }}
                          >
                            {shortLabels[diff]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Generous Visible Sentences Space Card */}
              <div style={{
                position: 'relative',
                padding: '22px 26px',
                background: 'var(--bg-card, rgba(255, 255, 255, 0.03))',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                borderRadius: '14px',
                fontSize: '18px',
                lineHeight: 1.85,
                letterSpacing: '0.015em',
                userSelect: 'none',
                minHeight: '140px',
                maxHeight: '220px',
                overflowY: 'auto'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  fontSize: '11.5px',
                  color: 'var(--text-muted)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{rawCurrentPassage.title}</span>
                    <span>•</span>
                    <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{rawCurrentPassage.difficulty}</span>
                  </div>

                  {sprintMode === 'time' && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      color: timeLeft <= 5 ? '#ef4444' : 'var(--accent-primary)',
                      fontWeight: 700,
                      fontSize: '13px'
                    }}>
                      <Timer size={14} />
                      <span>{timeLeft}s remaining</span>
                    </div>
                  )}
                </div>

                {/* Visible Multi-Sentence Stream with Accurate Live Character Highlighting */}
                <div style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                  {transformedText.split('').map((char, index) => {
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
                    fontSize: '16px',
                    borderRadius: '10px',
                    border: isCompleted ? '2px solid #10b981' : '1px solid var(--accent-primary)',
                    background: 'var(--bg-input, var(--bg-card))',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxShadow: isPracticing ? '0 0 0 3px rgba(99, 102, 241, 0.2)' : 'none',
                    transition: 'all 0.2s ease',
                    fontFamily: 'var(--font-mono, monospace)'
                  }}
                />
              </div>

              {/* Live Game Telemetry Meter (Speed, Accuracy, Time) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '14px'
              }}>
                <div style={{
                  padding: '14px 12px',
                  background: 'var(--bg-card)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--accent-primary)', marginBottom: '3px' }}>
                    <Zap size={14} />
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>SPEED</span>
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--accent-primary)' }}>
                    {stats.wpm} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>WPM</span>
                  </div>
                </div>

                <div style={{
                  padding: '14px 12px',
                  background: 'var(--bg-card)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#10b981', marginBottom: '3px' }}>
                    <CheckCircle2 size={14} />
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>ACCURACY</span>
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981' }}>
                    {stats.accuracy}%
                  </div>
                </div>

                <div style={{
                  padding: '14px 12px',
                  background: 'var(--bg-card)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#f59e0b', marginBottom: '3px' }}>
                    <Clock size={14} />
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>{sprintMode === 'time' ? 'REMAINING' : 'ELAPSED'}</span>
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#f59e0b' }}>
                    {sprintMode === 'time' ? `${timeLeft}s` : `${stats.durationSeconds}s`}
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
                    onClick={() => handleResetPractice()}
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
