import React, { useState, useRef, useEffect } from 'react';
import { Tag, Search, X, Check } from 'lucide-react';
import type { Note } from '../types';

interface TagSelectorPopoverProps {
  notes: Note[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  isOpen: boolean;
  onClose: () => void;
  triggerRect?: DOMRect | null;
}

export const TagSelectorPopover: React.FC<TagSelectorPopoverProps> = ({
  notes,
  selectedTag,
  onSelectTag,
  isOpen,
  onClose
}) => {
  const [search, setSearch] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeNotes = notes.filter((n) => !n.isTrashed && !n.isArchived);
  
  // Calculate count per tag
  const tagCountMap = new Map<string, number>();
  activeNotes.forEach((note) => {
    (note.tags || []).forEach((tag) => {
      tagCountMap.set(tag, (tagCountMap.get(tag) || 0) + 1);
    });
  });

  const allTags = Array.from(tagCountMap.keys()).sort((a, b) => (tagCountMap.get(b) || 0) - (tagCountMap.get(a) || 0));

  const filteredTags = allTags.filter((t) =>
    t.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div className="popup-selector-overlay" onClick={onClose}>
      <div 
        className="popup-selector-card" 
        ref={popoverRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="popup-selector-header">
          <div className="popup-selector-title">
            <Tag size={15} color="var(--accent-primary)" />
            <span>Select Tag Filter</span>
            <span className="badge-count-tiny">{allTags.length} tags</span>
          </div>
          <button type="button" className="popup-close-btn" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div className="popup-search-box">
          <Search size={13} className="popup-search-icon" />
          <input
            type="text"
            placeholder="Search tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {search && (
            <button type="button" className="popup-clear-search" onClick={() => setSearch('')}>
              <X size={12} />
            </button>
          )}
        </div>

        {selectedTag && (
          <div className="popup-active-filter-bar">
            <span>Active Filter: <strong>#{selectedTag}</strong></span>
            <button 
              type="button" 
              className="btn-clear-tag"
              onClick={() => {
                onSelectTag(null);
                onClose();
              }}
            >
              Clear Filter
            </button>
          </div>
        )}

        <div className="popup-items-scroll">
          {filteredTags.map((tag) => {
            const count = tagCountMap.get(tag) || 0;
            const isSelected = selectedTag === tag;

            return (
              <div
                key={tag}
                className={`popup-item-row ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  onSelectTag(isSelected ? null : tag);
                  onClose();
                }}
              >
                <div className="popup-item-left">
                  <Tag size={13} color={isSelected ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                  <span className="popup-item-name">#{tag}</span>
                </div>
                <div className="popup-item-right">
                  <span className="badge-count">{count} note{count !== 1 ? 's' : ''}</span>
                  {isSelected && <Check size={14} color="var(--accent-primary)" />}
                </div>
              </div>
            );
          })}

          {filteredTags.length === 0 && (
            <div className="popup-empty-state">
              <p>No tags match "{search}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
