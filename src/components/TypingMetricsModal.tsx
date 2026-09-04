import React, { useState, useEffect } from 'react';
import { 
  Keyboard, 
  Zap, 
  Activity, 
  Clock, 
  Flame, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  X,
  BarChart2,
  TrendingUp,
  Award
} from 'lucide-react';
import { typingMetrics, type TypingSessionStats, type DailyTypingMetrics } from '../services/typingMetrics';

interface TypingMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRACTICE_PASSAGES = [
  "Local-first software gives users ownership of their data and operates reliably without requiring constant network connectivity.",
  "Knowledge graphs represent relationships between concepts, transforming unstructured notes into interconnected thought networks.",
  "The SuperMemo-2 spaced repetition algorithm calculates exponential review intervals to combat the human forgetting curve.",
  "Keystroke dynamics analyze typing rhythm, flight time, and dwell duration to measure cognitive fluency and typing mastery."
];

export const TypingMetricsModal: React.FC<TypingMetricsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'practice' | 'live' | 'daily' | 'history'>('practice');
  const [stats, setStats] = useState<TypingSessionStats>(typingMetrics.calculateStats());
  const [history, setHistory] = useState<TypingSessionStats[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyTypingMetrics | null>(null);

  // Practice Mode State
  const [selectedPassageIdx, setSelectedPassageIdx] = useState(0);
  const [practiceInput, setPracticeInput] = useState('');
  const [isPracticing, setIsPracticing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setDailyMetrics(typingMetrics.getDailyMetrics(today));
      setHistory(typingMetrics.getSessionHistory());
      setStats(typingMetrics.calculateStats());
    }
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = typingMetrics.subscribe((newStats) => {
      setStats(newStats);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  if (!isOpen) return null;

  const currentPassage = PRACTICE_PASSAGES[selectedPassageIdx];

  const handlePracticeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isPracticing) {
      setIsPracticing(true);
      typingMetrics.startSession();
    }
    typingMetrics.recordKeyDown(e.nativeEvent);
  };

  const handlePracticeKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    typingMetrics.recordKeyUp(e.nativeEvent);
  };

  const handlePracticeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPracticeInput(val);

    if (val === currentPassage) {
      setIsCompleted(true);
      setIsPracticing(false);
      const finalStats = typingMetrics.endSessionAndPersist();
      setStats(finalStats);
      const today = new Date().toISOString().split('T')[0];
      setDailyMetrics(typingMetrics.getDailyMetrics(today));
      setHistory(typingMetrics.getSessionHistory());
    }
  };

  const handleResetPractice = () => {
    setPracticeInput('');
    setIsPracticing(false);
    setIsCompleted(false);
    typingMetrics.startSession();
  };

  return (
    <div className="selector-modal-overlay" onClick={onClose}>
      <div className="selector-modal-card" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="selector-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              background: 'rgba(99, 102, 241, 0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Keyboard size={18} color="var(--accent-primary)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>On-Device Typing Metrics</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Rhythm dynamics, WPM, CPM, accuracy, hold & flight time analytics
              </span>
            </div>
          </div>

          <button className="library-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))', 
          background: 'var(--bg-subtle, rgba(255, 255, 255, 0.02))',
          padding: '4px 16px',
          gap: '8px'
        }}>
          <button
            type="button"
            className={`library-tab-pill ${activeTab === 'practice' ? 'active' : ''}`}
            onClick={() => setActiveTab('practice')}
          >
            <Zap size={13} />
            <span>Practice Sprint</span>
          </button>
          <button
            type="button"
            className={`library-tab-pill ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => setActiveTab('live')}
          >
            <Activity size={13} />
            <span>Live Keystroke Telemetry</span>
          </button>
          <button
            type="button"
            className={`library-tab-pill ${activeTab === 'daily' ? 'active' : ''}`}
            onClick={() => setActiveTab('daily')}
          >
            <BarChart2 size={13} />
            <span>Daily Activity</span>
          </button>
          <button
            type="button"
            className={`library-tab-pill ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <TrendingUp size={13} />
            <span>Session Logs ({history.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', maxHeight: '65vh' }}>

          {/* TAB 1: PRACTICE SPRINT */}
          {activeTab === 'practice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Passage Selectors */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Select Practice Passage:
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {PRACTICE_PASSAGES.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`btn-small-tab ${selectedPassageIdx === i ? 'active' : ''}`}
                      style={{
                        padding: '3px 10px',
                        fontSize: '11px',
                        borderRadius: '5px',
                        border: '1px solid var(--border-color)',
                        background: selectedPassageIdx === i ? 'var(--accent-primary)' : 'transparent',
                        color: selectedPassageIdx === i ? '#fff' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                      onClick={() => { setSelectedPassageIdx(i); handleResetPractice(); }}
                    >
                      Sprint {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Passage Display Card */}
              <div style={{
                padding: '16px',
                background: 'var(--bg-card, rgba(255, 255, 255, 0.04))',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                borderRadius: '10px',
                fontSize: '14px',
                lineHeight: 1.6,
                letterSpacing: '0.01em',
                userSelect: 'none'
              }}>
                {currentPassage.split('').map((char, index) => {
                  let color = 'var(--text-muted)';
                  let bg = 'transparent';

                  if (index < practiceInput.length) {
                    if (practiceInput[index] === char) {
                      color = '#10b981'; // Correct
                    } else {
                      color = '#ef4444'; // Error
                      bg = 'rgba(239, 68, 68, 0.2)';
                    }
                  } else if (index === practiceInput.length) {
                    bg = 'rgba(99, 102, 241, 0.3)'; // Cursor target
                    color = '#ffffff';
                  }

                  return (
                    <span key={index} style={{ color, backgroundColor: bg, borderRadius: '2px' }}>
                      {char}
                    </span>
                  );
                })}
              </div>

              {/* Input Field */}
              <div>
                <input
                  type="text"
                  autoFocus
                  disabled={isCompleted}
                  placeholder="Type the passage above to test your speed & rhythm..."
                  value={practiceInput}
                  onKeyDown={handlePracticeKeyDown}
                  onKeyUp={handlePracticeKeyUp}
                  onChange={handlePracticeChange}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    background: 'var(--bg-primary, #0c0e14)',
                    border: isCompleted ? '2px solid #10b981' : '1px solid var(--border-color)',
                    color: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Live Status Bar */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '10px'
              }}>
                <div style={{ padding: '10px', background: 'var(--bg-card)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Net Speed</span>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-primary)' }}>{stats.wpm} <span style={{ fontSize: '12px' }}>WPM</span></div>
                </div>

                <div style={{ padding: '10px', background: 'var(--bg-card)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Keystroke CPM</span>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#0ea5e9' }}>{stats.cpm} <span style={{ fontSize: '12px' }}>CPM</span></div>
                </div>

                <div style={{ padding: '10px', background: 'var(--bg-card)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Accuracy</span>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: stats.accuracy >= 95 ? '#10b981' : '#f59e0b' }}>{stats.accuracy}%</div>
                </div>

                <div style={{ padding: '10px', background: 'var(--bg-card)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rhythm Consistency</span>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#8b5cf6' }}>{stats.consistencyScore}%</div>
                </div>
              </div>

              {isCompleted && (
                <div style={{
                  padding: '14px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={20} color="#10b981" />
                    <div>
                      <strong style={{ color: '#10b981', display: 'block', fontSize: '13px' }}>Sprint Completed Successfully!</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Session logged to your local vault.</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="library-btn-primary"
                    onClick={handleResetPractice}
                  >
                    <RotateCcw size={13} />
                    <span>Try Again</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIVE KEYSTROKE TELEMETRY */}
          {activeTab === 'live' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px'
              }}>
                <div style={{ padding: '14px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Clock size={14} color="var(--accent-primary)" />
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>Key Hold / Dwell Time</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.averageHoldTime} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ms</span></div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Duration each key remains depressed</span>
                </div>

                <div style={{ padding: '14px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Flame size={14} color="#f59e0b" />
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>Key Flight Time</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.averageFlightTime} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ms</span></div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Latency transitioning between keys</span>
                </div>

                <div style={{ padding: '14px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <AlertCircle size={14} color="#ef4444" />
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>Error & Corrections</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.errorKeystrokes} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>({stats.backspaceCount} backspaces)</span></div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Corrections within session</span>
                </div>
              </div>

              <div style={{
                padding: '14px',
                background: 'var(--bg-card)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600 }}>Keystroke Dynamics Overview</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  This typing engine continuously tracks your muscle memory patterns entirely inside your browser memory with zero network transmissions. Flight time and dwell variance provide objective metrics on typing fatigue and flow state.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: DAILY ACTIVITY */}
          {activeTab === 'daily' && dailyMetrics && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px'
              }}>
                <div style={{ padding: '14px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Today's Total Words</span>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-primary)' }}>{dailyMetrics.totalWordsTyped}</div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>~{dailyMetrics.totalCharactersTyped} characters</span>
                </div>

                <div style={{ padding: '14px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Average / Peak WPM</span>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>{dailyMetrics.averageWpm} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ {dailyMetrics.peakWpm} WPM</span></div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Across {dailyMetrics.sessionCount} sessions</span>
                </div>

                <div style={{ padding: '14px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active Typing Time</span>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#8b5cf6' }}>{Math.round(dailyMetrics.totalTimeSeconds / 60)} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>mins</span></div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Overall Accuracy: {dailyMetrics.averageAccuracy}%</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SESSION HISTORY */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No recorded sessions yet. Complete a Practice Sprint to build your log!
                </div>
              ) : (
                history.map((sess, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Award size={15} color="var(--accent-primary)" />
                      <strong>{sess.wpm} WPM</strong>
                      <span style={{ color: 'var(--text-muted)' }}>· {sess.cpm} CPM</span>
                      <span style={{ color: sess.accuracy >= 95 ? '#10b981' : '#f59e0b' }}>· {sess.accuracy}% Acc</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                      <span>Hold: {sess.averageHoldTime}ms</span>
                      <span>Flight: {sess.averageFlightTime}ms</span>
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
