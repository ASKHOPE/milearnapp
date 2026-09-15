import React, { useState } from 'react';
import type { Note, Folder as FolderType, Book } from '../../types';
import { Sparkles, FileText, BookOpen, X, ArrowRight, Check } from 'lucide-react';

interface ConvertQuickNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note;
  folders: FolderType[];
  books: Book[];
  allNotes: Note[];
  onUpdateNote: (updatedNote: Note) => void;
  onConverted: () => void;
}

export const ConvertQuickNoteModal: React.FC<ConvertQuickNoteModalProps> = ({
  isOpen,
  onClose,
  note,
  folders,
  books,
  allNotes,
  onUpdateNote,
  onConverted
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'note' | 'book'>('note');

  // Standard Note fields
  const cleanDefaultTitle = note.title.replace(/^⚡\s*Quick\s*Scratchpad\s*\([^)]*\)\s*/i, '').trim() || note.title;
  const [noteTitle, setNoteTitle] = useState(cleanDefaultTitle);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(note.folderId || folders[0]?.id || '');

  // Book Page fields
  const [selectedBookId, setSelectedBookId] = useState<string>(books[0]?.id || '');
  const selectedBook = books.find((b) => b.id === selectedBookId);
  const existingBookPagesCount = allNotes.filter((n) => n.bookId === selectedBookId).length;
  const nextChapterNum = existingBookPagesCount + 1;
  const [bookPageTitle, setBookPageTitle] = useState(
    cleanDefaultTitle ? cleanDefaultTitle : `${selectedBook?.title || 'Book'} — Chapter ${nextChapterNum}`
  );

  const handleConvertToNote = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedTags = (note.tags || []).filter((t) => t !== 'quick-note');
    const finalTitle = noteTitle.trim() || 'Untitled Note';

    const updated: Note = {
      ...note,
      title: finalTitle,
      folderId: selectedFolderId || null,
      bookId: null,
      tags: updatedTags,
      updatedAt: new Date().toISOString()
    };

    onUpdateNote(updated);
    onConverted();
    onClose();
  };

  const handleConvertToBookPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId) return;

    const updatedTags = (note.tags || []).filter((t) => t !== 'quick-note');
    if (!updatedTags.includes('book')) updatedTags.push('book');
    if (!updatedTags.includes('page')) updatedTags.push('page');

    const finalTitle = bookPageTitle.trim() || `${selectedBook?.title || 'Book'} — Chapter ${nextChapterNum}`;

    const updated: Note = {
      ...note,
      title: finalTitle,
      bookId: selectedBookId,
      pageOrder: nextChapterNum,
      folderId: null,
      tags: updatedTags,
      updatedAt: new Date().toISOString()
    };

    onUpdateNote(updated);
    onConverted();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card quick-note-convert-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="convert-modal-icon-badge">
              <Sparkles size={16} color="#f59e0b" />
            </div>
            <div>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>Convert Quick Note</span>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>
                Promote this scratchpad into a permanent note or chapter
              </span>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="convert-target-segmented-tabs">
          <button
            type="button"
            className={`convert-tab-btn ${activeTab === 'note' ? 'active' : ''}`}
            onClick={() => setActiveTab('note')}
          >
            <FileText size={14} />
            <span>Standard Note</span>
          </button>
          <button
            type="button"
            className={`convert-tab-btn ${activeTab === 'book' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('book');
              if (selectedBook && !cleanDefaultTitle) {
                setBookPageTitle(`${selectedBook.title} — Chapter ${nextChapterNum}`);
              }
            }}
          >
            <BookOpen size={14} />
            <span>Page in a Book</span>
          </button>
        </div>

        {/* Option 1: Standard Note Form */}
        {activeTab === 'note' && (
          <form onSubmit={handleConvertToNote} className="modal-body convert-form">
            <div className="convert-info-banner">
              <p>
                Converts this scratchpad into a full note in your workspace. The <code>quick-note</code> tag is removed and all advanced editor features will be unlocked.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Note Title</label>
              <input
                type="text"
                className="modal-input"
                placeholder="Enter note title..."
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Destination Folder</label>
              <select
                className="modal-input"
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
              >
                <option value="">(No folder / Uncategorized)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-footer" style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn-small-ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-small-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Check size={13} />
                <span>Convert to Standard Note</span>
              </button>
            </div>
          </form>
        )}

        {/* Option 2: Page in a Book Form */}
        {activeTab === 'book' && (
          <form onSubmit={handleConvertToBookPage} className="modal-body convert-form">
            <div className="convert-info-banner book">
              <p>
                Files this quick note as a chapter or page inside one of your Books or Study Guides.
              </p>
            </div>

            {books.length === 0 ? (
              <div className="empty-books-prompt" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                <p>No books created in this workspace yet. Create a book first or convert to a standard note.</p>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Target Book</label>
                  <select
                    className="modal-input"
                    value={selectedBookId}
                    onChange={(e) => {
                      setSelectedBookId(e.target.value);
                      const b = books.find((x) => x.id === e.target.value);
                      const count = allNotes.filter((n) => n.bookId === e.target.value).length + 1;
                      if (!cleanDefaultTitle && b) {
                        setBookPageTitle(`${b.title} — Chapter ${count}`);
                      }
                    }}
                  >
                    {books.map((b) => {
                      const count = allNotes.filter((n) => n.bookId === b.id).length;
                      return (
                        <option key={b.id} value={b.id}>
                          {b.icon || '📚'} {b.title} ({count} {count === 1 ? 'chapter' : 'chapters'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Chapter / Page Title</label>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="e.g. Chapter 3: Introduction to Mechanics"
                    value={bookPageTitle}
                    onChange={(e) => setBookPageTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="modal-footer" style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" className="btn-small-ghost" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-small-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowRight size={13} />
                    <span>Add as Page to Book</span>
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
