import React, { useState } from 'react';
import type { Book, Note } from '../types';
import { BookOpen, Plus, ChevronRight, ChevronDown, FileText, Trash2 } from 'lucide-react';

interface BookShelfProps {
  books: Book[];
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onCreateBook: (title: string, icon: string, color: string) => void;
  onDeleteBook: (bookId: string) => void;
  onAddPageToBook: (bookId: string) => void;
}

const BOOK_EMOJIS = ['📖', '📕', '📘', '📗', '📙', '📓', '📚', '🧠', '💼'];
const BOOK_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const BookShelf: React.FC<BookShelfProps> = ({
  books,
  notes,
  selectedNoteId,
  onSelectNote,
  onCreateBook,
  onDeleteBook,
  onAddPageToBook
}) => {
  const [expandedBookIds, setExpandedBookIds] = useState<Set<string>>(new Set(books.map((b) => b.id)));
  const [isSectionExpanded, setIsSectionExpanded] = useState(true);
  const [isCreatingBook, setIsCreatingBook] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📖');
  const [selectedColor, setSelectedColor] = useState('#4f46e5');

  const toggleExpand = (bookId: string) => {
    setExpandedBookIds((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  };

  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim()) return;
    onCreateBook(newBookTitle.trim(), selectedEmoji, selectedColor);
    setNewBookTitle('');
    setIsCreatingBook(false);
  };

  return (
    <div className="book-shelf-section">
      <div 
        className="sidebar-section-title clickable-section-header"
        onClick={() => setIsSectionExpanded(!isSectionExpanded)}
        title={isSectionExpanded ? "Collapse Books & Notebooks" : "Expand Books & Notebooks"}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            type="button" 
            className="section-toggle-chevron"
            aria-label={isSectionExpanded ? "Collapse Books" : "Expand Books"}
          >
            {isSectionExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
          <BookOpen size={13} color="var(--accent-primary)" />
          <span>Books & Notebooks</span>
          <span className="badge-count-tiny">{books.length}</span>
        </div>
        <button
          className="folder-action-btn"
          title="Create New Book"
          onClick={(e) => {
            e.stopPropagation();
            setIsSectionExpanded(true);
            setIsCreatingBook(!isCreatingBook);
          }}
        >
          <Plus size={13} />
        </button>
      </div>

      {isSectionExpanded && (
        <>
          {/* Book Creation Form */}
      {isCreatingBook && (
        <form onSubmit={handleCreateBook} className="book-create-form">
          <input
            type="text"
            placeholder="Book title (e.g. Playbook)..."
            value={newBookTitle}
            onChange={(e) => setNewBookTitle(e.target.value)}
            autoFocus
          />
          <div className="book-emoji-picker">
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
          <div className="book-color-picker">
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
            <button type="button" className="btn-small-ghost" onClick={() => setIsCreatingBook(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Books List */}
      <div className="books-list">
        {books.map((book) => {
          const isExpanded = expandedBookIds.has(book.id);
          const pages = notes
            .filter((n) => n.bookId === book.id && !n.isTrashed)
            .sort((a, b) => (a.pageOrder || 0) - (b.pageOrder || 0));

          return (
            <div key={book.id} className="book-card-item">
              <div 
                className="book-header-row"
                onClick={() => toggleExpand(book.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                  <span className="book-icon">{book.icon || '📖'}</span>
                  <span className="book-title">{book.title}</span>
                  <span className="book-page-count">{pages.length}p</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    className="book-icon-btn"
                    title="Add Page to Book"
                    onClick={() => onAddPageToBook(book.id)}
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    className="book-icon-btn danger"
                    title="Delete Book"
                    onClick={() => {
                      if (confirm(`Delete book "${book.title}"? Notes inside will be kept.`)) {
                        onDeleteBook(book.id);
                      }
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                  <button className="book-icon-btn" onClick={() => toggleExpand(book.id)}>
                    {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </button>
                </div>
              </div>

              {/* Nested Pages List */}
              {isExpanded && (
                <div className="book-pages-sublist">
                  {pages.map((page, idx) => {
                    const isSelected = page.id === selectedNoteId;
                    return (
                      <div
                        key={page.id}
                        className={`book-page-item ${isSelected ? 'active' : ''}`}
                        onClick={() => onSelectNote(page.id)}
                        title={page.title}
                      >
                        <span className="page-number-dot">{idx + 1}</span>
                        <FileText size={12} className="page-file-icon" />
                        <span className="page-title-text">{page.title || 'Untitled Page'}</span>
                      </div>
                    );
                  })}
                  {pages.length === 0 && (
                    <div 
                      className="book-empty-pages"
                      onClick={() => onAddPageToBook(book.id)}
                    >
                      + Add first page to {book.title}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  )}
</div>
);
};
