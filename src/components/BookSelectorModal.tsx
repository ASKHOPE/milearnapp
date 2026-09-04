import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Plus, Search, X, Pin, Trash2 } from 'lucide-react';
import type { Book, Note } from '../types';

interface BookSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  notes: Note[];
  pinnedBookIds: string[];
  onTogglePinBook: (bookId: string) => void;
  onSelectBook: (bookId: string) => void;
  onCreateBook: (title: string, icon: string, color: string) => void;
  onDeleteBook?: (bookId: string) => void;
}

const BOOK_EMOJIS = ['📖', '📕', '📘', '📗', '📙', '📓', '📚', '🧠', '💼'];
const BOOK_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const BookSelectorModal: React.FC<BookSelectorModalProps> = ({
  isOpen,
  onClose,
  books,
  notes,
  pinnedBookIds,
  onTogglePinBook,
  onSelectBook,
  onCreateBook,
  onDeleteBook
}) => {
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📖');
  const [selectedColor, setSelectedColor] = useState('#4f46e5');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredBooks = books.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase().trim())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateBook(newTitle.trim(), selectedEmoji, selectedColor);
    setNewTitle('');
    setIsCreating(false);
  };

  return (
    <div className="popup-selector-overlay" onClick={onClose}>
      <div 
        className="popup-selector-card large" 
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="popup-selector-header">
          <div className="popup-selector-title">
            <BookOpen size={16} color="var(--accent-primary)" />
            <span>Browse & Pin Books</span>
            <span className="badge-count-tiny">{books.length} books</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="btn-small-primary"
              onClick={() => setIsCreating(!isCreating)}
            >
              <Plus size={12} />
              <span>New Book</span>
            </button>
            <button type="button" className="popup-close-btn" onClick={onClose}>
              <X size={14} />
            </button>
          </div>
        </div>

        {isCreating && (
          <form onSubmit={handleCreate} className="popup-inline-form book-create">
            <input
              type="text"
              placeholder="Book title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
            />
            <div className="emoji-row">
              {BOOK_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  className={`emoji-btn ${selectedEmoji === em ? 'active' : ''}`}
                  onClick={() => setSelectedEmoji(em)}
                >
                  {em}
                </button>
              ))}
            </div>
            <div className="color-row">
              {BOOK_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  className={`color-dot ${selectedColor === col ? 'active' : ''}`}
                  style={{ backgroundColor: col }}
                  onClick={() => setSelectedColor(col)}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <button type="submit" className="btn-small-primary">Create Book</button>
              <button type="button" className="btn-small-ghost" onClick={() => setIsCreating(false)}>Cancel</button>
            </div>
          </form>
        )}

        <div className="popup-search-box">
          <Search size={13} className="popup-search-icon" />
          <input
            type="text"
            placeholder="Search books & notebooks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="popup-clear-search" onClick={() => setSearch('')}>
              <X size={12} />
            </button>
          )}
        </div>

        <div className="popup-items-scroll">
          {filteredBooks.map((book) => {
            const pages = notes.filter((n) => n.bookId === book.id && !n.isTrashed);
            const isPinned = pinnedBookIds.includes(book.id);

            return (
              <div
                key={book.id}
                className="popup-item-row"
                onClick={() => {
                  onSelectBook(book.id);
                  onClose();
                }}
              >
                <div className="popup-item-left">
                  <span style={{ fontSize: '15px' }}>{book.icon || '📖'}</span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="popup-item-name">{book.title}</span>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      {pages.length} chapter{pages.length !== 1 ? 's' : ''} / page{pages.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="popup-item-right" onClick={(e) => e.stopPropagation()}>
                  {/* Pin / Unpin Button */}
                  <button
                    type="button"
                    className={`popup-pin-btn ${isPinned ? 'pinned' : ''}`}
                    onClick={() => onTogglePinBook(book.id)}
                    title={isPinned ? 'Unpin from Sidebar' : 'Pin to Sidebar'}
                  >
                    <Pin size={12} fill={isPinned ? 'var(--accent-primary)' : 'none'} color={isPinned ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                  </button>

                  {/* Delete button */}
                  {onDeleteBook && (
                    <button
                      type="button"
                      className="popup-icon-action danger"
                      onClick={() => onDeleteBook(book.id)}
                      title="Delete Book"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredBooks.length === 0 && (
            <div className="popup-empty-state">
              <p>No books match "{search}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
