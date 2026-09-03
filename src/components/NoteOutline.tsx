import React, { useState, useEffect, useRef } from 'react';
import { ListTree, X, GripVertical, ChevronDown, ChevronUp, Hash, Eye } from 'lucide-react';

interface HeadingItem {
  id: string;
  text: string;
  level: number;
  lineIndex: number;
  previewSnippet: string;
  wordCount: number;
}

interface NoteOutlineProps {
  content: string;
  isOpen: boolean;
  onClose: () => void;
  onScrollToHeading: (lineIndex: number) => void;
}

export const NoteOutline: React.FC<NoteOutlineProps> = ({
  content,
  isOpen,
  onClose,
  onScrollToHeading
}) => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [hoveredHeadingId, setHoveredHeadingId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Initialize position to top-right of the viewport
  useEffect(() => {
    if (isOpen && !position) {
      const defaultX = Math.max(window.innerWidth - 330, 20);
      const defaultY = 120;
      setPosition({ x: defaultX, y: defaultY });
    }
  }, [isOpen, position]);

  // Handle Dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = Math.min(Math.max(10, e.clientX - dragOffset.x), window.innerWidth - 320);
      const newY = Math.min(Math.max(60, e.clientY - dragOffset.y), window.innerHeight - 100);
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  if (!isOpen || !position) return null;

  // Extract headings with preview snippets and word count
  const headings: HeadingItem[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    let level = 0;
    let text = '';
    if (line.startsWith('# ')) {
      level = 1;
      text = line.slice(2).trim();
    } else if (line.startsWith('## ')) {
      level = 2;
      text = line.slice(3).trim();
    } else if (line.startsWith('### ')) {
      level = 3;
      text = line.slice(4).trim();
    }

    if (level > 0 && text) {
      // Look ahead up to 4 lines for section preview
      const nextLines = lines.slice(index + 1, index + 5)
        .filter((l) => !l.startsWith('#') && l.trim())
        .map((l) => l.replace(/^[->*#|]+\s*/, '').trim());
      const previewSnippet = nextLines.join(' ').slice(0, 140) || 'No introductory text in this section.';
      
      // Calculate section words until next heading
      let sectionWords = 0;
      for (let i = index + 1; i < lines.length; i++) {
        if (lines[i].startsWith('#')) break;
        sectionWords += lines[i].split(/\s+/).filter(Boolean).length;
      }

      headings.push({
        id: `h${level}-${index}`,
        text,
        level,
        lineIndex: index,
        previewSnippet,
        wordCount: sectionWords
      });
    }
  });

  return (
    <div
      ref={panelRef}
      className={`floating-draggable-toc ${isDragging ? 'dragging' : ''} ${isMinimized ? 'minimized' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      {/* Draggable Header */}
      <div 
        className="toc-drag-header" 
        onMouseDown={handleMouseDown}
        title="Drag anywhere to reposition Table of Contents"
      >
        <div className="toc-header-left">
          <GripVertical size={13} className="toc-grip-handle" />
          <ListTree size={14} color="var(--accent-primary)" />
          <span className="toc-title">Table of Contents</span>
          <span className="toc-count-pill">{headings.length}</span>
        </div>

        <div className="toc-header-controls">
          <button
            type="button"
            className="toc-icon-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand Outline' : 'Minimize Outline'}
          >
            {isMinimized ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
          <button
            type="button"
            className="toc-icon-btn danger"
            onClick={onClose}
            title="Close Table of Contents"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Body: List of Headings with Rich Hover Disclosure */}
      {!isMinimized && (
        <div className="toc-body-content">
          {headings.length === 0 ? (
            <div className="toc-empty-notice">
              <Hash size={20} color="var(--text-muted)" style={{ opacity: 0.6, marginBottom: '6px' }} />
              <p>No headings detected.</p>
              <span>Use # H1, ## H2, or ### H3 to structure this document.</span>
            </div>
          ) : (
            <div className="toc-headings-list">
              {headings.map((item) => (
                <div
                  key={item.id}
                  className="toc-heading-card-wrap"
                  onMouseEnter={() => setHoveredHeadingId(item.id)}
                  onMouseLeave={() => setHoveredHeadingId(null)}
                >
                  <button
                    type="button"
                    className={`toc-heading-row level-${item.level} ${hoveredHeadingId === item.id ? 'hovered' : ''}`}
                    style={{ paddingLeft: `${(item.level - 1) * 12 + 10}px` }}
                    onClick={() => onScrollToHeading(item.lineIndex)}
                  >
                    <span className={`toc-tag-badge h${item.level}`}>
                      H{item.level}
                    </span>
                    <span className="toc-heading-title">{item.text}</span>
                    <span className="toc-words-meta">
                      {item.wordCount > 0 ? `${item.wordCount}w` : ''}
                    </span>
                  </button>

                  {/* Rich Explanatory Hover Preview Card */}
                  {hoveredHeadingId === item.id && (
                    <div className="toc-hover-tooltip" style={{ left: `${position.x < 350 ? '102%' : '-250px'}` }}>
                      <div className="toc-tooltip-header">
                        <span className={`toc-tag-badge h${item.level}`}>H{item.level}</span>
                        <strong className="toc-tooltip-title">{item.text}</strong>
                      </div>
                      <p className="toc-tooltip-snippet">{item.previewSnippet}</p>
                      <div className="toc-tooltip-footer">
                        <span>~{item.wordCount} words</span>
                        <span className="toc-jump-hint"><Eye size={10} /> Click to scroll</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
