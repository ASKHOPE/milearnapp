import React, { useState, useEffect, useRef } from 'react';
import type { Note, Folder } from '../types';
import { 
  Search, 
  X, 
  FileText, 
  Image as ImageIcon, 
  Paperclip, 
  Star, 
  Music, 
  Folder as FolderIcon 
} from 'lucide-react';
import { BookLoader } from './ui/BookLoader';

interface SearchModalProps {
  isOpen: boolean;
  notes: Note[];
  folders: Folder[];
  onClose: () => void;
  onSelectNote: (noteId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  notes,
  folders,
  onClose,
  onSelectNote
}) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'image' | 'pdf' | 'document' | 'audio' | 'favorite'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setActiveFilter('all');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter notes
  const results = notes.filter((note) => {
    // Media filter
    if (activeFilter === 'favorite' && !note.isFavorite) return false;
    if (activeFilter === 'image' && !note.attachments?.some((a) => a.type === 'image')) return false;
    if (activeFilter === 'pdf' && !note.attachments?.some((a) => a.type === 'pdf')) return false;
    if (activeFilter === 'document' && !note.attachments?.some((a) => a.type === 'document')) return false;
    if (activeFilter === 'audio' && !note.attachments?.some((a) => a.type === 'audio')) return false;

    if (!query.trim()) return true;

    const q = query.toLowerCase();
    const folder = folders.find((f) => f.id === note.folderId);

    const matchTitle = note.title.toLowerCase().includes(q);
    const matchContent = note.content.toLowerCase().includes(q);
    const matchTags = note.tags?.some((t) => t.toLowerCase().includes(q));
    const matchFolder = folder?.name.toLowerCase().includes(q);
    const matchAttachment = note.attachments?.some((a) => a.name.toLowerCase().includes(q));

    return matchTitle || matchContent || matchTags || matchFolder || matchAttachment;
  });

  // Highlight helper
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={i} className="search-highlight">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      onSelectNote(results[selectedIndex].id);
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '680px' }} 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="search-input-header">
          <Search size={20} color="var(--accent-primary)" />
          <input
            ref={inputRef}
            type="text"
            className="search-input-box"
            placeholder="Search notes, body text, tags, attachments..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Filters Row */}
        <div className="search-filters-row">
          <button
            className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            <span>All</span>
            <span style={{ opacity: 0.7 }}>({notes.length})</span>
          </button>
          <button
            className={`filter-pill ${activeFilter === 'favorite' ? 'active' : ''}`}
            onClick={() => setActiveFilter('favorite')}
          >
            <Star size={11} />
            <span>Favorites</span>
          </button>
          <button
            className={`filter-pill ${activeFilter === 'image' ? 'active' : ''}`}
            onClick={() => setActiveFilter('image')}
          >
            <ImageIcon size={11} />
            <span>Images</span>
          </button>
          <button
            className={`filter-pill ${activeFilter === 'pdf' ? 'active' : ''}`}
            onClick={() => setActiveFilter('pdf')}
          >
            <FileText size={11} />
            <span>PDFs</span>
          </button>
          <button
            className={`filter-pill ${activeFilter === 'document' ? 'active' : ''}`}
            onClick={() => setActiveFilter('document')}
          >
            <Paperclip size={11} />
            <span>Documents</span>
          </button>
          <button
            className={`filter-pill ${activeFilter === 'audio' ? 'active' : ''}`}
            onClick={() => setActiveFilter('audio')}
          >
            <Music size={11} />
            <span>Audio</span>
          </button>
        </div>

        {/* Results List */}
        <div className="search-results-list">
          {results.length === 0 ? (
            <div className="empty-state" style={{ padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <BookLoader 
                size="sm" 
                text={query.trim() ? `No notes match "${query}"` : 'Type keywords to explore notes, tags & media...'} 
              />
            </div>
          ) : (
            results.map((note, idx) => {
              const folder = folders.find((f) => f.id === note.folderId);
              const isSelected = idx === selectedIndex;

              // Find snippet around query
              let snippet = note.content.replace(/[#*`_~]/g, '').trim();
              if (query.trim()) {
                const matchPos = snippet.toLowerCase().indexOf(query.toLowerCase());
                if (matchPos > 40) {
                  snippet = '...' + snippet.slice(matchPos - 20, matchPos + 80) + '...';
                } else {
                  snippet = snippet.slice(0, 100) + '...';
                }
              } else {
                snippet = snippet.slice(0, 80) + '...';
              }

              return (
                <div
                  key={note.id}
                  className="search-result-item"
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-card-selected)' : undefined,
                    borderColor: isSelected ? 'var(--accent-primary)' : undefined
                  }}
                  onClick={() => {
                    onSelectNote(note.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="search-result-title">
                      {highlightText(note.title, query)}
                    </span>
                    {folder && (
                      <span className="card-badge folder">
                        <FolderIcon size={9} />
                        <span>{folder.name}</span>
                      </span>
                    )}
                  </div>

                  <p className="search-result-snippet">
                    {highlightText(snippet, query)}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    {note.tags?.map((t) => (
                      <span key={t} className="card-badge tag">#{t}</span>
                    ))}
                    {note.attachments?.length > 0 && (
                      <span className="card-badge">
                        <Paperclip size={9} />
                        <span>{note.attachments.length} files</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
