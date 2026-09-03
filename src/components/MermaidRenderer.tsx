import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Copy, Check, Maximize2, AlertCircle, Edit2 } from 'lucide-react';
import { Modal } from './ui/Modal';
import { MermaidEditorModal } from './editor/MermaidEditorModal';

interface MermaidRendererProps {
  chart: string;
  id: string;
  onEditChart?: (newChart: string) => void;
}

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({ chart, id, onEditChart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function renderChart() {
      if (!chart.trim()) return;

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

      try {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: isDark ? 'dark' : 'neutral',
          fontFamily: 'Inter, system-ui, sans-serif'
        });

        // Clean unique ID without special characters
        const cleanId = `mermaid-${id.replace(/[^a-zA-Z0-9_-]/g, '')}-${Date.now().toString(36)}`;
        const { svg } = await mermaid.render(cleanId, chart.trim());

        if (isMounted) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to render diagram syntax.');
        }
      }
    }

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart, id]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(chart);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      <div className="mermaid-card">
        {/* Header Bar */}
        <div className="mermaid-header">
          <span className="mermaid-tag">📊 Mermaid Diagram</span>
          <div className="mermaid-actions">
            {onEditChart && (
              <button
                type="button"
                className="btn-mermaid-action"
                onClick={() => setIsEditorOpen(true)}
                title="Edit Diagram Code and Visuals"
              >
                <Edit2 size={13} color="var(--accent-primary)" />
                <span>Edit Diagram</span>
              </button>
            )}

            <button
              type="button"
              className="btn-mermaid-action"
              onClick={handleCopy}
              title="Copy Diagram Definition"
            >
              {isCopied ? <Check size={13} color="var(--color-success)" /> : <Copy size={13} />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              className="btn-mermaid-action"
              onClick={() => setIsExpanded(true)}
              title="Expand Diagram"
            >
              <Maximize2 size={13} />
              <span>Expand</span>
            </button>
          </div>
        </div>

        {/* Diagram Display or Error */}
        <div 
          className="mermaid-viewport" 
          ref={containerRef}
          onClick={() => setIsExpanded(true)}
          title="Click to expand & zoom diagram"
          style={{ cursor: 'zoom-in' }}
        >
          {error ? (
            <div className="mermaid-error">
              <AlertCircle size={16} />
              <span>Diagram Syntax Warning: {error}</span>
            </div>
          ) : (
            <div 
              className="mermaid-svg-wrapper"
              dangerouslySetInnerHTML={{ __html: svgContent }} 
            />
          )}
        </div>
      </div>

      {/* Expanded Modal */}
      {isExpanded && (
        <Modal 
          isOpen={isExpanded} 
          onClose={() => setIsExpanded(false)}
          title="Diagram View"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '80vh', overflow: 'auto' }}>
            <div 
              style={{ display: 'flex', justifyContent: 'center', padding: '20px', background: 'var(--bg-editor)', borderRadius: 'var(--radius-md)' }}
              dangerouslySetInnerHTML={{ __html: svgContent }} 
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              {onEditChart && (
                <button 
                  type="button"
                  className="btn-mermaid-action"
                  onClick={() => {
                    setIsExpanded(false);
                    setIsEditorOpen(true);
                  }}
                >
                  <Edit2 size={14} color="var(--accent-primary)" />
                  <span>Edit Diagram Code</span>
                </button>
              )}
              <button 
                type="button"
                className="btn-mermaid-action" 
                onClick={handleCopy}
              >
                {isCopied ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
                <span>{isCopied ? 'Copied' : 'Copy Definition'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Interactive Diagram Studio Modal */}
      {isEditorOpen && (
        <MermaidEditorModal
          isOpen={isEditorOpen}
          initialCode={chart}
          onClose={() => setIsEditorOpen(false)}
          onSave={(newCode) => {
            if (onEditChart) {
              onEditChart(newCode);
            }
          }}
        />
      )}
    </>
  );
};
