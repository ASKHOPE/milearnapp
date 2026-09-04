import React, { useState, useEffect } from 'react';
import type { PomodoroMode } from '../types';
import { ambientAudio } from '../services/ambientAudio';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Timer, 
  Flame, 
  Coffee, 
  Sparkles,
  Volume2
} from 'lucide-react';
import { HourglassPomodoro } from './ui/HourglassPomodoro';

interface FocusPomodoroModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Expose active state to header
  onTimerTick?: (secondsLeft: number, isRunning: boolean, mode: PomodoroMode) => void;
}

export const FocusPomodoroModal: React.FC<FocusPomodoroModalProps> = ({
  isOpen,
  onClose,
  onTimerTick
}) => {
  const [mode, setMode] = useState<PomodoroMode>('work');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(() => {
    return parseInt(localStorage.getItem('noteflow_pomo_sessions') || '0', 10);
  });
  const [isChimeTesting, setIsChimeTesting] = useState(false);

  // Total duration in seconds for progress ring
  const totalSeconds = mode === 'work' ? 25 * 60 : mode === 'shortBreak' ? 5 * 60 : 15 * 60;

  // Sync ticker with parent for Header chip
  useEffect(() => {
    if (onTimerTick) {
      onTimerTick(secondsLeft, isRunning, mode);
    }
  }, [secondsLeft, isRunning, mode, onTimerTick]);

  // Main Timer Countdown
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Timer completed! Play rich synthesized audio chime
          ambientAudio.playCompletionChime();

          if (mode === 'work') {
            const nextCount = completedSessions + 1;
            setCompletedSessions(nextCount);
            localStorage.setItem('noteflow_pomo_sessions', nextCount.toString());

            // Check for long break
            if (nextCount % 4 === 0) {
              setMode('longBreak');
              return 15 * 60;
            } else {
              setMode('shortBreak');
              return 5 * 60;
            }
          } else {
            setMode('work');
            return 25 * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, mode, completedSessions]);

  // Mode change
  const handleSetMode = (newMode: PomodoroMode) => {
    setMode(newMode);
    setIsRunning(false);
    if (newMode === 'work') setSecondsLeft(25 * 60);
    else if (newMode === 'shortBreak') setSecondsLeft(5 * 60);
    else setSecondsLeft(15 * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (mode === 'work') setSecondsLeft(25 * 60);
    else if (mode === 'shortBreak') setSecondsLeft(5 * 60);
    else setSecondsLeft(15 * 60);
  };

  const handleSkip = () => {
    if (mode === 'work') handleSetMode('shortBreak');
    else handleSetMode('work');
  };

  const handleTestAudio = () => {
    setIsChimeTesting(true);
    ambientAudio.playCompletionChime();
    setTimeout(() => setIsChimeTesting(false), 1400);
  };

  // Format time MM:SS
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // SVG circular ring calculation
  const radius = 104;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = (secondsLeft / totalSeconds);
  const strokeDashoffset = circumference - (progressPercent * circumference);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Focus Pomodoro & Productivity Timer"
      subtitle="Interactive focus intervals with automatic completion audio chime"
      icon={<Timer size={20} color="var(--color-primary)" />}
      maxWidth={580}
    >
      <div className="pomo-timer-view" style={{ padding: '8px 0 16px' }}>
        {/* Mode Switcher */}
        <div className="pomo-mode-selector">
          <button
            type="button"
            className={`pomo-mode-pill ${mode === 'work' ? 'active' : ''}`}
            onClick={() => handleSetMode('work')}
          >
            <Flame size={14} />
            <span>Deep Focus (25m)</span>
          </button>
          <button
            type="button"
            className={`pomo-mode-pill ${mode === 'shortBreak' ? 'active' : ''}`}
            onClick={() => handleSetMode('shortBreak')}
          >
            <Coffee size={14} />
            <span>Short Break (5m)</span>
          </button>
          <button
            type="button"
            className={`pomo-mode-pill ${mode === 'longBreak' ? 'active' : ''}`}
            onClick={() => handleSetMode('longBreak')}
          >
            <Sparkles size={14} />
            <span>Long Break (15m)</span>
          </button>
        </div>

        {/* Animated Circular SVG Progress Timer */}
        <div className={`pomo-dial-container ${isRunning ? 'dial-running' : 'dial-idle'}`}>
          {/* Animated Glow Aura */}
          <div className={`pomo-dial-glow mode-${mode} ${isRunning ? 'active' : ''}`} />

          <svg className="pomo-dial-svg" width="260" height="260" viewBox="0 0 260 260">
            {/* Background Track */}
            <circle
              cx="130"
              cy="130"
              r={radius}
              className="pomo-track-bg"
              strokeWidth="12"
            />
            {/* Animated Progress Ring */}
            <circle
              cx="130"
              cy="130"
              r={radius}
              className={`pomo-track-progress mode-${mode} ${isRunning ? 'ticking' : ''}`}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 130 130)"
            />
          </svg>

          {/* Time readout in center */}
          <div className="pomo-dial-center">
            <HourglassPomodoro scale={0.65} isRunning={isRunning} className="pomo-hourglass-icon" />
            <span className={`pomo-time-display ${isRunning ? 'active-pulse' : ''}`}>{timeFormatted}</span>
            <span className="pomo-mode-tag">
              {mode === 'work' ? 'FOCUS INTERVAL' : 'REST & RECHARGE'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="pomo-controls">
          <Button
            variant="secondary"
            size="lg"
            onClick={handleReset}
            title="Reset Timer"
          >
            <RotateCcw size={18} />
          </Button>

          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsRunning(!isRunning)}
            leftIcon={isRunning ? <Pause size={20} /> : <Play size={20} />}
            style={{ 
              minWidth: '160px',
              boxShadow: isRunning ? '0 0 20px rgba(239, 68, 68, 0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {isRunning ? 'Pause Focus' : 'Start Focus'}
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={handleSkip}
            title="Skip Session"
          >
            <SkipForward size={18} />
          </Button>
        </div>

        {/* Session Progress Strip & Audio Completion Indicator */}
        <div className="pomo-session-stats" style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '360px', padding: '0 8px' }}>
            <div className="pomo-cycles-strip">
              {[0, 1, 2, 3].map((idx) => {
                const isCurrentCycle = (completedSessions % 4) > idx;
                return (
                  <div
                    key={idx}
                    className={`pomo-cycle-dot ${isCurrentCycle ? 'filled' : ''}`}
                    title={`Session ${idx + 1} of 4`}
                  />
                );
              })}
              <span className="pomo-sessions-label">
                {completedSessions} focus interval{completedSessions !== 1 ? 's' : ''} completed
              </span>
            </div>

            {/* Chime preview trigger */}
            <button
              type="button"
              className="btn-small-ghost"
              onClick={handleTestAudio}
              title="Test Completion Chime Audio"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                color: isChimeTesting ? '#10b981' : 'var(--text-muted)',
                padding: '4px 8px',
                borderRadius: '6px'
              }}
            >
              <Volume2 size={13} className={isChimeTesting ? 'pulse-icon' : ''} />
              <span>{isChimeTesting ? 'Playing Chime...' : 'Test Audio'}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
