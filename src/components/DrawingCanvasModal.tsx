import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getStroke } from 'perfect-freehand';
import type { Attachment } from '../types';
import { 
  PenTool, 
  Highlighter, 
  Eraser, 
  Square, 
  Circle as CircleIcon, 
  ArrowRight, 
  Minus, 
  Type, 
  RotateCcw, 
  RotateCw, 
  Trash2, 
  X, 
  Check, 
  Sparkles,
  Grid,
  FileText
} from 'lucide-react';

interface DrawingCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDrawing: (attachment: Attachment) => void;
}

type ToolMode = 'pen' | 'highlighter' | 'eraser' | 'rectangle' | 'circle' | 'arrow' | 'line' | 'text';
type PaperPattern = 'blank' | 'dots' | 'grid' | 'ruled';

const COLORS = [
  '#18181b', // Ink Black
  '#4f46e5', // Indigo
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Crimson
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ffffff'  // Pure White
];

const STROKE_SIZES = [
  { label: 'Fine', size: 3 },
  { label: 'Medium', size: 7 },
  { label: 'Bold', size: 16 }
];

interface Point {
  x: number;
  y: number;
  pressure?: number;
}

interface StrokeData {
  tool: ToolMode;
  color: string;
  size: number;
  points?: Point[];
  // For shape tools:
  start?: Point;
  end?: Point;
  text?: string;
}

// Convert stroke points polygon to SVG path string for high-precision canvas rendering
function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return '';
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q']
  );
  d.push('Z');
  return d.join(' ');
}

export const DrawingCanvasModal: React.FC<DrawingCanvasModalProps> = ({
  isOpen,
  onClose,
  onSaveDrawing
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<ToolMode>('pen');
  const [color, setColor] = useState('#4f46e5');
  const [strokeSize, setStrokeSize] = useState(7);
  const [paperPattern, setPaperPattern] = useState<PaperPattern>('blank');

  // History stack of drawn vector elements for full undo/redo fidelity
  const strokesRef = useRef<StrokeData[]>([]);
  const historyIndexRef = useRef<number>(-1);

  // Current active drawing stroke points
  const currentPointsRef = useRef<Point[]>([]);
  const isDrawingRef = useRef(false);
  const shapeStartRef = useRef<Point | null>(null);

  // Text input state
  const [textInputPos, setTextInputPos] = useState<{ x: number; y: number } | null>(null);
  const [textInputValue, setTextInputValue] = useState('');

  // Undo / redo state
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateHistoryState = () => {
    setCanUndo(historyIndexRef.current >= 0);
    setCanRedo(historyIndexRef.current < strokesRef.current.length - 1);
  };

  // Draw paper pattern background
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, pattern: PaperPattern) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (pattern === 'dots') {
      ctx.fillStyle = '#e2e8f0';
      const gap = 24;
      for (let x = gap; x < width; x += gap) {
        for (let y = gap; y < height; y += gap) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (pattern === 'grid') {
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      const gap = 24;
      ctx.beginPath();
      for (let x = gap; x < width; x += gap) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = gap; y < height; y += gap) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    } else if (pattern === 'ruled') {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      const lineGap = 30;
      ctx.beginPath();
      for (let y = lineGap * 1.5; y < height; y += lineGap) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    }
  }, []);

  // Render a single stroke element onto canvas
  const renderStrokeElement = useCallback((ctx: CanvasRenderingContext2D, s: StrokeData) => {
    ctx.save();

    if (s.tool === 'pen' || s.tool === 'highlighter' || s.tool === 'eraser') {
      if (!s.points || s.points.length === 0) {
        ctx.restore();
        return;
      }

      if (s.points.length === 1) {
        // Draw dot
        const p = s.points[0];
        ctx.fillStyle = s.tool === 'eraser' ? '#ffffff' : s.color;
        if (s.tool === 'highlighter') ctx.globalAlpha = 0.38;
        ctx.beginPath();
        ctx.arc(p.x, p.y, s.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
      }

      // Compute outline using perfect-freehand
      const isHighlighter = s.tool === 'highlighter';
      const outlinePoints = getStroke(
        s.points.map(pt => [pt.x, pt.y, pt.pressure ?? 0.5]),
        {
          size: s.size,
          thinning: isHighlighter ? 0.05 : 0.55,
          smoothing: 0.58,
          streamline: 0.52,
          simulatePressure: true,
          start: { taper: isHighlighter ? 0 : s.size * 0.7, cap: true },
          end: { taper: isHighlighter ? 0 : s.size * 0.7, cap: true }
        }
      );

      const pathData = getSvgPathFromStroke(outlinePoints);
      if (pathData) {
        const path = new Path2D(pathData);
        ctx.fillStyle = s.tool === 'eraser' ? '#ffffff' : s.color;
        if (isHighlighter) {
          ctx.globalAlpha = 0.36;
        }
        ctx.fill(path);
      }
    } else if (s.tool === 'rectangle' && s.start && s.end) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size;
      ctx.lineJoin = 'round';
      const x = Math.min(s.start.x, s.end.x);
      const y = Math.min(s.start.y, s.end.y);
      const w = Math.abs(s.end.x - s.start.x);
      const h = Math.abs(s.end.y - s.start.y);

      // Rounded rectangle
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.stroke();
    } else if (s.tool === 'circle' && s.start && s.end) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size;
      const rx = Math.abs(s.end.x - s.start.x) / 2;
      const ry = Math.abs(s.end.y - s.start.y) / 2;
      const cx = Math.min(s.start.x, s.end.x) + rx;
      const cy = Math.min(s.start.y, s.end.y) + ry;

      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (s.tool === 'arrow' && s.start && s.end) {
      ctx.strokeStyle = s.color;
      ctx.fillStyle = s.color;
      ctx.lineWidth = s.size;
      ctx.lineCap = 'round';

      // Line
      ctx.beginPath();
      ctx.moveTo(s.start.x, s.start.y);
      ctx.lineTo(s.end.x, s.end.y);
      ctx.stroke();

      // Arrowhead
      const angle = Math.atan2(s.end.y - s.start.y, s.end.x - s.start.x);
      const headLen = Math.max(14, s.size * 2.5);
      ctx.beginPath();
      ctx.moveTo(s.end.x, s.end.y);
      ctx.lineTo(
        s.end.x - headLen * Math.cos(angle - Math.PI / 6),
        s.end.y - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        s.end.x - headLen * Math.cos(angle + Math.PI / 6),
        s.end.y - headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    } else if (s.tool === 'line' && s.start && s.end) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s.start.x, s.start.y);
      ctx.lineTo(s.end.x, s.end.y);
      ctx.stroke();
    } else if (s.tool === 'text' && s.start && s.text) {
      ctx.fillStyle = s.color;
      ctx.font = `600 ${Math.max(14, s.size * 2.5)}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textBaseline = 'top';
      ctx.fillText(s.text, s.start.x, s.start.y);
    }

    ctx.restore();
  }, []);

  // Redraw entire canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawBackground(ctx, canvas.width, canvas.height, paperPattern);

    // Draw all completed strokes up to history index
    const activeStrokes = strokesRef.current.slice(0, historyIndexRef.current + 1);
    for (const s of activeStrokes) {
      renderStrokeElement(ctx, s);
    }
  }, [drawBackground, paperPattern, renderStrokeElement]);

  // Handle resizing and initial setup
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    redrawCanvas();
  }, [isOpen, redrawCanvas]);

  if (!isOpen) return null;

  const pushStroke = (stroke: StrokeData) => {
    const newStrokes = strokesRef.current.slice(0, historyIndexRef.current + 1);
    newStrokes.push(stroke);
    strokesRef.current = newStrokes;
    historyIndexRef.current = newStrokes.length - 1;
    redrawCanvas();
    updateHistoryState();
  };

  const handleUndo = () => {
    if (historyIndexRef.current < 0) return;
    historyIndexRef.current -= 1;
    redrawCanvas();
    updateHistoryState();
  };

  const handleRedo = () => {
    if (historyIndexRef.current >= strokesRef.current.length - 1) return;
    historyIndexRef.current += 1;
    redrawCanvas();
    updateHistoryState();
  };

  const handleClear = () => {
    strokesRef.current = [];
    historyIndexRef.current = -1;
    redrawCanvas();
    updateHistoryState();
  };

  // Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (textInputPos) {
      // Commit pending text
      commitText();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure !== 0.5 && e.pressure > 0 ? e.pressure : 0.5;

    if (tool === 'text') {
      setTextInputPos({ x, y });
      setTextInputValue('');
      return;
    }

    isDrawingRef.current = true;
    canvas.setPointerCapture(e.pointerId);

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      currentPointsRef.current = [{ x, y, pressure }];
    } else {
      shapeStartRef.current = { x, y };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure !== 0.5 && e.pressure > 0 ? e.pressure : 0.5;

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      currentPointsRef.current.push({ x, y, pressure });

      // Fast live redraw
      redrawCanvas();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        renderStrokeElement(ctx, {
          tool,
          color,
          size: strokeSize,
          points: currentPointsRef.current
        });
      }
    } else if (shapeStartRef.current) {
      redrawCanvas();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        renderStrokeElement(ctx, {
          tool,
          color,
          size: strokeSize,
          start: shapeStartRef.current,
          end: { x, y }
        });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    canvasRef.current?.releasePointerCapture(e.pointerId);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      if (currentPointsRef.current.length > 0) {
        pushStroke({
          tool,
          color,
          size: strokeSize,
          points: [...currentPointsRef.current]
        });
        currentPointsRef.current = [];
      }
    } else if (shapeStartRef.current) {
      pushStroke({
        tool,
        color,
        size: strokeSize,
        start: shapeStartRef.current,
        end: { x, y }
      });
      shapeStartRef.current = null;
    }
  };

  const commitText = () => {
    if (textInputPos && textInputValue.trim()) {
      pushStroke({
        tool: 'text',
        color,
        size: strokeSize,
        start: textInputPos,
        text: textInputValue.trim()
      });
    }
    setTextInputPos(null);
    setTextInputValue('');
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
            <span style={{ fontSize: '15px', fontWeight: 700 }}>Organic Hand Sketchpad</span>
            <span style={{ fontSize: '10px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
              Perfect-Freehand Engine
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Paper style selector */}
            <div className="sketch-tool-group" style={{ marginRight: '4px' }}>
              <button 
                type="button" 
                className={`sketch-tool-btn ${paperPattern === 'blank' ? 'active' : ''}`}
                onClick={() => { setPaperPattern('blank'); redrawCanvas(); }}
                title="Blank White Paper"
              >
                <FileText size={14} />
              </button>
              <button 
                type="button" 
                className={`sketch-tool-btn ${paperPattern === 'dots' ? 'active' : ''}`}
                onClick={() => { setPaperPattern('dots'); redrawCanvas(); }}
                title="Engineering Dot Grid"
              >
                <span style={{ fontSize: '11px', fontWeight: 700 }}>•••</span>
              </button>
              <button 
                type="button" 
                className={`sketch-tool-btn ${paperPattern === 'grid' ? 'active' : ''}`}
                onClick={() => { setPaperPattern('grid'); redrawCanvas(); }}
                title="Square Math Grid"
              >
                <Grid size={14} />
              </button>
            </div>

            {/* Undo / Redo */}
            <button 
              className="editor-icon-btn" 
              onClick={handleUndo} 
              disabled={!canUndo}
              title="Undo stroke"
            >
              <RotateCcw size={15} />
            </button>
            <button 
              className="editor-icon-btn" 
              onClick={handleRedo} 
              disabled={!canRedo}
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
          {/* Tool Modes: Pen, Highlighter, Eraser + Shapes */}
          <div className="sketch-tool-group">
            <button
              className={`sketch-tool-btn ${tool === 'pen' ? 'active' : ''}`}
              onClick={() => setTool('pen')}
              title="Calligraphic Pen (Pressure sensitive)"
            >
              <PenTool size={15} />
              <span>Pen</span>
            </button>
            <button
              className={`sketch-tool-btn ${tool === 'highlighter' ? 'active' : ''}`}
              onClick={() => setTool('highlighter')}
              title="Highlighter"
            >
              <Highlighter size={15} />
              <span>Marker</span>
            </button>
            <button
              className={`sketch-tool-btn ${tool === 'rectangle' ? 'active' : ''}`}
              onClick={() => setTool('rectangle')}
              title="Rectangle"
            >
              <Square size={15} />
            </button>
            <button
              className={`sketch-tool-btn ${tool === 'circle' ? 'active' : ''}`}
              onClick={() => setTool('circle')}
              title="Circle / Ellipse"
            >
              <CircleIcon size={15} />
            </button>
            <button
              className={`sketch-tool-btn ${tool === 'arrow' ? 'active' : ''}`}
              onClick={() => setTool('arrow')}
              title="Arrow"
            >
              <ArrowRight size={15} />
            </button>
            <button
              className={`sketch-tool-btn ${tool === 'line' ? 'active' : ''}`}
              onClick={() => setTool('line')}
              title="Straight Line"
            >
              <Minus size={15} />
            </button>
            <button
              className={`sketch-tool-btn ${tool === 'text' ? 'active' : ''}`}
              onClick={() => setTool('text')}
              title="Text Annotation"
            >
              <Type size={15} />
            </button>
            <button
              className={`sketch-tool-btn ${tool === 'eraser' ? 'active' : ''}`}
              onClick={() => setTool('eraser')}
              title="Eraser"
            >
              <Eraser size={15} />
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
                    width: `${s.size + 3}px`,
                    height: `${s.size + 3}px`,
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
        <div className="sketchpad-canvas-container" style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ touchAction: 'none', cursor: tool === 'text' ? 'text' : 'crosshair' }}
          />

          {/* Text Input Overlay */}
          {textInputPos && (
            <div
              style={{
                position: 'absolute',
                left: `${textInputPos.x}px`,
                top: `${textInputPos.y}px`,
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <input
                autoFocus
                type="text"
                value={textInputValue}
                onChange={(e) => setTextInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitText();
                  if (e.key === 'Escape') setTextInputPos(null);
                }}
                placeholder="Type note label..."
                style={{
                  padding: '4px 8px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: '2px solid var(--accent-primary)',
                  borderRadius: '6px',
                  color: color === '#ffffff' ? '#000000' : color,
                  fontSize: `${Math.max(14, strokeSize * 2)}px`,
                  fontWeight: 600,
                  outline: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              />
              <button
                type="button"
                className="btn-small-primary"
                onClick={commitText}
                style={{ padding: '4px 8px' }}
              >
                <Check size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
