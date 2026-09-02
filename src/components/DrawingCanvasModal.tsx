import React, { useState, useRef, useEffect } from 'react';
import type { Attachment } from '../types';
import { 
  PenTool, 
  Highlighter, 
  Eraser, 
  RotateCcw, 
  RotateCw, 
  Trash2, 
  X, 
  Check, 
  Sparkles 
} from 'lucide-react';

interface DrawingCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDrawing: (attachment: Attachment) => void;
}

type ToolMode = 'pen' | 'highlighter' | 'eraser';

const COLORS = [
  '#18181b', // Ink Black
  '#4f46e5', // Indigo
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Crimson
  '#8b5cf6', // Purple
  '#ffffff'  // Pure White
];

const STROKE_SIZES = [
  { label: 'Fine', size: 2 },
  { label: 'Medium', size: 6 },
  { label: 'Bold', size: 14 }
];

export const DrawingCanvasModal: React.FC<DrawingCanvasModalProps> = ({
  isOpen,
  onClose,
  onSaveDrawing
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<ToolMode>('pen');
  const [color, setColor] = useState('#4f46e5');
  const [strokeSize, setStrokeSize] = useState(6);

  // Undo / Redo history stack
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initial white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save initial state to history
    historyRef.current = [canvas.toDataURL()];
    historyIndexRef.current = 0;
  }, [isOpen]);

  if (!isOpen) return null;

  const pushHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL();
    // Trim future history if branching after undo
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(url);
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
  };

  const handleUndo = () => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    restoreHistory(historyRef.current[historyIndexRef.current]);
  };

  const handleRedo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    restoreHistory(historyRef.current[historyIndexRef.current]);
  };

  const restoreHistory = (dataUrl: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    pushHistory();
  };

  // Pointer event handlers (smooth drawing for touch, Apple Pencil, and mouse)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawingRef.current = true;
    lastPointRef.current = { x, y };

    // Set pointer capture for smooth strokes
    canvas.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen') {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeSize;
      ctx.globalAlpha = 1.0;
    } else if (tool === 'highlighter') {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeSize * 2.5;
      ctx.globalAlpha = 0.35;
    } else if (tool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = strokeSize * 3;
      ctx.globalAlpha = 1.0;
    }

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();

    lastPointRef.current = { x, y };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;
    canvasRef.current?.releasePointerCapture(e.pointerId);
    pushHistory();
  };

  // Save drawing as attachment into note
  const handleSaveToNote = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');

    const attachment: Attachment = {
      id: 'sketch-' + Math.random().toString(36).substr(2, 9),
      name: `Hand-Sketch-${timestamp}.png`,
      type: 'image',
      size: Math.round(dataUrl.length * 0.75),
      mimeType: 'image/png',
      dataUrl,
      createdAt: new Date().toISOString()
    };

    onSaveDrawing(attachment);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card sketchpad-modal" onClick={(e) => e.stopPropagation()}>
        {/* Sketchpad Header Toolbar */}
        <div className="sketchpad-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--accent-primary)" />
            <span style={{ fontSize: '15px', fontWeight: 700 }}>Hand Sketchpad & Drawing</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Undo / Redo */}
            <button 
              className="editor-icon-btn" 
              onClick={handleUndo} 
              disabled={historyIndexRef.current <= 0}
              title="Undo stroke"
            >
              <RotateCcw size={15} />
            </button>
            <button 
              className="editor-icon-btn" 
              onClick={handleRedo} 
              disabled={historyIndexRef.current >= historyRef.current.length - 1}
              title="Redo stroke"
            >
              <RotateCw size={15} />
            </button>
            <button className="editor-icon-btn" onClick={handleClear} title="Clear canvas">
              <Trash2 size={15} />
            </button>

            <button 
              className="btn-new-note"
              onClick={handleSaveToNote}
              style={{ padding: '6px 14px', fontSize: '12px' }}
              title="Attach this drawing to the active note"
            >
              <Check size={14} />
              <span>Attach to Note</span>
            </button>

            <button className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tools & Palette Bar */}
        <div className="sketchpad-tools-bar">
          {/* Tool Modes */}
          <div className="sketch-tool-group">
            <button
              className={`sketch-tool-btn ${tool === 'pen' ? 'active' : ''}`}
              onClick={() => setTool('pen')}
              title="Pen"
            >
              <PenTool size={15} />
              <span>Pen</span>
            </button>
            <button
              className={`sketch-tool-btn ${tool === 'highlighter' ? 'active' : ''}`}
              onClick={() => setTool('highlighter')}
              title="Highlighter (Semi-transparent)"
            >
              <Highlighter size={15} />
              <span>Highlighter</span>
            </button>
            <button
              className={`sketch-tool-btn ${tool === 'eraser' ? 'active' : ''}`}
              onClick={() => setTool('eraser')}
              title="Eraser"
            >
              <Eraser size={15} />
              <span>Eraser</span>
            </button>
          </div>

          <div className="toolbar-divider" />

          {/* Stroke Widths */}
          <div className="sketch-tool-group">
            {STROKE_SIZES.map((s) => (
              <button
                key={s.label}
                className={`sketch-tool-btn ${strokeSize === s.size ? 'active' : ''}`}
                onClick={() => setStrokeSize(s.size)}
                title={`${s.label} Stroke`}
              >
                <span 
                  style={{
                    display: 'inline-block',
                    width: `${s.size + 4}px`,
                    height: `${s.size + 4}px`,
                    borderRadius: '50%',
                    backgroundColor: 'currentColor'
                  }} 
                />
              </button>
            ))}
          </div>

          <div className="toolbar-divider" />

          {/* Color Palette */}
          <div className="sketch-palette">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`sketch-color-dot ${color === c && tool !== 'eraser' ? 'selected' : ''}`}
                style={{ backgroundColor: c, border: c === '#ffffff' ? '1px solid #d1d5db' : 'none' }}
                onClick={() => {
                  setColor(c);
                  if (tool === 'eraser') setTool('pen');
                }}
                title={`Select color ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Canvas Workspace */}
        <div className="sketchpad-canvas-container">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ touchAction: 'none' }}
          />
        </div>
      </div>
    </div>
  );
};
