import { ListTree, X } from 'lucide-react';

interface HeadingItem {
  id: string;
  text: string;
  level: number;
  lineIndex: number;
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
  if (!isOpen) return null;

  // Extract headings
  const headings: HeadingItem[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    if (line.startsWith('# ')) {
      headings.push({
        id: `h1-${index}`,
        text: line.slice(2).trim(),
        level: 1,
        lineIndex: index
      });
    } else if (line.startsWith('## ')) {
      headings.push({
        id: `h2-${index}`,
        text: line.slice(3).trim(),
        level: 2,
        lineIndex: index
      });
    } else if (line.startsWith('### ')) {
      headings.push({
        id: `h3-${index}`,
        text: line.slice(4).trim(),
        level: 3,
        lineIndex: index
      });
    }
  });

  return (
    <div className="note-outline-drawer">
      <div className="outline-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ListTree size={15} color="var(--accent-primary)" />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Table of Contents</span>
        </div>
        <button className="editor-icon-btn" onClick={onClose} title="Close Outline">
          <X size={15} />
        </button>
      </div>

      <div className="outline-content">
        {headings.length === 0 ? (
          <div style={{ padding: '16px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
            No headings in this note.<br />Use #, ##, or ### to create an outline.
          </div>
        ) : (
          headings.map((item) => (
            <button
              key={item.id}
              className="outline-item"
              style={{
                paddingLeft: `${(item.level - 1) * 14 + 10}px`,
                fontWeight: item.level === 1 ? 600 : 400
              }}
              onClick={() => onScrollToHeading(item.lineIndex)}
              title={`Jump to ${item.text}`}
            >
              <span className={`outline-level-tag h${item.level}`}>
                H{item.level}
              </span>
              <span className="outline-text">{item.text}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
