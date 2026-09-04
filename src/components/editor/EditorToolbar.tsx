import React from 'react';
import type { Note, Folder, Book } from '../../types';
import { NOTE_TEMPLATES } from '../../services/templates';
import {
  Folder as FolderIcon,
  BookOpen,
  Hash,
  Copy,
  Move,
  Share2,
  Pin,
  Star,
  Lock,
  KeyRound,
  Minimize2,
  Maximize2,
  ArrowLeft,
  Archive,
  Trash2,
  LogOut,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough as StrikethroughIcon,
  Code as Code2,
  Subscript,
  Superscript,
  Highlighter as HighlighterIcon,
  LayoutTemplate,
  Scissors,
  CheckSquare,
  List,
  Table as TableIcon,
  Info,
  Code,
  Link,
  ExternalLink,
  Sigma,
  GitBranch,
  GitFork,
  TrendingUp,
  Puzzle,
  Box,
  Quote,
  Presentation,
  ScanText,
  GraduationCap,
  Network,
  Image as ImageIcon,
  Video as VideoIcon,
  ChevronDown,
  Sparkles,
  Columns,
  Edit3,
  Search,
  PenTool,
  ListTree,
  Mic,
  Columns2,
  XCircle
} from 'lucide-react';

export interface EditorToolbarProps {
  note: Note;
  folders: Folder[];
  books: Book[];
  isZenMode?: boolean;
  mode: 'live' | 'split' | 'source';
  setMode: (mode: 'live' | 'split' | 'source') => void;
  wordCount: number;
  charCount: number;
  // Row collapse states
  isRow1Open: boolean;
  isRow2Open: boolean;
  isRow3Open: boolean;
  isRow4Open: boolean;
  // In-editor toggles
  isFindReplaceOpen: boolean;
  onToggleFindReplace: () => void;
  isDrawingModalOpen: boolean;
  setIsDrawingModalOpen: (open: boolean) => void;
  isOutlineOpen: boolean;
  onToggleOutline: () => void;
  isMicEnabled: boolean;
  isVoiceRecorderOpen: boolean;
  onToggleVoiceRecorder: () => void;
  isSplitView?: boolean;
  onOpenSplit?: (noteId: string) => void;
  onCloseSplit?: () => void;
  // Typography states
  fontFamily: 'sans' | 'serif' | 'mono';
  setFontFamily: (val: 'sans' | 'serif' | 'mono') => void;
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  setFontSize: (val: 'sm' | 'base' | 'lg' | 'xl') => void;
  lineHeight: 'normal' | 'relaxed' | 'loose';
  setLineHeight: (val: 'normal' | 'relaxed' | 'loose') => void;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  setTextAlign: (val: 'left' | 'center' | 'right' | 'justify') => void;
  // Page setup states
  pageFormat: 'continuous' | 'a4' | 'letter';
  setPageFormat: (val: 'continuous' | 'a4' | 'letter') => void;
  pageMargin: 'normal' | 'compact' | 'wide';
  setPageMargin: (val: 'normal' | 'compact' | 'wide') => void;
  // Template menu state
  isTemplateMenuOpen: boolean;
  setIsTemplateMenuOpen: (open: boolean) => void;
  // Actions
  onUpdateNote: (updatedNote: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onToggleZenMode?: () => void;
  onDuplicateNote?: (note: Note) => void;
  onMoveNote?: (noteId: string, folderId: string | null, bookId: string | null) => void;
  onToggleArchiveNote?: (noteId: string) => void;
  onCloseNote?: () => void;
  onBackMobile?: () => void;
  insertFormatting: (prefix: string, suffix?: string) => void;
  handleToolbarLinkClick: () => void;
  handleToolbarDiagramClick: () => void;
  handleInsertTemplate: (templateContent: string) => void;
  handleFolderChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleBookChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  // Studio modal openers
  setIsMoveModalOpen: (open: boolean) => void;
  setMoveFolderChoice: (val: string) => void;
  setMoveBookChoice: (val: string) => void;
  setIsExportModalOpen: (open: boolean) => void;
  setIsCryptoModalOpen: (open: boolean) => void;
  setCryptoModalMode: (mode: 'lock' | 'unlock') => void;
  setIsInteractiveFlowOpen: (open: boolean) => void;
  setIsMathGraphStudioOpen: (open: boolean) => void;
  setIsBlocklyStudioOpen: (open: boolean) => void;
  setIsThreeStudioOpen: (open: boolean) => void;
  setIsCitationStudioOpen: (open: boolean) => void;
  setIsSlideDeckOpen: (open: boolean) => void;
  setIsOcrScannerOpen: (open: boolean) => void;
  setIsFlashcardQuizOpen: (open: boolean) => void;
  setIsNoteCanvasOpen: (open: boolean) => void;
  setIsInsertImageOpen: (open: boolean) => void;
  setIsVideoModalOpen: (open: boolean) => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  note,
  folders,
  books,
  isZenMode,
  mode,
  setMode,
  wordCount,
  charCount,
  isRow1Open,
  isRow2Open,
  isRow3Open,
  isRow4Open,
  isFindReplaceOpen,
  onToggleFindReplace,
  setIsDrawingModalOpen,
  isOutlineOpen,
  onToggleOutline,
  isMicEnabled,
  isVoiceRecorderOpen,
  onToggleVoiceRecorder,
  isSplitView,
  onOpenSplit,
  onCloseSplit,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  lineHeight,
  setLineHeight,
  textAlign,
  setTextAlign,
  pageFormat,
  setPageFormat,
  pageMargin,
  setPageMargin,
  isTemplateMenuOpen,
  setIsTemplateMenuOpen,
  onUpdateNote,
  onDeleteNote,
  onToggleZenMode,
  onDuplicateNote,
  onMoveNote,
  onToggleArchiveNote,
  onCloseNote,
  onBackMobile,
  insertFormatting,
  handleToolbarLinkClick,
  handleToolbarDiagramClick,
  handleInsertTemplate,
  handleFolderChange,
  handleBookChange,
  setIsMoveModalOpen,
  setMoveFolderChoice,
  setMoveBookChoice,
  setIsExportModalOpen,
  setIsCryptoModalOpen,
  setCryptoModalMode,
  setIsInteractiveFlowOpen,
  setIsMathGraphStudioOpen,
  setIsBlocklyStudioOpen,
  setIsThreeStudioOpen,
  setIsCitationStudioOpen,
  setIsSlideDeckOpen,
  setIsOcrScannerOpen,
  setIsFlashcardQuizOpen,
  setIsNoteCanvasOpen,
  setIsInsertImageOpen,
  setIsVideoModalOpen
}) => {
  return (
    <div className="editor-systematic-toolbar">
      {/* ROW 1: ACTIONS & META */}
      {isRow1Open && (
        <div className="toolbar-row-body row-1-actions">
          <div className="toolbar-inline-select">
            <FolderIcon size={13} color="var(--text-muted)" />
            <select
              className="editor-folder-select"
              value={note.folderId || ''}
              onChange={handleFolderChange}
              disabled={note.isTrashed}
              title="Move note to folder"
            >
              <option value="">(No Folder / Root)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="toolbar-inline-select">
            <BookOpen size={13} color="var(--accent-primary)" />
            <select
              className="editor-folder-select"
              value={note.bookId || ''}
              onChange={handleBookChange}
              disabled={note.isTrashed}
              title="Assign to Notebook / Book Chapter"
            >
              <option value="">(Not in a Book)</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>{b.icon} {b.title}</option>
              ))}
            </select>
          </div>

          <span className="toolbar-stat-pill">{wordCount}w · {charCount}c</span>

          <div className="toolbar-divider" />

          {/* Find & Search */}
          <button 
            type="button"
            className={`toolbar-btn ${isFindReplaceOpen ? 'active' : ''}`}
            onClick={onToggleFindReplace}
            title="Find & Replace in note (Cmd+F)"
          >
            <Search size={13} />
            <span>Find</span>
          </button>

          {/* Drawing */}
          <button 
            type="button"
            className="toolbar-btn" 
            onClick={() => setIsDrawingModalOpen(true)} 
            disabled={note.isTrashed} 
            title="Open Freehand Sketchpad"
          >
            <PenTool size={13} color="#8b5cf6" />
            <span>Draw</span>
          </button>

          {/* Outline */}
          <button 
            type="button"
            className={`toolbar-btn ${isOutlineOpen ? 'active' : ''}`}
            onClick={onToggleOutline}
            title="Document Outline"
          >
            <ListTree size={13} />
            <span>Outline</span>
          </button>

          {/* Voice memo */}
          {isMicEnabled && (
            <button 
              type="button"
              className={`toolbar-btn ${isVoiceRecorderOpen ? 'active' : ''}`}
              onClick={onToggleVoiceRecorder}
              disabled={note.isTrashed} 
              title="Record voice memo"
            >
              <Mic size={13} color="#ef4444" />
              <span>Voice</span>
            </button>
          )}

          {/* Split view */}
          {onOpenSplit && !isSplitView && (
            <button 
              type="button" 
              className="toolbar-btn" 
              onClick={() => onOpenSplit(note.id)}
              title="Open Split View (Side-by-Side)"
            >
              <Columns2 size={13} color="var(--accent-primary)" />
              <span>Split</span>
            </button>
          )}

          {isSplitView && onCloseSplit && (
            <button 
              type="button" 
              className="toolbar-btn danger" 
              onClick={onCloseSplit}
              title="Close Split View"
            >
              <XCircle size={13} />
              <span>Exit Split</span>
            </button>
          )}

          {note.pageOrder !== undefined && note.bookId && (
            <div className="toolbar-order-badge" title="Chapter Page Sequence">
              <Hash size={11} />
              <span>Ch. {note.pageOrder + 1}</span>
            </div>
          )}

          <div className="toolbar-divider" />

          {onDuplicateNote && (
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => onDuplicateNote(note)}
              title="Duplicate Note (Copy)"
            >
              <Copy size={13} />
            </button>
          )}

          {onMoveNote && (
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => {
                setMoveFolderChoice(note.folderId || '');
                setMoveBookChoice(note.bookId || '');
                setIsMoveModalOpen(true);
              }}
              title="Move Note"
            >
              <Move size={13} />
            </button>
          )}

          <button
            type="button"
            className="toolbar-btn"
            onClick={() => setIsExportModalOpen(true)}
            title="Export & Share"
          >
            <Share2 size={13} color="var(--accent-primary)" />
            <span>Export</span>
          </button>

          <button
            type="button"
            className={`toolbar-btn ${note.isPinned ? 'active' : ''}`}
            onClick={() => onUpdateNote({ ...note, isPinned: !note.isPinned })}
            disabled={note.isTrashed}
            title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
          >
            <Pin size={13} />
          </button>

          <button
            type="button"
            className={`toolbar-btn ${note.isFavorite ? 'active' : ''}`}
            onClick={() => onUpdateNote({ ...note, isFavorite: !note.isFavorite })}
            disabled={note.isTrashed}
            title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star size={13} fill={note.isFavorite ? '#f59e0b' : 'none'} color={note.isFavorite ? '#f59e0b' : undefined} />
          </button>

          <button
            type="button"
            className={`toolbar-btn ${note.isLocked ? 'active-lock' : ''}`}
            onClick={() => {
              setCryptoModalMode(note.isLocked ? 'unlock' : 'lock');
              setIsCryptoModalOpen(true);
            }}
            disabled={note.isTrashed}
            title={note.isLocked ? 'Unlock Encrypted Note' : 'Encrypt & Lock Note'}
          >
            {note.isLocked ? <Lock size={13} color="var(--color-warning)" /> : <KeyRound size={13} />}
          </button>

          <button
            type="button"
            className={`toolbar-btn ${isZenMode ? 'active' : ''}`}
            onClick={onToggleZenMode}
            title={isZenMode ? 'Exit Zen Mode' : 'Zen Focus Mode'}
          >
            {isZenMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          {onBackMobile && (
            <button
              type="button"
              className="toolbar-btn mobile-only"
              onClick={onBackMobile}
              title="Back to notes list"
            >
              <ArrowLeft size={13} />
              <span>Back</span>
            </button>
          )}

          {onToggleArchiveNote && (
            <button
              type="button"
              className={`toolbar-btn ${note.isArchived ? 'active' : ''}`}
              onClick={() => onToggleArchiveNote(note.id)}
              disabled={note.isTrashed}
              title={note.isArchived ? 'Unarchive note' : 'Archive note'}
            >
              <Archive size={13} color={note.isArchived ? '#8b5cf6' : undefined} />
            </button>
          )}

          <button
            type="button"
            className="toolbar-btn danger"
            onClick={() => onDeleteNote(note.id)}
            title={note.isTrashed ? 'Delete Forever' : 'Move note to Trash'}
          >
            <Trash2 size={13} />
          </button>

          {onCloseNote && (
            <button
              type="button"
              className="toolbar-btn exit-btn"
              onClick={onCloseNote}
              title="Exit Note"
            >
              <LogOut size={13} />
            </button>
          )}
        </div>
      )}

      {/* ROW 2: TYPOGRAPHY */}
      {isRow2Open && (
        <div className="toolbar-row-body row-2-typography">
          <button type="button" className="toolbar-btn" onClick={() => insertFormatting('# ')} disabled={note.isTrashed} title="Heading 1">
            <Heading1 size={14} />
            <span>H1</span>
          </button>
          <button type="button" className="toolbar-btn" onClick={() => insertFormatting('## ')} disabled={note.isTrashed} title="Heading 2">
            <Heading2 size={14} />
            <span>H2</span>
          </button>
          <button type="button" className="toolbar-btn" onClick={() => insertFormatting('### ')} disabled={note.isTrashed} title="Heading 3">
            <Heading3 size={14} />
            <span>H3</span>
          </button>

          <div className="toolbar-divider" />

          <select
            className="editor-font-select"
            value={fontFamily}
            onChange={(e) => {
              const val = e.target.value as any;
              setFontFamily(val);
              localStorage.setItem('milearnapp_editor_font_family', val);
            }}
            title="Font Family"
          >
            <option value="sans">Sans (Inter)</option>
            <option value="serif">Serif (Editorial)</option>
            <option value="mono">Mono (Code)</option>
          </select>

          <select
            className="editor-font-select"
            value={fontSize}
            onChange={(e) => {
              const val = e.target.value as any;
              setFontSize(val);
              localStorage.setItem('milearnapp_editor_font_size', val);
            }}
            title="Font Size"
          >
            <option value="sm">Small (13px)</option>
            <option value="base">Default (15px)</option>
            <option value="lg">Large (17px)</option>
            <option value="xl">Extra Large (19px)</option>
          </select>

          <select
            className="editor-font-select"
            value={lineHeight}
            onChange={(e) => setLineHeight(e.target.value as any)}
            title="Line Spacing / Height"
          >
            <option value="normal">Normal Line Spacing</option>
            <option value="relaxed">Relaxed (1.8x)</option>
            <option value="loose">Loose (2.1x)</option>
          </select>

          <div className="toolbar-divider" />

          <div className="editor-align-btn-group" style={{ display: 'inline-flex', gap: '2px' }}>
            <button
              type="button"
              className={`toolbar-btn ${textAlign === 'left' ? 'active' : ''}`}
              onClick={() => {
                setTextAlign('left');
                insertFormatting('<div align="left">\n\n', '\n\n</div>');
              }}
              disabled={note.isTrashed}
              title="Align Left"
            >
              <AlignLeft size={14} />
            </button>
            <button
              type="button"
              className={`toolbar-btn ${textAlign === 'center' ? 'active' : ''}`}
              onClick={() => {
                setTextAlign('center');
                insertFormatting('<div align="center">\n\n', '\n\n</div>');
              }}
              disabled={note.isTrashed}
              title="Align Center"
            >
              <AlignCenter size={14} />
            </button>
            <button
              type="button"
              className={`toolbar-btn ${textAlign === 'right' ? 'active' : ''}`}
              onClick={() => {
                setTextAlign('right');
                insertFormatting('<div align="right">\n\n', '\n\n</div>');
              }}
              disabled={note.isTrashed}
              title="Align Right"
            >
              <AlignRight size={14} />
            </button>
            <button
              type="button"
              className={`toolbar-btn ${textAlign === 'justify' ? 'active' : ''}`}
              onClick={() => {
                setTextAlign('justify');
                insertFormatting('<div style="text-align: justify;">\n\n', '\n\n</div>');
              }}
              disabled={note.isTrashed}
              title="Justify Text"
            >
              <AlignJustify size={14} />
            </button>
          </div>

          <div className="toolbar-divider" />

          <button type="button" className="toolbar-btn" onClick={() => insertFormatting('**', '**')} disabled={note.isTrashed} title="Bold (**text**)">
            <Bold size={14} />
          </button>
          <button type="button" className="toolbar-btn" onClick={() => insertFormatting('*', '*')} disabled={note.isTrashed} title="Italic (*text*)">
            <Italic size={14} />
          </button>
          <button type="button" className="toolbar-btn" onClick={() => insertFormatting('<u>', '</u>')} disabled={note.isTrashed} title="Underline (<u>text</u>)">
            <UnderlineIcon size={14} />
          </button>
          <button type="button" className="toolbar-btn" onClick={() => insertFormatting('~~', '~~')} disabled={note.isTrashed} title="Strikethrough (~~text~~)">
            <StrikethroughIcon size={14} />
          </button>
          <button type="button" className="toolbar-btn" onClick={() => insertFormatting('`', '`')} disabled={note.isTrashed} title="Inline Code (`code`)">
            <Code2 size={14} />
          </button>
          <button type="button" className="toolbar-btn" onClick={() => insertFormatting('<sub>', '</sub>')} disabled={note.isTrashed} title="Subscript (<sub>text</sub>)">
            <Subscript size={14} />
          </button>
          <button type="button" className="toolbar-btn" onClick={() => insertFormatting('<sup>', '</sup>')} disabled={note.isTrashed} title="Superscript (<sup>text</sup>)">
            <Superscript size={14} />
          </button>
          <button type="button" className="toolbar-btn" onClick={() => insertFormatting('<mark>', '</mark>')} disabled={note.isTrashed} title="Highlight (<mark>text</mark>)">
            <HighlighterIcon size={14} color="#f59e0b" />
            <span>Highlight</span>
          </button>
        </div>
      )}

      {/* ROW 3: FORMAT & PAGE SETUP */}
      {isRow3Open && (
        <div className="toolbar-row-body row-3-blocks row-3-format">
          <div className="toolbar-inline-select page-setup-select">
            <LayoutTemplate size={13} color="var(--accent-primary)" />
            <select
              className="editor-format-select"
              value={pageFormat}
              onChange={(e) => {
                const val = e.target.value as any;
                setPageFormat(val);
                localStorage.setItem('milearnapp_page_format', val);
              }}
              title="Document Page Setup (A4 Document, US Letter, Continuous Flow)"
            >
              <option value="continuous">📄 Continuous Flow</option>
              <option value="a4">📑 A4 Document (Print & PDF)</option>
              <option value="letter">📃 US Letter (8.5 × 11 in)</option>
            </select>
          </div>

          {pageFormat !== 'continuous' && (
            <div className="toolbar-inline-select page-setup-margins">
              <select
                className="editor-format-select"
                value={pageMargin}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setPageMargin(val);
                  localStorage.setItem('milearnapp_page_margin', val);
                }}
                title="Document Margins"
              >
                <option value="normal">Normal (24mm)</option>
                <option value="compact">Compact (12mm)</option>
                <option value="wide">Wide (36mm)</option>
              </select>
            </div>
          )}

          <button
            type="button"
            className="toolbar-btn"
            onClick={() => insertFormatting('\n\n---\n\n')}
            disabled={note.isTrashed}
            title="Insert Page Break / Slide Separator (---)"
          >
            <Scissors size={14} />
            <span>Page Break</span>
          </button>

          <div className="toolbar-divider" />

          <button type="button" className="toolbar-btn" onClick={() => insertFormatting('- [ ] ')} disabled={note.isTrashed} title="Task checklist">
            <CheckSquare size={14} />
            <span>Checklist Task</span>
          </button>
          <button type="button" className="toolbar-btn" onClick={() => insertFormatting('- ')} disabled={note.isTrashed} title="Bullet List">
            <List size={14} />
            <span>Bullet List</span>
          </button>
          <button type="button" className="toolbar-btn" onClick={() => insertFormatting('1. ')} disabled={note.isTrashed} title="Numbered List">
            <span style={{ fontSize: '12px', fontWeight: 600 }}>1.</span>
            <span>Numbered</span>
          </button>
          <button type="button" className="toolbar-btn" onClick={() => insertFormatting('\n| Header 1 | Header 2 |\n| :--- | :--- |\n| Item 1 | Item 2 |\n\n')} disabled={note.isTrashed} title="Insert Table">
            <TableIcon size={14} />
            <span>Table Grid</span>
          </button>
          <button type="button" className="toolbar-btn" onClick={() => insertFormatting('> [!NOTE]\n> ')} disabled={note.isTrashed} title="Callout Card">
            <Info size={14} />
            <span>Callout Box</span>
          </button>
          <button type="button" className="toolbar-btn" onClick={() => insertFormatting('```typescript\n', '\n```')} disabled={note.isTrashed} title="Code Block">
            <Code size={14} />
            <span>Code Block</span>
          </button>
          <button type="button" className="toolbar-btn" onClick={() => insertFormatting('> ')} disabled={note.isTrashed} title="Quote Block">
            <span style={{ fontSize: '14px', fontWeight: 700, fontStyle: 'italic' }}>“</span>
            <span>Blockquote</span>
          </button>
        </div>
      )}

      {/* ROW 4: MEDIA, ADVANCED & STUDIOS */}
      {isRow4Open && (
        <div className="toolbar-row-body row-4-advanced">
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => insertFormatting('[[', ']]')}
            disabled={note.isTrashed}
            title="Internal Note Link ([[Wiki-Link]])"
          >
            <Link size={14} />
            <span>[[Wiki]]</span>
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleToolbarLinkClick}
            disabled={note.isTrashed}
            title="Insert Web Link"
          >
            <ExternalLink size={14} />
            <span>[Web Link]</span>
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => insertFormatting('$$ ', ' $$')}
            disabled={note.isTrashed}
            title="Insert Mathematical Formula"
          >
            <Sigma size={14} />
            <span>Math Formula</span>
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleToolbarDiagramClick}
            disabled={note.isTrashed}
            title="Mermaid Diagram Studio"
          >
            <GitBranch size={14} color="#8b5cf6" />
            <span>Diagram</span>
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => setIsInteractiveFlowOpen(true)}
            disabled={note.isTrashed}
            title="Interactive Flow & Concept Canvas (@xyflow/react)"
          >
            <GitFork size={14} color="#818cf8" />
            <span>Flow Canvas</span>
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => setIsMathGraphStudioOpen(true)}
            disabled={note.isTrashed}
            title="2D Function Grapher & Scientific Calculator (Desmos & Advanced-Calculator)"
          >
            <TrendingUp size={14} color="#10b981" />
            <span>Graph/Calc</span>
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => setIsBlocklyStudioOpen(true)}
            disabled={note.isTrashed}
            title="Visual Logic & Block Programming (Google Blockly)"
          >
            <Puzzle size={14} color="#f59e0b" />
            <span>Blockly Code</span>
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => setIsThreeStudioOpen(true)}
            disabled={note.isTrashed}
            title="3D Interactive Geometry & Models (Three.js WebGL)"
          >
            <Box size={14} color="#06b6d4" />
            <span>3D Model</span>
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => setIsCitationStudioOpen(true)}
            disabled={note.isTrashed}
            title="Academic Citations & Bibliography Studio (Citation.js)"
          >
            <Quote size={14} color="#ec4899" />
            <span>Citations</span>
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => setIsSlideDeckOpen(true)}
            disabled={note.isTrashed}
            title="Present as Fullscreen Slide Deck (splits on ---)"
          >
            <Presentation size={14} color="#ec4899" />
            <span>Slide Deck</span>
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => setIsOcrScannerOpen(true)}
            disabled={note.isTrashed}
            title="OCR Scanner: Extract text from photos or textbook pages"
          >
            <ScanText size={14} color="#10b981" />
            <span>Scan Text</span>
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => setIsFlashcardQuizOpen(true)}
            disabled={note.isTrashed}
            title="Active Recall Flashcards & Spaced Repetition Quiz"
          >
            <GraduationCap size={14} color="var(--accent-primary)" />
            <span>Study Cards</span>
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => setIsNoteCanvasOpen(true)}
            disabled={note.isTrashed}
            title="Infinite Note Canvas: Map knowledge & connections (@xyflow/react)"
          >
            <Network size={14} color="#0ea5e9" />
            <span>Note Canvas</span>
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => setIsInsertImageOpen(true)}
            disabled={note.isTrashed}
            title="Insert Image"
          >
            <ImageIcon size={14} color="var(--accent-primary)" />
            <span>Image</span>
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => setIsVideoModalOpen(true)}
            disabled={note.isTrashed}
            title="Embed Video"
          >
            <VideoIcon size={14} color="#ef4444" />
            <span>Video</span>
          </button>

          {/* Templates Dropdown Button */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
              disabled={note.isTrashed}
              title="Insert Note Template"
            >
              <LayoutTemplate size={14} color="var(--accent-primary)" />
              <span>Template</span>
              <ChevronDown size={11} />
            </button>

            {isTemplateMenuOpen && (
              <div
                className="editor-suggestions-menu"
                style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', width: '260px', zIndex: 60 }}
              >
                <div className="suggestion-menu-header">
                  <span>Choose Template</span>
                </div>
                <div className="suggestion-items-list">
                  {NOTE_TEMPLATES.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      className="suggestion-item"
                      onClick={() => handleInsertTemplate(tmpl.content)}
                    >
                      <div className="suggestion-item-icon">
                        <LayoutTemplate size={14} color="var(--accent-primary)" />
                      </div>
                      <div className="suggestion-item-text">
                        <span className="suggestion-item-title">{tmpl.name}</span>
                        <span className="suggestion-item-sub">{tmpl.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* View Mode Selector: Live, Split, Markdown */}
          <div className="mode-toggle-group" style={{ marginLeft: 'auto' }}>
            <button
              type="button"
              className={`mode-btn ${mode === 'live' ? 'active' : ''}`}
              onClick={() => setMode('live')}
              title="Interactive Live Document (WYSIWYG)"
            >
              <Sparkles size={11} style={{ marginRight: '3px' }} />
              <span>Live</span>
            </button>
            <button
              type="button"
              className={`mode-btn ${mode === 'split' ? 'active' : ''}`}
              onClick={() => setMode('split')}
              title="Side-by-Side Split View"
            >
              <Columns size={11} style={{ marginRight: '3px' }} />
              <span>Split</span>
            </button>
            <button
              type="button"
              className={`mode-btn ${mode === 'source' ? 'active' : ''}`}
              onClick={() => setMode('source')}
              title="Raw Markdown Source Editor"
            >
              <Edit3 size={11} style={{ marginRight: '3px' }} />
              <span>Markdown</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
