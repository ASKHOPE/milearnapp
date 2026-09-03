import React, { useState, useRef, useCallback } from 'react';
import { 
  Columns2, 
  Rows, 
  ArrowLeftRight, 
  Maximize2, 
  X, 
  Minimize2, 
  GripVertical,
  GripHorizontal
} from 'lucide-react';

interface SplitWindowManagerProps {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
  leftTitle?: string;
  rightTitle?: string;
  onCloseSplit: () => void;
  onSwapPanes?: () => void;
}

export const SplitWindowManager: React.FC<SplitWindowManagerProps> = ({
  leftPane,
  rightPane,
  leftTitle = 'Left Note',
  rightTitle = 'Right Note',
  onCloseSplit,
  onSwapPanes
}) => {
  const [splitRatio, setSplitRatio] = useState<number>(50); // percentage 20 to 80
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [maximizedPane, setMaximizedPane] = useState<'left' | 'right' | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      if (orientation === 'vertical') {
        const x = moveEvent.clientX - rect.left;
        const pct = Math.max(20, Math.min(80, (x / rect.width) * 100));
        setSplitRatio(pct);
      } else {
        const y = moveEvent.clientY - rect.top;
        const pct = Math.max(20, Math.min(80, (y / rect.height) * 100));
        setSplitRatio(pct);
      }
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [orientation]);

  return (
    <div className="split-wm-root" ref={containerRef}>
      {/* Window Manager Control Bar */}
      <div className="split-wm-toolbar">
        <div className="wm-toolbar-left">
          <span className="wm-badge">🪟 Split Window Manager</span>
          <span className="wm-titles-preview">
            <strong>{leftTitle}</strong> ↔ <strong>{rightTitle}</strong>
          </span>
        </div>

        <div className="wm-toolbar-right">
          {/* Ratio Presets */}
          <div className="wm-ratio-buttons">
            <button
              type="button"
              className={`wm-ratio-btn ${splitRatio === 30 ? 'active' : ''}`}
              onClick={() => { setSplitRatio(30); setMaximizedPane(null); }}
              title="30% Left / 70% Right"
            >
              30:70
            </button>
            <button
              type="button"
              className={`wm-ratio-btn ${splitRatio === 50 && !maximizedPane ? 'active' : ''}`}
              onClick={() => { setSplitRatio(50); setMaximizedPane(null); }}
              title="Equal 50% / 50% Split"
            >
              50:50
            </button>
            <button
              type="button"
              className={`wm-ratio-btn ${splitRatio === 70 ? 'active' : ''}`}
              onClick={() => { setSplitRatio(70); setMaximizedPane(null); }}
              title="70% Left / 30% Right"
            >
              70:30
            </button>
          </div>

          <div className="wm-divider" />

          {/* Orientation Toggle: Vertical (Side-by-side) vs Horizontal (Stacked) */}
          <button
            type="button"
            className="wm-icon-btn"
            onClick={() => setOrientation(orientation === 'vertical' ? 'horizontal' : 'vertical')}
            title={orientation === 'vertical' ? 'Switch to Horizontal Stacked Split' : 'Switch to Side-by-Side Vertical Split'}
          >
            {orientation === 'vertical' ? <Rows size={14} /> : <Columns2 size={14} />}
          </button>

          {/* Swap Left & Right Panes */}
          {onSwapPanes && (
            <button
              type="button"
              className="wm-icon-btn"
              onClick={onSwapPanes}
              title="Swap Left and Right Notes"
            >
              <ArrowLeftRight size={14} />
            </button>
          )}

          {/* Maximize Toggle */}
          <button
            type="button"
            className="wm-icon-btn"
            onClick={() => {
              if (maximizedPane) {
                setMaximizedPane(null);
              } else {
                setMaximizedPane('left');
              }
            }}
            title={maximizedPane ? 'Restore Split View' : 'Maximize Left Note'}
          >
            {maximizedPane ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          <div className="wm-divider" />

          {/* Close Split View */}
          <button
            type="button"
            className="wm-icon-btn danger"
            onClick={onCloseSplit}
            title="Close Split View (Esc)"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Split Body Container */}
      <div 
        className={`split-wm-body ${orientation} ${isDragging ? 'resizing' : ''}`}
        style={{
          display: 'grid',
          gridTemplateColumns: maximizedPane === 'left' 
            ? '1fr' 
            : maximizedPane === 'right' 
            ? '0fr 0px 1fr'
            : orientation === 'vertical' 
            ? `${splitRatio}% 6px ${100 - splitRatio}%` 
            : '1fr',
          gridTemplateRows: orientation === 'horizontal' && !maximizedPane
            ? `${splitRatio}% 6px ${100 - splitRatio}%`
            : '1fr'
        }}
      >
        {/* Left / Top Pane */}
        {maximizedPane !== 'right' && (
          <div className="split-wm-pane left-pane">
            {leftPane}
          </div>
        )}

        {/* Draggable Divider Handle */}
        {!maximizedPane && (
          <div 
            className={`split-wm-divider-bar ${orientation}`}
            onMouseDown={handleMouseDown}
            onDoubleClick={() => setSplitRatio(50)}
            title="Drag to resize split view, double-click to reset 50/50"
          >
            <div className="divider-grip-indicator">
              {orientation === 'vertical' ? <GripVertical size={12} /> : <GripHorizontal size={12} />}
            </div>
          </div>
        )}

        {/* Right / Bottom Pane */}
        {maximizedPane !== 'left' && (
          <div className="split-wm-pane right-pane">
            {rightPane}
          </div>
        )}
      </div>
    </div>
  );
};
