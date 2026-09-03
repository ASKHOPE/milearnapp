import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Copy, Check, Maximize2, AlertCircle } from 'lucide-react';
import { Modal } from './ui/Modal';

interface MermaidRendererProps {
  chart: string;
  id: string;
}

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({ chart, id }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
              <div>
                <strong>Mermaid Syntax Preview</strong>
                <pre>{chart}</pre>
              </div>
            </div>
          ) : (
            <div 
              className="mermaid-svg-container"
              dangerouslySetInnerHTML={{ __html: svgContent }} 
            />
          )}
        </div>
      </div>

      {/* Expanded Modal for Large Diagrams */}
      <Modal
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        title="Mermaid Diagram View"
        maxWidth={920}
      >
        <div 
          className="mermaid-svg-expanded"
          dangerouslySetInnerHTML={{ __html: svgContent }} 
        />
      </Modal>
    </>
  );
};
