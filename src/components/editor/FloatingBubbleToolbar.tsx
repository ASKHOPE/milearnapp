import React, { useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code, 
  Highlighter, 
  Link, 
  Superscript, 
  Subscript, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Palette,
  Sparkles,
  Bookmark,
  Quote,
  SplitSquareVertical
} from 'lucide-react';

export interface FloatingBubblePosition {
  top: number;
  left: number;
  visible: boolean;
}

interface FloatingBubbleToolbarProps {
  position: FloatingBubblePosition;
  onApplyFormat: (formatType: string, value?: string) => void;
  onClose: () => void;
  onCreateFlashcard?: () => void;
}

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', bg: '#fef08a', color: '#854d0e', code: 'yellow' },
  { name: 'Green', bg: '#bbf7d0', color: '#166534', code: 'green' },
  { name: 'Cyan', bg: '#a5f3fc', color: '#155e75', code: 'cyan' },
  { name: 'Pink', bg: '#fbcfe8', color: '#9d174d', code: 'pink' },
  { name: 'Purple', bg: '#e9d5ff', color: '#6b21a8', code: 'purple' },
  { name: 'Orange', bg: '#fed7aa', color: '#9a3412', code: 'orange' },
];

const TEXT_COLORS = [
  { name: 'Default', hex: 'inherit' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Sky', hex: '#0284c7' },
  { name: 'Violet', hex: '#8b5cf6' },
];

export const FloatingBubbleToolbar: React.FC<FloatingBubbleToolbarProps> = ({
  position,
  onApplyFormat,
  onClose: _onClose,
  onCreateFlashcard
}) => {
  const [activeMenu, setActiveMenu] = useState<'main' | 'highlight' | 'color' | 'align'>('main');

  if (!position.visible) return null;

  return (
    <div
      className="editor-floating-bubble-toolbar"
      style={{
        position: 'fixed',
        top: `${Math.max(60, position.top - 48)}px`,
        left: `${Math.min(window.innerWidth - 500, Math.max(20, position.left))}px`,
        zIndex: 9999
      }}
      onMouseDown={(e) => {
        // Prevent selection loss when clicking buttons
        e.preventDefault();
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {activeMenu === 'main' && (
        <div className="bubble-btn-group">
          {/* Bold */}
          <button
            type="button"
            className="bubble-btn"
            onClick={() => onApplyFormat('bold')}
            title="Bold (**text**)"
          >
            <Bold size={13} strokeWidth={2.5} />
          </button>

          {/* Italic */}
          <button
            type="button"
            className="bubble-btn"
            onClick={() => onApplyFormat('italic')}
            title="Italic (*text*)"
          >
            <Italic size={13} />
          </button>

          {/* Strikethrough (SunEditor / Froala) */}
          <button
            type="button"
            className="bubble-btn"
            onClick={() => onApplyFormat('strikethrough')}
            title="Strikethrough (~~text~~)"
          >
            <Strikethrough size={13} />
          </button>

          {/* Underline */}
          <button
            type="button"
            className="bubble-btn"
            onClick={() => onApplyFormat('underline')}
            title="Underline (<u>text</u>)"
          >
            <Underline size={13} />
          </button>

          {/* Inline Code (Quill / Editor.js) */}
          <button
            type="button"
            className="bubble-btn"
            onClick={() => onApplyFormat('code')}
            title="Inline Code (`code`)"
          >
            <Code size={13} />
          </button>

          <div className="bubble-divider" />

          {/* Text Highlight (SunEditor / RoosterJS) */}
          <button
            type="button"
            className="bubble-btn highlight-trigger"
            onClick={() => setActiveMenu('highlight')}
            title="Highlight Marker (<mark>)"
          >
            <Highlighter size={13} color="#f59e0b" />
          </button>

          {/* Text Color Picker */}
          <button
            type="button"
            className="bubble-btn"
            onClick={() => setActiveMenu('color')}
            title="Font Color"
          >
            <Palette size={13} color="#6366f1" />
          </button>

          {/* Superscript & Subscript (SunEditor) */}
          <button
            type="button"
            className="bubble-btn"
            onClick={() => onApplyFormat('superscript')}
            title="Superscript (<sup>x</sup>)"
          >
            <Superscript size={13} />
          </button>
          <button
            type="button"
            className="bubble-btn"
            onClick={() => onApplyFormat('subscript')}
            title="Subscript (<sub>x</sub>)"
          >
            <Subscript size={13} />
          </button>

          <div className="bubble-divider" />

          {/* Instant Flashcard Creator */}
          <button
            type="button"
            className="bubble-btn"
            onClick={() => {
              if (onCreateFlashcard) {
                onCreateFlashcard();
              } else {
                onApplyFormat('flashcard');
              }
            }}
            title="Turn Selection into Flashcard (SM-2 Study Deck)"
          >
            <Sparkles size={13} color="#ec4899" />
          </button>

          {/* Instant Wikilink */}
          <button
            type="button"
            className="bubble-btn"
            onClick={() => onApplyFormat('wikilink')}
            title="Convert to Wikilink [[Selection]]"
          >
            <Bookmark size={13} color="#0ea5e9" />
          </button>

          {/* Instant Cloze Deletion */}
          <button
            type="button"
            className="bubble-btn"
            onClick={() => onApplyFormat('cloze')}
            title="Cloze Deletion Recall (==text==)"
          >
            <SplitSquareVertical size={13} color="#10b981" />
          </button>

          {/* Blockquote / Callout */}
          <button
            type="button"
            className="bubble-btn"
            onClick={() => onApplyFormat('quote')}
            title="Callout / Quote (> text)"
          >
            <Quote size={13} />
          </button>

          <div className="bubble-divider" />

          {/* Convert to Link */}
          <button
            type="button"
            className="bubble-btn"
            onClick={() => onApplyFormat('link')}
            title="Turn into Link [text](url)"
          >
            <Link size={13} />
          </button>

          {/* Keyboard Key tag <kbd> */}
          <button
            type="button"
            className="bubble-btn"
            onClick={() => onApplyFormat('kbd')}
            title="Keyboard Key (<kbd>Key</kbd>)"
          >
            <span style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'monospace' }}>KBD</span>
          </button>

          {/* Align Menu */}
          <button
            type="button"
            className="bubble-btn"
            onClick={() => setActiveMenu('align')}
            title="Text Alignment"
          >
            <AlignCenter size={13} />
          </button>
        </div>
      )}

      {/* Highlighter Submenu */}
      {activeMenu === 'highlight' && (
        <div className="bubble-palette-menu">
          <span className="bubble-palette-title">Highlight:</span>
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.code}
              type="button"
              className="bubble-color-swatch"
              style={{ backgroundColor: c.bg, borderColor: c.color }}
              onClick={() => {
                onApplyFormat('highlight', c.bg);
                setActiveMenu('main');
              }}
              title={`${c.name} Highlight`}
            />
          ))}
          <button
            type="button"
            className="bubble-btn-sub-back"
            onClick={() => setActiveMenu('main')}
          >
            Back
          </button>
        </div>
      )}

      {/* Color Submenu */}
      {activeMenu === 'color' && (
        <div className="bubble-palette-menu">
          <span className="bubble-palette-title">Font Color:</span>
          {TEXT_COLORS.map((c) => (
            <button
              key={c.name}
              type="button"
              className="bubble-color-swatch"
              style={{ backgroundColor: c.hex === 'inherit' ? 'var(--text-primary)' : c.hex }}
              onClick={() => {
                onApplyFormat('color', c.hex);
                setActiveMenu('main');
              }}
              title={c.name}
            />
          ))}
          <button
            type="button"
            className="bubble-btn-sub-back"
            onClick={() => setActiveMenu('main')}
          >
            Back
          </button>
        </div>
      )}

      {/* Alignment Submenu */}
      {activeMenu === 'align' && (
        <div className="bubble-palette-menu">
          <button
            type="button"
            className="bubble-btn"
            onClick={() => {
              onApplyFormat('align-left');
              setActiveMenu('main');
            }}
            title="Align Left"
          >
            <AlignLeft size={13} />
          </button>
          <button
            type="button"
            className="bubble-btn"
            onClick={() => {
              onApplyFormat('align-center');
              setActiveMenu('main');
            }}
            title="Align Center"
          >
            <AlignCenter size={13} />
          </button>
          <button
            type="button"
            className="bubble-btn"
            onClick={() => {
              onApplyFormat('align-right');
              setActiveMenu('main');
            }}
            title="Align Right"
          >
            <AlignRight size={13} />
          </button>
          <button
            type="button"
            className="bubble-btn-sub-back"
            onClick={() => setActiveMenu('main')}
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
};
