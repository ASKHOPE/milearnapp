import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  math: string;
  block?: boolean;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  math,
  block = false,
  className = ''
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: block,
        throwOnError: false,
        output: 'htmlAndMathml'
      });
    } catch (err: any) {
      return `<span class="katex-error" title="${err?.message || 'Math syntax error'}">${math}</span>`;
    }
  }, [math, block]);

  if (block) {
    return (
      <div 
        className={`math-block-container ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
        title="LaTeX Mathematical Formula"
      />
    );
  }

  return (
    <span 
      className={`math-inline ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
      title="LaTeX Formula"
    />
  );
};
