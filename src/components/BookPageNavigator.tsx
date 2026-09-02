import React from 'react';
import type { Note, Book } from '../types';
import { ChevronLeft, ChevronRight, BookOpen, Plus } from 'lucide-react';

interface BookPageNavigatorProps {
  currentNote: Note;
  book: Book;
  allBookPages: Note[];
  onSelectPage: (noteId: string) => void;
  onAddPageToBook: (bookId: string) => void;
}

export const BookPageNavigator: React.FC<BookPageNavigatorProps> = ({
  currentNote,
  book,
  allBookPages,
  onSelectPage,
  onAddPageToBook
}) => {
  // Sort pages by pageOrder or createdAt
  const sortedPages = [...allBookPages].sort((a, b) => (a.pageOrder || 0) - (b.pageOrder || 0));
  const currentIndex = sortedPages.findIndex((p) => p.id === currentNote.id);

  const prevPage = currentIndex > 0 ? sortedPages[currentIndex - 1] : null;
  const nextPage = currentIndex < sortedPages.length - 1 ? sortedPages[currentIndex + 1] : null;

  return (
    <div className="book-page-navigator">
      {/* Previous Page Button */}
      <button
        className="book-nav-btn"
        disabled={!prevPage}
        onClick={() => prevPage && onSelectPage(prevPage.id)}
        title={prevPage ? `Go to previous page: ${prevPage.title}` : 'First page'}
      >
        <ChevronLeft size={16} />
        <div className="book-nav-btn-text">
          <span className="book-nav-label">Previous</span>
          <span className="book-nav-title">{prevPage ? prevPage.title : 'None'}</span>
        </div>
      </button>

      {/* Book Center Badge */}
      <div className="book-nav-center">
        <div className="book-badge-pill" style={{ borderColor: book.color || 'var(--accent-primary)' }}>
          <BookOpen size={13} color={book.color || 'var(--accent-primary)'} />
          <span className="book-badge-name">{book.title}</span>
          <span className="book-badge-counter">
            Page {currentIndex !== -1 ? currentIndex + 1 : 1} of {sortedPages.length}
          </span>
        </div>
        <button 
          className="book-add-page-btn"
          onClick={() => onAddPageToBook(book.id)}
          title="Add a new chapter / page to this book"
        >
          <Plus size={12} />
          <span>New Page</span>
        </button>
      </div>

      {/* Next Page Button */}
      <button
        className="book-nav-btn next"
        disabled={!nextPage}
        onClick={() => nextPage && onSelectPage(nextPage.id)}
        title={nextPage ? `Go to next page: ${nextPage.title}` : 'Last page'}
      >
        <div className="book-nav-btn-text" style={{ textAlign: 'right' }}>
          <span className="book-nav-label">Next</span>
          <span className="book-nav-title">{nextPage ? nextPage.title : 'End of Book'}</span>
        </div>
        <ChevronRight size={16} />
      </button>
    </div>
  );
};
