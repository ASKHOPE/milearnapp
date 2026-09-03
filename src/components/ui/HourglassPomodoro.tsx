import React from 'react';

interface HourglassPomodoroProps {
  scale?: number;
  className?: string;
  isRunning?: boolean;
}

export const HourglassPomodoro: React.FC<HourglassPomodoroProps> = ({ 
  scale = 1, 
  className = '',
  isRunning = true 
}) => {
  return (
    <div 
      className={`hourglass-pomodoro-wrapper ${className} ${!isRunning ? 'paused' : ''}`}
      style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
    >
      <div className="hourglassBackground">
        <div className="hourglassContainer">
          <div className="hourglassCurves" />
          <div className="hourglassCapTop" />
          <div className="hourglassGlassTop" />
          <div className="hourglassSand" />
          <div className="hourglassSandStream" />
          <div className="hourglassCapBottom" />
          <div className="hourglassGlass" />
        </div>
      </div>
    </div>
  );
};
