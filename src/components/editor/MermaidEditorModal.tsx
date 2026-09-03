import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { 
  X, 
  Sparkles, 
  Check, 
  GitBranch, 
  Play, 
  RotateCcw, 
  Copy,
  AlertCircle
} from 'lucide-react';
import { scanTextToDiagram } from '../../services/textToDiagram';

interface MermaidEditorModalProps {
  isOpen: boolean;
  initialCode?: string;
  onClose: () => void;
  onSave: (chartCode: string) => void;
}

const TEMPLATES: { label: string; type: string; code: string }[] = [
  {
    label: 'Flowchart',
    type: 'flowchart',
    code: `graph TD\n  Start([Start]) --> Check{Is Valid?}\n  Check -- Yes --> Process[Execute Process]\n  Check -- No --> Fix[Resolve Errors] --> Check\n  Process --> End([Complete])`
  },
  {
    label: 'Sequence',
    type: 'sequence',
    code: `sequenceDiagram\n  autonumber\n  actor User\n  participant Client\n  participant Server\n  participant DB\n  User->>Client: Click Submit\n  Client->>Server: POST /api/data\n  Server->>DB: Query records\n  DB-->>Server: Return rows\n  Server-->>Client: 200 OK (JSON)\n  Client-->>User: Display Results`
  },
  {
    label: 'State Machine',
    type: 'state',
    code: `stateDiagram-v2\n  [*] --> Draft\n  Draft --> InReview: Submit for Review\n  InReview --> Approved: Pass Verification\n  InReview --> Rejected: Changes Required\n  Rejected --> Draft: Re-edit\n  Approved --> Published: Deploy\n  Published --> [*]`
  },
  {
    label: 'Mindmap',
    type: 'mindmap',
    code: `mindmap\n  root((MiLEARNAPP))\n    Study Hub\n      Flashcards\n      SM-2 Algorithm\n    Editor\n      Interactive Tables\n      Task Checklists\n      Mermaid Diagrams\n      Wrapped Images\n    Security\n      Zero-Knowledge Lock\n      Inactivity Timeout`
  },
  {
    label: 'Class Diagram',
    type: 'class',
    code: `classDiagram\n  class Note {\n    +String id\n    +String title\n    +String content\n    +List~String~ tags\n    +Boolean isFavorite\n    +save()\n    +encrypt()\n  }\n  class Book {\n    +String id\n    +String title\n    +String icon\n    +addChapter()\n  }\n  Book "1" *-- "many" Note : contains`
  },
  {
    label: 'Gantt Timeline',
    type: 'gantt',
    code: `gantt\n  title Project Sprint Roadmap\n  dateFormat YYYY-MM-DD\n  section Planning\n    Research & Ideation :done, 2026-09-01, 2026-09-03\n    Architecture Draft  :done, 2026-09-03, 2026-09-04\n  section Implementation\n    Editor Core         :active, 2026-09-04, 3d\n    Testing & Polish    :crit, 2d`
  }
];

export const MermaidEditorModal: React.FC<MermaidEditorModalProps> = ({
  isOpen,
  initialCode = '',
  onClose,
  onSave
}) => {
  const [code, setCode] = useState(initialCode || TEMPLATES[0].code);
  const [svgPreview, setSvgPreview] = useState<string>('');
  const [syntaxError, setSyntaxError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Scanner popover
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [inputTextToScan, setInputTextToScan] = useState('');
  const [scannerResultHint, setScannerResultHint] = useState<string | null>(null);

  const previewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialCode && initialCode.trim()) {
      setCode(initialCode.trim());
    } else {
      setCode(TEMPLATES[0].code);
    }
  }, [initialCode, isOpen]);

  // Real-time render
  useEffect(() => {
    let isMounted = true;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    async function compileMermaid() {
      if (!code.trim()) {
        setSvgPreview('');
        setSyntaxError(null);
        return;
      }

      try {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: isDark ? 'dark' : 'neutral',
          fontFamily: 'Inter, system-ui, sans-serif'
        });

        const id = `mermaid-modal-${Date.now().toString(36)}`;
        const { svg } = await mermaid.render(id, code.trim());
        if (isMounted) {
          setSvgPreview(svg);
          setSyntaxError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setSyntaxError(err?.message || 'Syntax error in Mermaid definition.');
        }
      }
    }

    const timer = setTimeout(compileMermaid, 150);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [code]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleApplyScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTextToScan.trim()) return;
    const result = scanTextToDiagram(inputTextToScan);
    setCode(result.chartCode);
    setScannerResultHint(result.explanation);
    setIsScannerOpen(false);
  };

  const handleSave = () => {
    onSave(code.trim());
    onClose();
  };

  return (
    <div className="mermaid-editor-overlay" onClick={onClose}>
      <div className="mermaid-editor-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mermaid-editor-header">
          <div className="modal-header-left">
            <GitBranch size={18} color="var(--accent-primary)" />
            <div>
              <h3 className="modal-title-text">Interactive Mermaid Diagram Studio</h3>
              <span className="modal-subtitle-text">Edit code, generate from natural language, or pick a template</span>
            </div>
          </div>

          <div className="modal-header-right">
            <button
              type="button"
              className={`btn-scan-text-toggle ${isScannerOpen ? 'active' : ''}`}
              onClick={() => setIsScannerOpen(!isScannerOpen)}
              title="Auto-scan natural language text or notes to generate a diagram"
            >
              <Sparkles size={14} color="#f59e0b" />
              <span>Generate from Text</span>
            </button>

            <button
              type="button"
              className="btn-modal-close"
              onClick={onClose}
              title="Close Diagram Studio (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Text-to-Diagram Scanner Drawer */}
        {isScannerOpen && (
          <div className="diagram-scanner-drawer">
            <form onSubmit={handleApplyScan} className="scanner-form">
              <div className="scanner-prompt-bar">
                <Sparkles size={16} color="#f59e0b" />
                <strong>Intelligent Pattern Scanner</strong>
                <span className="scanner-hint">Paste steps, arrows (A -&gt; B), workflows, or hierarchies:</span>
              </div>
              <textarea
                className="scanner-input-textarea"
                rows={3}
                placeholder="Example: User clicks login -> Server verifies credentials -> Redirect to dashboard"
                value={inputTextToScan}
                onChange={(e) => setInputTextToScan(e.target.value)}
                autoFocus
              />
              <div className="scanner-btn-row">
                <button
                  type="button"
                  className="btn-scanner-cancel"
                  onClick={() => setIsScannerOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-scanner-submit"
                  disabled={!inputTextToScan.trim()}
                >
                  <Play size={13} fill="#fff" /> Convert Text to Diagram
                </button>
              </div>
            </form>
          </div>
        )}

        {scannerResultHint && (
          <div className="scanner-result-banner">
            <Sparkles size={14} color="var(--accent-primary)" />
            <span>{scannerResultHint}</span>
            <button type="button" onClick={() => setScannerResultHint(null)}>×</button>
          </div>
        )}

        {/* Template Gallery Bar */}
        <div className="diagram-template-strip">
          <span className="template-strip-label">Templates:</span>
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.label}
              type="button"
              className="btn-template-chip"
              onClick={() => setCode(tmpl.code)}
              title={`Switch to ${tmpl.label} starter`}
            >
              {tmpl.label}
            </button>
          ))}
          <button
            type="button"
            className="btn-copy-code"
            onClick={handleCopyCode}
            title="Copy current Mermaid syntax"
          >
            {isCopied ? <Check size={13} color="var(--color-success)" /> : <Copy size={13} />}
            <span>{isCopied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        {/* 2-Pane Editor Body: Left Code, Right Live Preview */}
        <div className="mermaid-studio-body">
          {/* Left Pane: Code Editor */}
          <div className="studio-editor-pane">
            <div className="studio-pane-header">
              <span>Mermaid Definition</span>
              <span className="syntax-status-indicator">
                {syntaxError ? (
                  <span className="status-error"><AlertCircle size={12} /> Syntax Error</span>
                ) : (
                  <span className="status-valid"><Check size={12} /> Valid Syntax</span>
                )}
              </span>
            </div>
            <textarea
              className="studio-code-textarea"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Type or paste Mermaid code here..."
              spellCheck={false}
            />
            {syntaxError && (
              <div className="studio-syntax-error-box">
                <AlertCircle size={14} color="#ef4444" />
                <span>{syntaxError}</span>
              </div>
            )}
          </div>

          {/* Right Pane: Real-Time Render Preview */}
          <div className="studio-preview-pane">
            <div className="studio-pane-header">
              <span>Live Vector Preview</span>
            </div>
            <div className="studio-preview-viewport" ref={previewContainerRef}>
              {svgPreview ? (
                <div 
                  className="studio-svg-rendered" 
                  dangerouslySetInnerHTML={{ __html: svgPreview }} 
                />
              ) : (
                <div className="studio-empty-preview">
                  <span>Enter valid Mermaid code on the left to render diagram preview</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mermaid-editor-footer">
          <div className="studio-footer-left">
            <button
              type="button"
              className="btn-footer-reset"
              onClick={() => setCode(TEMPLATES[0].code)}
              title="Reset to default Flowchart"
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>

          <div className="studio-footer-right">
            <button
              type="button"
              className="btn-footer-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-footer-save"
              onClick={handleSave}
              disabled={Boolean(syntaxError) || !code.trim()}
            >
              <Check size={14} /> Insert / Save Diagram
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
