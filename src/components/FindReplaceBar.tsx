import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Replace, ChevronUp, ChevronDown, X } from 'lucide-react';

interface FindReplaceBarProps {
  isOpen: boolean;
  content: string;
  onClose: () => void;
  onUpdateContent: (newContent: string) => void;
}

export const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
  isOpen,
  content,
  onClose,
  onUpdateContent
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Compute match indices directly during render
  const matches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const indices: number[] = [];
    const textLower = content.toLowerCase();
    const queryLower = searchQuery.toLowerCase();
    let startIndex = 0;

    while (startIndex < textLower.length) {
      const idx = textLower.indexOf(queryLower, startIndex);
      if (idx === -1) break;
      indices.push(idx);
      startIndex = idx + queryLower.length;
    }
    return indices;
  }, [searchQuery, content]);

  const activeMatchIndex = matches.length === 0 ? 0 : Math.min(currentMatchIndex, matches.length - 1);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev < matches.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev > 0 ? prev - 1 : matches.length - 1));
  };

  const handleReplaceOne = () => {
    if (matches.length === 0 || !searchQuery) return;
    const targetIdx = matches[activeMatchIndex];
    const before = content.slice(0, targetIdx);
    const after = content.slice(targetIdx + searchQuery.length);
    const newText = before + replaceQuery + after;
    onUpdateContent(newText);
  };

  const handleReplaceAll = () => {
    if (matches.length === 0 || !searchQuery) return;
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newText = content.replace(regex, replaceQuery);
    onUpdateContent(newText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="find-replace-bar" onKeyDown={handleKeyDown}>
      <div className="find-replace-inputs">
        {/* Find Input */}
        <div className="find-input-group">
          <Search size={14} color="var(--text-muted)" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Find in note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <span className="find-match-counter">
              {matches.length > 0 ? `${activeMatchIndex + 1} of ${matches.length}` : '0 results'}
            </span>
          )}
          <button className="find-arrow-btn" onClick={handlePrev} title="Previous Match (Shift+Enter)">
            <ChevronUp size={14} />
          </button>
          <button className="find-arrow-btn" onClick={handleNext} title="Next Match (Enter)">
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Replace Input */}
        <div className="find-input-group">
          <Replace size={14} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Replace with..."
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
          />
          <button 
            className="find-action-btn"
            onClick={handleReplaceOne} 
            disabled={matches.length === 0}
            title="Replace current match"
          >
            Replace
          </button>
          <button 
            className="find-action-btn"
            onClick={handleReplaceAll} 
            disabled={matches.length === 0}
            title="Replace all occurrences"
          >
            All
          </button>
        </div>
      </div>

      <button className="editor-icon-btn" onClick={onClose} title="Close Find & Replace (Esc)">
        <X size={15} />
      </button>
    </div>
  );
};
