import React, { useState, useEffect } from 'react';
import type { PomodoroMode, AmbientSoundTrack } from '../types';
import { ambientAudio, type AmbientType } from '../services/ambientAudio';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Tabs } from './ui/Tabs';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Timer, 
  Flame, 
  Coffee, 
  Sparkles
} from 'lucide-react';

interface FocusPomodoroModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Expose active state to header
  onTimerTick?: (secondsLeft: number, isRunning: boolean, mode: PomodoroMode) => void;
}

const DEFAULT_TRACKS: AmbientSoundTrack[] = [
  { id: 'rain', name: 'Gentle Rain', icon: '🌧️', isPlaying: false, volume: 0.6 },
  { id: 'waves', name: 'Ocean Swell', icon: '🌊', isPlaying: false, volume: 0.5 },
  { id: 'fireplace', name: 'Fireplace Crackle', icon: '🔥', isPlaying: false, volume: 0.4 },
  { id: 'binaural', name: 'Alpha Focus Beats', icon: '🎧', isPlaying: false, volume: 0.4 },
  { id: 'brownNoise', name: 'Brown Noise', icon: '📻', isPlaying: false, volume: 0.5 }
];

export const FocusPomodoroModal: React.FC<FocusPomodoroModalProps> = ({
  isOpen,
  onClose,
  onTimerTick
}) => {
  const [activeTab, setActiveTab] = useState<'timer' | 'ambient'>('timer');
  const [mode, setMode] = useState<PomodoroMode>('work');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(() => {
    return parseInt(localStorage.getItem('noteflow_pomo_sessions') || '0', 10);
  });
  const [tracks, setTracks] = useState<AmbientSoundTrack[]>(DEFAULT_TRACKS);
  const [masterMuted, setMasterMuted] = useState(false);

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
          // Timer completed!
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

  // Toggle ambient audio track
  const handleToggleTrack = (trackId: AmbientType) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const nextPlaying = !t.isPlaying;
          ambientAudio.setTrackState(trackId, nextPlaying, t.volume);
          return { ...t, isPlaying: nextPlaying };
        }
        return t;
      })
    );
  };

  // Change track volume
  const handleTrackVolume = (trackId: AmbientType, val: number) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          ambientAudio.setTrackVolume(trackId, val);
          return { ...t, volume: val };
        }
        return t;
      })
    );
  };

  const handleToggleMasterMute = () => {
    const nextMuted = !masterMuted;
    setMasterMuted(nextMuted);
    ambientAudio.setMasterVolume(nextMuted ? 0 : 0.8);
  };

  // Format time MM:SS
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // SVG circular ring calculation
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = (secondsLeft / totalSeconds);
  const strokeDashoffset = circumference - (progressPercent * circumference);

  const activeSoundCount = tracks.filter((t) => t.isPlaying).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Focus Pomodoro & Ambient Sound"
      subtitle="Deep work intervals with procedural soundscapes"
      icon={<Timer size={20} color="var(--color-primary)" />}
      maxWidth={620}
    >
      {/* Top Segmented Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
        tabs={[
          { id: 'timer', label: 'Pomodoro Timer', icon: <Timer size={15} /> },
          { 
            id: 'ambient', 
            label: 'Sound Mixer', 
            icon: <Sliders size={15} />,
            badge: activeSoundCount > 0 ? <Badge variant="primary" dot>{activeSoundCount}</Badge> : undefined
          }
        ]}
      />

      {activeTab === 'timer' ? (
        <div className="pomo-timer-view">
          {/* Mode Switcher */}
          <div className="pomo-mode-selector">
            <button
              className={`pomo-mode-pill ${mode === 'work' ? 'active' : ''}`}
              onClick={() => handleSetMode('work')}
            >
              <Flame size={14} />
              <span>Deep Focus (25m)</span>
            </button>
            <button
              className={`pomo-mode-pill ${mode === 'shortBreak' ? 'active' : ''}`}
              onClick={() => handleSetMode('shortBreak')}
            >
              <Coffee size={14} />
              <span>Short Break (5m)</span>
            </button>
            <button
              className={`pomo-mode-pill ${mode === 'longBreak' ? 'active' : ''}`}
              onClick={() => handleSetMode('longBreak')}
            >
              <Sparkles size={14} />
              <span>Long Break (15m)</span>
            </button>
          </div>

          {/* Animated Circular SVG Progress Timer */}
          <div className="pomo-dial-container">
            <svg className="pomo-dial-svg" width="240" height="240" viewBox="0 0 240 240">
              {/* Background Track */}
              <circle
                cx="120"
                cy="120"
                r={radius}
                className="pomo-track-bg"
                strokeWidth="10"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="120"
                cy="120"
                r={radius}
                className={`pomo-track-progress mode-${mode}`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 120 120)"
              />
            </svg>

            {/* Time readout in center */}
            <div className="pomo-dial-center">
              <span className="pomo-time-display">{timeFormatted}</span>
              <span className="pomo-mode-tag">
                {mode === 'work' ? 'FOCUS TIME' : 'REST & RECHARGE'}
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
              style={{ minWidth: '150px' }}
            >
              {isRunning ? 'Pause' : 'Start Focus'}
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

          {/* Session Progress Stats */}
          <div className="pomo-session-stats">
            <div className="pomo-cycles-strip">
              {[0, 1, 2, 3].map((idx) => {
                const isDone = (completedSessions % 4) > idx || completedSessions >= 4;
                return (
                  <span 
                    key={idx} 
                    className={`pomo-cycle-dot ${isDone ? 'done' : ''}`}
                    title={`Session ${idx + 1}`}
                  />
                );
              })}
            </div>
            <span className="pomo-stat-label">
              <strong>{completedSessions}</strong> Pomodoro session{completedSessions !== 1 ? 's' : ''} completed today ({completedSessions * 25} mins)
            </span>
          </div>
        </div>
      ) : (
        /* Ambient Audio Mixer View */
        <div className="pomo-ambient-view">
          <div className="ambient-header-row">
            <div>
              <h4 className="ambient-title">Procedural Soundscape Mixer</h4>
              <p className="ambient-sub">Mix multiple sounds synthesized 100% in your browser.</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleMasterMute}
              leftIcon={masterMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            >
              {masterMuted ? 'Unmute All' : 'Mute Master'}
            </Button>
          </div>

          <div className="ambient-tracks-list">
            {tracks.map((track) => (
              <div 
                key={track.id} 
                className={`ambient-track-card ${track.isPlaying ? 'active' : ''}`}
              >
                <div className="ambient-track-left">
                  <button
                    type="button"
                    className={`ambient-toggle-btn ${track.isPlaying ? 'playing' : ''}`}
                    onClick={() => handleToggleTrack(track.id)}
                    title={track.isPlaying ? 'Pause sound' : 'Play sound'}
                  >
                    <span className="track-emoji">{track.icon}</span>
                  </button>
                  <div>
                    <span className="track-name">{track.name}</span>
                    <span className="track-status">
                      {track.isPlaying ? 'Playing' : 'Paused'}
                    </span>
                  </div>
                </div>

                <div className="ambient-track-right">
                  <Volume2 size={14} className="slider-vol-icon" />
                  <input
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.05"
                    value={track.volume}
                    disabled={!track.isPlaying}
                    onChange={(e) => handleTrackVolume(track.id, parseFloat(e.target.value))}
                    className="ambient-slider"
                  />
                  <span className="vol-percent">{Math.round(track.volume * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};
