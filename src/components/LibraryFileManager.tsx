import React, { useState } from 'react';
import { 
  BookOpen, 
  Folder as FolderIcon, 
  FolderPlus, 
  Plus, 
  Search, 
  FileText, 
  Clock, 
  Trash2, 
  Copy, 
  Move, 
  ExternalLink, 
  ChevronRight, 
  ChevronDown, 
  X,
  Layers,
  Columns2,
  Tag,
  Paperclip
} from 'lucide-react';
import type { Book, Folder as FolderType, Note, Workspace } from '../types';

interface LibraryFileManagerProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  folders: FolderType[];
  notes: Note[];
  activeWorkspace?: Workspace;
  onSelectNote: (noteId: string) => void;
  onSelectNoteSplit?: (noteId: string) => void;
  onCreateBook: (title: string, icon: string, color: string) => void;
  onDeleteBook: (bookId: string) => void;
  onAddPageToBook: (bookId: string) => void;
  onCreateFolder: (name: string, parentId?: string | null) => void;
  onDeleteFolder: (folderId: string) => void;
  onCreateNote: () => void;
  onDuplicateNote: (note: Note) => void;
  onMoveNote: (noteId: string, targetFolderId: string | null, targetBookId: string | null) => void;
  onDuplicateBook?: (book: Book) => void;
}

export const LibraryFileManager: React.FC<LibraryFileManagerProps> = ({
  isOpen,
  onClose,
  books,
  folders,
  notes,
  activeWorkspace,
  onSelectNote,
  onSelectNoteSplit,
  onCreateBook,
  onDeleteBook,
  onAddPageToBook,
  onCreateFolder,
  onDeleteFolder,
  onCreateNote,
  onDuplicateNote,
  onMoveNote,
  onDuplicateBook
}) => {
  const [activeTab, setActiveTab] = useState<'books' | 'folders' | 'media' | 'tags'>('books');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expandedBooks, setExpandedBooks] = useState<Record<string, boolean>>({});
  
  // Create Book Modal Form State
  const [isCreatingBook, setIsCreatingBook] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookIcon, setNewBookIcon] = useState('📘');
  const [newBookColor, setNewBookColor] = useState('#4f46e5');

  // Create Folder State
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Move Note Modal State
  const [movingNote, setMovingNote] = useState<Note | null>(null);
  const [targetFolderChoice, setTargetFolderChoice] = useState<string>('');
  const [targetBookChoice, setTargetBookChoice] = useState<string>('');

  if (!isOpen) return null;

  const activeNotes = notes.filter((n) => !n.isTrashed);

  // Extract all media/attachments
  const allMediaNotes = activeNotes.filter((n) => 
    (n.attachments && n.attachments.length > 0) || 
    n.content.includes('![') || 
    n.content.includes('<video') || 
    n.content.includes('```mermaid')
  );

  // Extract all tags with note counts
  const tagCounts: Record<string, number> = {};
  activeNotes.forEach((n) => {
    n.tags?.forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });
  const allTagsList = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  // Filter notes by search query, folder, tag
  const filteredNotes = activeNotes.filter((n) => {
    const matchesSearch = !searchQuery || 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFolder = selectedFolderId === null || n.folderId === selectedFolderId;
    const matchesTag = selectedTag === null || n.tags.includes(selectedTag);

    return matchesSearch && matchesFolder && matchesTag;
  });

  const handleOpenNoteAndExit = (noteId: string) => {
    onSelectNote(noteId);
    onClose();
  };

  const handleOpenNoteSplitAndExit = (noteId: string) => {
    if (onSelectNoteSplit) {
      onSelectNoteSplit(noteId);
      onClose();
    }
  };

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim()) return;
    onCreateBook(newBookTitle.trim(), newBookIcon, newBookColor);
    setNewBookTitle('');
    setIsCreatingBook(false);
  };

  const handleSaveFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim(), selectedFolderId);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleExecuteMove = () => {
    if (!movingNote) return;
    onMoveNote(
      movingNote.id, 
      targetFolderChoice || null, 
      targetBookChoice || null
    );
    setMovingNote(null);
  };

  const toggleBookExpanded = (bookId: string) => {
    setExpandedBooks(prev => ({ ...prev, [bookId]: !prev[bookId] }));
  };

  return (
    <div className="library-manager-overlay">
      <div className="library-manager-container">
        
        {/* Top Header Bar */}
        <div className="library-header">
          <div className="library-title-group">
            <div className="library-icon-badge">
              <BookOpen size={20} color="var(--accent-primary)" />
            </div>
            <div>
              <h2 className="library-main-title">Library & Asset Hub</h2>
              <span className="library-subtitle">
                {activeWorkspace ? `${activeWorkspace.icon} ${activeWorkspace.name}` : 'Personal Vault'} · {books.length} Books · {folders.length} Folders · {allMediaNotes.length} Media · {activeNotes.length} Notes
              </span>
            </div>
          </div>

          <div className="library-header-controls">
            {/* 4 Tabs Switcher */}
            <div className="library-tab-pills">
              <button
                type="button"
                className={`library-tab-pill ${activeTab === 'books' ? 'active' : ''}`}
                onClick={() => { setActiveTab('books'); setSelectedFolderId(null); setSelectedTag(null); }}
              >
                <BookOpen size={14} />
                <span>Bookshelf ({books.length})</span>
              </button>
              <button
                type="button"
                className={`library-tab-pill ${activeTab === 'folders' ? 'active' : ''}`}
                onClick={() => { setActiveTab('folders'); setSelectedTag(null); }}
              >
                <FolderIcon size={14} />
                <span>Folders & Files ({folders.length})</span>
              </button>
              <button
                type="button"
                className={`library-tab-pill ${activeTab === 'media' ? 'active' : ''}`}
                onClick={() => { setActiveTab('media'); setSelectedFolderId(null); setSelectedTag(null); }}
              >
                <Paperclip size={14} />
                <span>Media & Files ({allMediaNotes.length})</span>
              </button>
              <button
                type="button"
                className={`library-tab-pill ${activeTab === 'tags' ? 'active' : ''}`}
                onClick={() => { setActiveTab('tags'); setSelectedFolderId(null); }}
              >
                <Tag size={14} />
                <span>Tags Index ({allTagsList.length})</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {activeTab === 'books' && (
                <button 
                  type="button"
                  className="library-btn-primary"
                  onClick={() => setIsCreatingBook(true)}
                >
                  <Plus size={14} />
                  <span>New Book</span>
                </button>
              )}

              {activeTab === 'folders' && (
                <>
                  <button 
                    type="button"
                    className="library-btn-secondary"
                    onClick={() => setIsCreatingFolder(true)}
                  >
                    <FolderPlus size={14} />
                    <span>New Folder</span>
                  </button>
                  <button 
                    type="button"
                    className="library-btn-primary"
                    onClick={() => { onCreateNote(); onClose(); }}
                  >
                    <Plus size={14} />
                    <span>New Note</span>
                  </button>
                </>
              )}

              {/* Close Modal */}
              <button 
                type="button" 
                className="library-close-btn" 
                onClick={onClose}
                title="Return to Editor (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Global Search Sub-bar */}
        <div className="library-search-strip">
          <div className="library-search-box">
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'books' ? 'books and chapters' : activeTab === 'folders' ? 'files and folders' : activeTab === 'media' ? 'media assets and sketches' : 'tags and indexed topics'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="library-body">

          {/* TAB 1: BOOKS & NOTEBOOKS SHELF */}
          {activeTab === 'books' && (
            <div className="library-books-shelf">
              {books.length === 0 ? (
                <div className="library-empty-box">
                  <BookOpen size={48} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                  <h3>No Books or Notebooks Yet</h3>
                  <p>Organize your notes into rich multi-chapter digital books and bounded notebooks.</p>
                  <button className="library-btn-primary" onClick={() => setIsCreatingBook(true)}>
                    <Plus size={14} />
                    <span>Create Your First Book</span>
                  </button>
                </div>
              ) : (
                <div className="books-shelf-grid">
                  {books.map((book) => {
                    const bookPages = activeNotes
                      .filter((n) => n.bookId === book.id)
                      .sort((a, b) => (a.pageOrder || 0) - (b.pageOrder || 0));
                    const totalWords = bookPages.reduce(
                      (sum, n) => sum + (n.content.split(/\s+/).filter(Boolean).length || 0), 
                      0
                    );
                    const isExpanded = expandedBooks[book.id];

                    return (
                      <div key={book.id} className="library-book-card" style={{ borderTopColor: book.color }}>
                        <div className="book-card-cover" style={{ background: `linear-gradient(135deg, ${book.color}22, ${book.color}08)` }}>
                          <div className="book-cover-spine" style={{ backgroundColor: book.color }} />
                          <div className="book-cover-content">
                            <span className="book-card-icon">{book.icon}</span>
                            <h3 className="book-card-title">{book.title}</h3>
                            <span className="book-card-meta">
                              {bookPages.length} {bookPages.length === 1 ? 'Chapter' : 'Chapters'} · ~{totalWords} words
                            </span>
                          </div>
                        </div>

                        <div className="book-card-actions">
                          <button
                            type="button"
                            className="btn-book-action"
                            onClick={() => toggleBookExpanded(book.id)}
                            title="Toggle Chapters List"
                          >
                            <Layers size={13} />
                            <span>{isExpanded ? 'Hide Pages' : 'View Pages'}</span>
                            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          </button>

                          <button
                            type="button"
                            className="btn-book-action primary"
                            onClick={() => onAddPageToBook(book.id)}
                            title="Add Next Chapter / Page"
                          >
                            <Plus size={13} />
                            <span>Add Page</span>
                          </button>

                          {onDuplicateBook && (
                            <button
                              type="button"
                              className="btn-book-icon-btn"
                              onClick={() => onDuplicateBook(book)}
                              title="Duplicate Book"
                            >
                              <Copy size={13} />
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn-book-icon-btn danger"
                            onClick={() => onDeleteBook(book.id)}
                            title="Delete Book"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Collapsible Chapters Outline */}
                        {isExpanded && (
                          <div className="book-chapters-drawer">
                            {bookPages.length === 0 ? (
                              <div className="drawer-empty-hint">No pages in this notebook yet. Click "Add Page".</div>
                            ) : (
                              <ul className="book-chapters-list">
                                {bookPages.map((page, idx) => (
                                  <li key={page.id} className="book-chapter-row">
                                    <span className="chapter-order-badge">{idx + 1}</span>
                                    <span className="chapter-title-text" onClick={() => handleOpenNoteAndExit(page.id)}>
                                      {page.title || 'Untitled Page'}
                                    </span>
                                    <div className="chapter-row-actions">
                                      <button 
                                        type="button"
                                        className="chapter-mini-btn"
                                        onClick={() => handleOpenNoteAndExit(page.id)}
                                        title="Open in Editor"
                                      >
                                        <ExternalLink size={12} />
                                      </button>
                                      {onSelectNoteSplit && (
                                        <button 
                                          type="button"
                                          className="chapter-mini-btn"
                                          onClick={() => handleOpenNoteSplitAndExit(page.id)}
                                          title="Open Side-by-Side (Split)"
                                        >
                                          <Columns2 size={12} />
                                        </button>
                                      )}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FOLDER EXPLORER & FILE MANAGER */}
          {activeTab === 'folders' && (
            <div className="library-files-split">
              {/* Left Column: Folders Directory */}
              <div className="library-folders-col">
                <div className="folders-col-header">
                  <span>Directory Tree</span>
                  <button 
                    className="library-btn-mini" 
                    onClick={() => setIsCreatingFolder(true)}
                    title="Create Subfolder"
                  >
                    <FolderPlus size={13} />
                  </button>
                </div>

                <ul className="library-folders-nav">
                  <li 
                    className={`library-folder-row ${selectedFolderId === null ? 'active' : ''}`}
                    onClick={() => setSelectedFolderId(null)}
                  >
                    <FolderIcon size={14} color="var(--accent-primary)" />
                    <span>All Notes & Files</span>
                    <span className="badge-count">{activeNotes.length}</span>
                  </li>

                  {folders.map((folder) => {
                    const count = activeNotes.filter((n) => n.folderId === folder.id).length;
                    return (
                      <li
                        key={folder.id}
                        className={`library-folder-row ${selectedFolderId === folder.id ? 'active' : ''}`}
                        onClick={() => setSelectedFolderId(folder.id)}
                      >
                        <FolderIcon size={14} style={{ color: folder.color || 'var(--text-muted)' }} />
                        <span className="library-folder-name">{folder.name}</span>
                        <div className="folder-row-right">
                          <span className="badge-count">{count}</span>
                          <button
                            type="button"
                            className="folder-del-mini"
                            onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                            title="Delete Folder"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Right Column: Files Grid / Table */}
              <div className="library-files-col">
                <div className="files-col-header">
                  <span>
                    {selectedFolderId 
                      ? `Folder: ${folders.find(f => f.id === selectedFolderId)?.name || 'Unknown'}` 
                      : 'All Files & Documents'} ({filteredNotes.length})
                  </span>
                </div>

                {filteredNotes.length === 0 ? (
                  <div className="files-empty-notice">
                    <FileText size={32} color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: '8px' }} />
                    <p>No notes found in this directory matching your search.</p>
                  </div>
                ) : (
                  <div className="library-notes-table">
                    <div className="notes-table-head">
                      <span className="col-title">Title & Summary</span>
                      <span className="col-folder">Folder / Book</span>
                      <span className="col-words">Words</span>
                      <span className="col-date">Updated</span>
                      <span className="col-actions">Actions</span>
                    </div>

                    <div className="notes-table-body">
                      {filteredNotes.map((note) => {
                        const noteFolder = folders.find(f => f.id === note.folderId);
                        const noteBook = books.find(b => b.id === note.bookId);
                        const wordCount = note.content.split(/\s+/).filter(Boolean).length;
                        const formattedDate = new Date(note.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        });

                        return (
                          <div key={note.id} className="notes-table-row">
                            <div className="col-title" onClick={() => handleOpenNoteAndExit(note.id)}>
                              <FileText size={14} className="note-type-icon" />
                              <div className="table-title-meta">
                                <strong className="table-note-title">{note.title || 'Untitled Note'}</strong>
                                <span className="table-note-snippet">
                                  {note.content.replace(/[#*`[\]]/g, '').slice(0, 90) || 'Empty note...'}
                                </span>
                              </div>
                            </div>

                            <div className="col-folder">
                              {noteFolder && (
                                <span className="table-folder-chip">
                                  <FolderIcon size={11} style={{ color: noteFolder.color }} />
                                  {noteFolder.name}
                                </span>
                              )}
                              {noteBook && (
                                <span className="table-book-chip">
                                  {noteBook.icon} {noteBook.title}
                                </span>
                              )}
                              {!noteFolder && !noteBook && (
                                <span className="table-chip-muted">Uncategorized</span>
                              )}
                            </div>

                            <div className="col-words">
                              {wordCount}w
                            </div>

                            <div className="col-date">
                              <Clock size={11} style={{ marginRight: '4px' }} />
                              {formattedDate}
                            </div>

                            <div className="col-actions">
                              <button
                                type="button"
                                className="table-action-btn"
                                onClick={() => handleOpenNoteAndExit(note.id)}
                                title="Open in Main Editor"
                              >
                                <ExternalLink size={13} />
                              </button>

                              {onSelectNoteSplit && (
                                <button
                                  type="button"
                                  className="table-action-btn"
                                  onClick={() => handleOpenNoteSplitAndExit(note.id)}
                                  title="Open Side-by-Side (Split)"
                                >
                                  <Columns2 size={13} />
                                </button>
                              )}

                              <button
                                type="button"
                                className="table-action-btn"
                                onClick={() => onDuplicateNote(note)}
                                title="Duplicate Note"
                              >
                                <Copy size={13} />
                              </button>

                              <button
                                type="button"
                                className="table-action-btn"
                                onClick={() => {
                                  setMovingNote(note);
                                  setTargetFolderChoice(note.folderId || '');
                                  setTargetBookChoice(note.bookId || '');
                                }}
                                title="Move to Folder / Book"
                              >
                                <Move size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MEDIA & ATTACHMENTS */}
          {activeTab === 'media' && (
            <div className="library-media-hub">
              {allMediaNotes.length === 0 ? (
                <div className="library-empty-box">
                  <Paperclip size={48} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                  <h3>No Media or Attachments Yet</h3>
                  <p>Documents with images, drawings, video embeds, or diagrams will appear here automatically.</p>
                </div>
              ) : (
                <div className="media-hub-grid">
                  {allMediaNotes.map((note) => {
                    const hasAttachments = note.attachments && note.attachments.length > 0;
                    const hasDiagram = note.content.includes('```mermaid');
                    const hasVideo = note.content.includes('<video') || note.content.includes('youtube.com');
                    const hasImage = note.content.includes('![');

                    return (
                      <div key={note.id} className="media-hub-card" onClick={() => handleOpenNoteAndExit(note.id)}>
                        <div className="media-card-top">
                          <span className="media-badge">
                            {hasDiagram ? '📊 Diagram' : hasVideo ? '🎬 Video' : hasImage ? '🖼️ Image' : '📎 Attachment'}
                          </span>
                          <span className="media-note-date">
                            {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <h4 className="media-card-title">{note.title || 'Untitled Note'}</h4>
                        <p className="media-card-desc">
                          {note.content.replace(/[#*`[\]]/g, '').slice(0, 80) || 'Contains attached assets'}
                        </p>
                        <div className="media-card-footer">
                          <span className="media-stats">
                            {hasAttachments ? `${note.attachments?.length} files` : 'Embedded Media'}
                          </span>
                          <button className="media-open-btn" onClick={(e) => { e.stopPropagation(); handleOpenNoteAndExit(note.id); }}>
                            Open Note <ExternalLink size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TAGS INDEX */}
          {activeTab === 'tags' && (
            <div className="library-tags-hub">
              {allTagsList.length === 0 ? (
                <div className="library-empty-box">
                  <Tag size={48} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                  <h3>No Tags Created Yet</h3>
                  <p>Add <code>#tags</code> in your notes or editor to automatically build a topic knowledge graph.</p>
                </div>
              ) : (
                <div className="tags-hub-container">
                  <div className="tags-cloud-shelf">
                    {allTagsList.map(([tag, count]) => (
                      <button
                        key={tag}
                        type="button"
                        className={`tags-shelf-pill ${selectedTag === tag ? 'active' : ''}`}
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      >
                        <Tag size={13} />
                        <span className="tag-name">#{tag}</span>
                        <span className="tag-shelf-count">{count}</span>
                      </button>
                    ))}
                  </div>

                  {selectedTag && (
                    <div className="tagged-notes-section">
                      <div className="tagged-section-header">
                        <h4>Notes tagged with <span>#{selectedTag}</span> ({filteredNotes.length})</h4>
                        <button className="btn-small-link" onClick={() => setSelectedTag(null)}>Clear filter</button>
                      </div>
                      <div className="tagged-notes-grid">
                        {filteredNotes.map((note) => (
                          <div key={note.id} className="tagged-note-card" onClick={() => handleOpenNoteAndExit(note.id)}>
                            <strong className="tagged-note-title">{note.title || 'Untitled'}</strong>
                            <p className="tagged-note-snippet">{note.content.replace(/[#*`[\]]/g, '').slice(0, 100)}</p>
                            <span className="tagged-note-date">Updated {new Date(note.updatedAt).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* MODAL: CREATE BOOK */}
        {isCreatingBook && (
          <div className="library-submodal-backdrop" onClick={() => setIsCreatingBook(false)}>
            <div className="library-submodal-card" onClick={(e) => e.stopPropagation()}>
              <h3 className="submodal-title">Create New Book or Notebook</h3>
              <form onSubmit={handleSaveBook}>
                <div className="form-group">
                  <label>Book Title</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Distributed Systems Handbook"
                    value={newBookTitle}
                    onChange={(e) => setNewBookTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Icon / Emoji</label>
                  <div className="emoji-picker-row">
                    {['📘', '📕', '📗', '📙', '📓', '📔', '🧠', '🔬', '💡', '🚀'].map((em) => (
                      <button
                        key={em}
                        type="button"
                        className={`emoji-pick-btn ${newBookIcon === em ? 'active' : ''}`}
                        onClick={() => setNewBookIcon(em)}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Cover Color Accent</label>
                  <div className="color-picker-row">
                    {['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'].map((col) => (
                      <button
                        key={col}
                        type="button"
                        className={`color-pick-circle ${newBookColor === col ? 'active' : ''}`}
                        style={{ backgroundColor: col }}
                        onClick={() => setNewBookColor(col)}
                      />
                    ))}
                  </div>
                </div>

                <div className="submodal-btn-row">
                  <button type="button" className="btn-cancel" onClick={() => setIsCreatingBook(false)}>Cancel</button>
                  <button type="submit" className="btn-confirm">Create Book</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CREATE FOLDER */}
        {isCreatingFolder && (
          <div className="library-submodal-backdrop" onClick={() => setIsCreatingFolder(false)}>
            <div className="library-submodal-card" onClick={(e) => e.stopPropagation()}>
              <h3 className="submodal-title">Create New Folder</h3>
              <form onSubmit={handleSaveFolder}>
                <div className="form-group">
                  <label>Folder Name</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Architecture Designs"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                </div>
                <div className="submodal-btn-row">
                  <button type="button" className="btn-cancel" onClick={() => setIsCreatingFolder(false)}>Cancel</button>
                  <button type="submit" className="btn-confirm">Create Folder</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: MOVE NOTE */}
        {movingNote && (
          <div className="library-submodal-backdrop" onClick={() => setMovingNote(null)}>
            <div className="library-submodal-card" onClick={(e) => e.stopPropagation()}>
              <h3 className="submodal-title">Move Note: {movingNote.title || 'Untitled'}</h3>
              
              <div className="form-group">
                <label>Destination Folder</label>
                <select 
                  value={targetFolderChoice} 
                  onChange={(e) => setTargetFolderChoice(e.target.value)}
                >
                  <option value="">(No Folder / Root)</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>📁 {f.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Organize into Book / Notebook</label>
                <select 
                  value={targetBookChoice} 
                  onChange={(e) => setTargetBookChoice(e.target.value)}
                >
                  <option value="">(Not in a Book)</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id}>{b.icon} {b.title}</option>
                  ))}
                </select>
              </div>

              <div className="submodal-btn-row">
                <button type="button" className="btn-cancel" onClick={() => setMovingNote(null)}>Cancel</button>
                <button type="button" className="btn-confirm" onClick={handleExecuteMove}>Save Changes</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

