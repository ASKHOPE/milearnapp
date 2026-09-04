import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { 
  Note, 
  Folder as FolderType, 
  Attachment,
  Book,
  Workspace
} from '../types';
import { 
  Trash2, 
  Link, 
  Edit3, 
  Share2,
  Folder as FolderIcon,
  Copy,
  Check,
  Info,
  Lightbulb,
  AlertTriangle,
  Zap,
  LayoutTemplate,
  ChevronDown,
  RotateCcw,
  Lock,
  Unlock,
  ChevronRight,
  Save,
  Sliders,
  Type,
  Printer,
  Download,
  FileCode,
  FileText,
  Sparkles
} from 'lucide-react';
import { AttachmentManager } from './AttachmentManager';
import { VoiceRecorder } from './VoiceRecorder';
import { EditorSuggestions } from './EditorSuggestions';
import type { SuggestionType } from './EditorSuggestions';
import { NoteOutline } from './NoteOutline';
import { NoteTabs } from './NoteTabs';
import { FindReplaceBar } from './FindReplaceBar';
import { EditorToolbar } from './editor/EditorToolbar';
import { EditorStudioModals } from './editor/EditorStudioModals';
import { EditorFooterStatus } from './editor/EditorFooterStatus';
import { ErrorBoundary } from './common/ErrorBoundary';
import { BookPageNavigator } from './BookPageNavigator';
import { MathRenderer } from './MathRenderer';
import { MermaidRenderer } from './MermaidRenderer';
import { LockNoteModal } from './LockNoteModal';
import { Button } from './ui/Button';
import { InteractiveTable } from './editor/InteractiveTable';
import { InteractiveTasks, type TaskItem } from './editor/InteractiveTasks';
import { WrappedImage, type ImageAlignMode, type ImageSizeMode } from './editor/WrappedImage';
import { InsertImageModal } from './editor/InsertImageModal';
import { LinkInsertModal } from './editor/LinkInsertModal';
import { MermaidEditorModal } from './editor/MermaidEditorModal';
import { scanTextToDiagram } from '../services/textToDiagram';
import { FloatingBubbleToolbar, type FloatingBubblePosition } from './editor/FloatingBubbleToolbar';
import { BlockActionsMenu } from './editor/BlockActionsMenu';
import { flashcardService } from '../services/flashcards';

interface NoteEditorProps {
  note: Note | null;
  folders: FolderType[];
  allNotes: Note[];
  books: Book[];
  activeWorkspace?: Workspace;
  openNoteIds: string[];
  activeNoteId: string | null;
  isMicEnabled: boolean;
  onSelectTab: (noteId: string) => void;
  onCloseTab: (noteId: string, e: React.MouseEvent) => void;
  onNewTab: () => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  onUpdateNote: (updatedNote: Note) => void;
  onDeleteNote: (noteId: string) => void; // Soft-delete to Trash
  onRestoreNote: (noteId: string) => void;
  onPermanentDeleteNote: (noteId: string) => void;
  onToggleArchiveNote: (noteId: string) => void;
  onAddPageToBook: (bookId: string) => void;
  onNavigateToNote: (noteTitle: string) => void;
  onBackMobile: () => void;
  isSplitView?: boolean;
  paneSide?: 'left' | 'right';
  onMoveTabToOtherPane?: (noteId: string) => void;
  onReorderTabs?: (newOrder: string[]) => void;
  onDropTabFromOtherPane?: (noteId: string, targetIndex?: number) => void;
  onCloseSplit?: () => void;
  onOpenSplit?: (noteId: string) => void;
  onCloseNote?: () => void;
  onDuplicateNote?: (note: Note) => void;
  onMoveNote?: (noteId: string, folderId: string | null, bookId: string | null) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  folders,
  allNotes,
  books,
  activeWorkspace,
  openNoteIds,
  activeNoteId,
  isMicEnabled,
  onSelectTab,
  onCloseTab,
  onNewTab,
  isZenMode,
  onToggleZenMode,
  onUpdateNote,
  onDeleteNote,
  onRestoreNote,
  onPermanentDeleteNote,
  onToggleArchiveNote,
  onAddPageToBook,
  onNavigateToNote,
  onBackMobile,
  isSplitView = false,
  paneSide = 'left',
  onMoveTabToOtherPane,
  onReorderTabs,
  onDropTabFromOtherPane,
  onCloseSplit,
  onOpenSplit,
  onCloseNote,
  onDuplicateNote,
  onMoveNote
}) => {
  const [mode, setMode] = useState<'live' | 'split' | 'source'>('live');
  const [isInsertImageOpen, setIsInsertImageOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCryptoModalOpen, setIsCryptoModalOpen] = useState(false);
  const [cryptoModalMode, setCryptoModalMode] = useState<'lock' | 'unlock'>('lock');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveFolderChoice, setMoveFolderChoice] = useState<string>('');
  const [moveBookChoice, setMoveBookChoice] = useState<string>('');

  // Smart Link & Mermaid Studio Modal states
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkInitialText, setLinkInitialText] = useState('');
  const [isMermaidModalOpen, setIsMermaidModalOpen] = useState(false);
  const [mermaidInitialCode, setMermaidInitialCode] = useState('');
  const [activeMermaidBlock, setActiveMermaidBlock] = useState<{ startLine: number; endLine: number } | null>(null);

  // Advanced Visual Studios Modal states
  const [isInteractiveFlowOpen, setIsInteractiveFlowOpen] = useState(false);
  const [isMathGraphStudioOpen, setIsMathGraphStudioOpen] = useState(false);
  const [isBlocklyStudioOpen, setIsBlocklyStudioOpen] = useState(false);
  const [isThreeStudioOpen, setIsThreeStudioOpen] = useState(false);
  const [isCitationStudioOpen, setIsCitationStudioOpen] = useState(false);
  const [isNoteCanvasOpen, setIsNoteCanvasOpen] = useState(false);
  const [isFlashcardQuizOpen, setIsFlashcardQuizOpen] = useState(false);
  const [isOcrScannerOpen, setIsOcrScannerOpen] = useState(false);
  const [isSlideDeckOpen, setIsSlideDeckOpen] = useState(false);

  // Share Dropdown & Page Setup Format States
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [pageFormat, setPageFormat] = useState<'continuous' | 'a4' | 'letter'>(() => {
    return (localStorage.getItem('milearnapp_page_format') as any) || 'continuous';
  });
  const [pageMargin, setPageMargin] = useState<'normal' | 'compact' | 'wide'>(() => {
    return (localStorage.getItem('milearnapp_page_margin') as any) || 'normal';
  });

  // Video Embed Modal state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Auto-Save & Manual Save Status
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
    return localStorage.getItem('milearnapp_autosave_enabled') !== 'false';
  });
  const pendingNoteRef = useRef<Note | null>(null);

  // Export note file helpers for Share dropdown
  const handleExportFile = (format: 'md' | 'html' | 'txt') => {
    if (!note) return;
    const cleanTitle = (note.title || 'Untitled Note').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${cleanTitle}.${format}`;
    let content = note.content;
    let mimeType = 'text/markdown';

    if (format === 'html') {
      mimeType = 'text/html';
      content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${note.title || 'Note'}</title><style>body{font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:40px auto;padding:0 24px;line-height:1.7;color:#1e293b;}h1{border-bottom:1px solid #e2e8f0;padding-bottom:8px;}</style></head><body><h1>${note.title || 'Untitled'}</h1><div>${note.content.replace(/\n/g, '<br/>')}</div></body></html>`;
    } else if (format === 'txt') {
      mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyNoteLink = () => {
    if (!note) return;
    const linkText = `[[${note.title || 'Untitled Note'}]]`;
    navigator.clipboard.writeText(linkText);
  };

  // 4-Row Toolbar Collapse States
  const [isRow1Open, setIsRow1Open] = useState<boolean>(() => {
    const saved = localStorage.getItem('milearnapp_editor_row1_open');
    return saved !== null ? saved === 'true' : true;
  });
  const [isRow2Open, setIsRow2Open] = useState<boolean>(() => {
    const saved = localStorage.getItem('milearnapp_editor_row2_open');
    return saved !== null ? saved === 'true' : true;
  });
  const [isRow3Open, setIsRow3Open] = useState<boolean>(() => {
    const saved = localStorage.getItem('milearnapp_editor_row3_open');
    return saved !== null ? saved === 'true' : true;
  });
  const [isRow4Open, setIsRow4Open] = useState<boolean>(() => {
    const saved = localStorage.getItem('milearnapp_editor_row4_open');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleRow = (rowNum: 1 | 2 | 3 | 4) => {
    if (rowNum === 1) {
      setIsRow1Open(prev => {
        localStorage.setItem('milearnapp_editor_row1_open', String(!prev));
        return !prev;
      });
    } else if (rowNum === 2) {
      setIsRow2Open(prev => {
        localStorage.setItem('milearnapp_editor_row2_open', String(!prev));
        return !prev;
      });
    } else if (rowNum === 3) {
      setIsRow3Open(prev => {
        localStorage.setItem('milearnapp_editor_row3_open', String(!prev));
        return !prev;
      });
    } else if (rowNum === 4) {
      setIsRow4Open(prev => {
        localStorage.setItem('milearnapp_editor_row4_open', String(!prev));
        return !prev;
      });
    }
  };

  // Sync auto-save setting across window storage events
  useEffect(() => {
    const handleStorage = () => {
      setAutoSaveEnabled(localStorage.getItem('milearnapp_autosave_enabled') !== 'false');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Manual Save Function
  const handleManualSave = useCallback(() => {
    if (!note || note.isTrashed) return;
    setSaveStatus('saving');
    onUpdateNote(pendingNoteRef.current || note);
    setTimeout(() => {
      setSaveStatus('saved');
    }, 400);
  }, [note, onUpdateNote]);

  // Typography & Styling Settings (RoosterJS / SunEditor / Froala)
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>(() => {
    return (localStorage.getItem('milearnapp_editor_font_family') as any) || 'sans';
  });
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>(() => {
    return (localStorage.getItem('milearnapp_editor_font_size') as any) || 'base';
  });
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [lineHeight, setLineHeight] = useState<'normal' | 'relaxed' | 'loose'>('normal');

  // Floating Contextual Bubble Toolbar state (Froala / Editor.js)
  const [bubblePosition, setBubblePosition] = useState<FloatingBubblePosition>({
    top: 0,
    left: 0,
    visible: false
  });
  const [flashcardToast, setFlashcardToast] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Suggestions state (Slash command & Wiki-link)
  const [suggestionState, setSuggestionState] = useState<{
    isOpen: boolean;
    type: SuggestionType;
    query: string;
    position: { top: number; left: number };
    triggerIndex: number;
  }>({
    isOpen: false,
    type: 'slash',
    query: '',
    position: { top: 0, left: 0 },
    triggerIndex: 0
  });

  const [activeSelectionRange, setActiveSelectionRange] = useState<{ start: number; end: number; selectedText: string } | null>(null);

  useEffect(() => {
    if (note) {
      pendingNoteRef.current = note;
    }
  }, [note]);

  // Keyboard shortcut listener (Cmd+F for search, Cmd+S for manual save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      if (cmdKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFindReplaceOpen((prev) => !prev);
      }

      if (cmdKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleManualSave]);

  // Selection change listener for Floating Bubble Toolbar (Froala / RoosterJS / Editor.js)
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) {
        setBubblePosition((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const text = selection.toString().trim();
      if (!text) {
        setBubblePosition((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      // Ensure selection is inside our note editor pane and not in tabs, headers, or toolbars
      const editorPane = document.querySelector('.note-editor-pane');
      const anchorNode = selection.anchorNode;
      if (!editorPane || !anchorNode || !editorPane.contains(anchorNode)) {
        setBubblePosition((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      // Ignore selections in tab bar, header bar, breadcrumbs, or toolbar buttons
      const anchorEl = anchorNode instanceof HTMLElement ? anchorNode : anchorNode.parentElement;
      if (anchorEl?.closest('.note-tabs-bar, .editor-header-bar, .editor-toolbar, .editor-tags-bar, .split-wm-toolbar')) {
        setBubblePosition((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      // Calculate bounding rect
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setBubblePosition({
          top: rect.top,
          left: rect.left + rect.width / 2 - 120,
          visible: true
        });

        // If in textarea mode, track cursor start/end
        if (textareaRef.current) {
          const start = textareaRef.current.selectionStart;
          const end = textareaRef.current.selectionEnd;
          setActiveSelectionRange({ start, end, selectedText: text });
        } else {
          setActiveSelectionRange({ start: -1, end: -1, selectedText: text });
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  if (!note) {
    return (
      <main className="note-editor-pane">
        <div className="empty-state">
          <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
            Select a note to view or create a new one
          </p>
        </div>
      </main>
    );
  }

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (note.isTrashed) return;
    const updated = {
      ...note,
      title: e.target.value,
      updatedAt: new Date().toISOString()
    };
    pendingNoteRef.current = updated;

    if (autoSaveEnabled) {
      onUpdateNote(updated);
      setSaveStatus('saved');
    } else {
      setSaveStatus('unsaved');
    }
  };

  // Handle content change & Slash / Wiki-link triggers
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (note.isTrashed) return;
    const newContent = e.target.value;
    const cursor = e.target.selectionStart;

    const updated = {
      ...note,
      content: newContent,
      updatedAt: new Date().toISOString()
    };
    pendingNoteRef.current = updated;

    if (autoSaveEnabled) {
      onUpdateNote(updated);
      setSaveStatus('saved');
    } else {
      setSaveStatus('unsaved');
    }

    // Check for Slash Command '/' or '[['
    const textBeforeCursor = newContent.slice(0, cursor);
    const lastSlash = textBeforeCursor.lastIndexOf('/');
    const lastDoubleBracket = textBeforeCursor.lastIndexOf('[[');

    if (lastDoubleBracket !== -1 && lastDoubleBracket > lastSlash && !textBeforeCursor.slice(lastDoubleBracket).includes(']]')) {
      const query = textBeforeCursor.slice(lastDoubleBracket + 2);
      const rect = e.target.getBoundingClientRect();
      setSuggestionState({
        isOpen: true,
        type: 'wikilink',
        query,
        position: { top: rect.top + 80, left: rect.left + 40 },
        triggerIndex: lastDoubleBracket
      });
      return;
    }

    if (lastSlash !== -1 && (lastSlash === 0 || textBeforeCursor[lastSlash - 1] === '\n' || textBeforeCursor[lastSlash - 1] === ' ')) {
      const query = textBeforeCursor.slice(lastSlash + 1);
      if (!query.includes(' ') && !query.includes('\n')) {
        const rect = e.target.getBoundingClientRect();
        setSuggestionState({
          isOpen: true,
          type: 'slash',
          query,
          position: { top: rect.top + 80, left: rect.left + 40 },
          triggerIndex: lastSlash
        });
        return;
      }
    }

    if (suggestionState.isOpen) {
      setSuggestionState((prev) => ({ ...prev, isOpen: false }));
    }
  };

  // Handle folder change
  const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (note.isTrashed) return;
    onUpdateNote({
      ...note,
      folderId: e.target.value || null,
      updatedAt: new Date().toISOString()
    });
  };

  // Handle book assignment
  const handleBookChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (note.isTrashed) return;
    const chosenBookId = e.target.value || null;
    const pages = allNotes.filter((n) => n.bookId === chosenBookId);
    onUpdateNote({
      ...note,
      bookId: chosenBookId,
      pageOrder: chosenBookId ? pages.length + 1 : undefined,
      updatedAt: new Date().toISOString()
    });
  };

  // Tag Management
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (note.isTrashed) return;
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      const cleanTag = newTagInput.trim().replace(/^#/, '');
      if (!note.tags.includes(cleanTag)) {
        onUpdateNote({
          ...note,
          tags: [...note.tags, cleanTag],
          updatedAt: new Date().toISOString()
        });
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (note.isTrashed) return;
    onUpdateNote({
      ...note,
      tags: note.tags.filter((t) => t !== tagToRemove),
      updatedAt: new Date().toISOString()
    });
  };

  // Markdown Formatting Helper
  const insertFormatting = (prefix: string, suffix = '') => {
    if (note.isTrashed) return;
    const textarea = textareaRef.current;
    if (!textarea) {
      let textToAppend = '';
      if (prefix.startsWith('```mermaid')) {
        textToAppend = `\n\n${prefix}\n`;
      } else if (prefix === '- [ ] ') {
        textToAppend = `\n\n- [ ] New Checklist Item\n`;
      } else if (prefix.includes('|')) {
        textToAppend = `\n${prefix}\n`;
      } else if (prefix === '[[') {
        textToAppend = ` [[New Note]] `;
      } else {
        textToAppend = `\n\n${prefix}Text${suffix}\n`;
      }
      onUpdateNote({
        ...note,
        content: (note.content ? note.content + textToAppend : textToAppend).trim(),
        updatedAt: new Date().toISOString()
      });
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = note.content;
    const selectedText = currentText.substring(start, end);

    let replacement = '';
    if (prefix === '- [ ] ') {
      replacement = `\n- [ ] ${selectedText || 'Task item'}\n`;
    } else if (prefix === '[[') {
      replacement = `[[${selectedText || 'Note Title'}]]`;
    } else {
      replacement = `${prefix}${selectedText || 'text'}${suffix}`;
    }

    const newContent = currentText.substring(0, start) + replacement + currentText.substring(end);
    onUpdateNote({
      ...note,
      content: newContent,
      updatedAt: new Date().toISOString()
    });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + replacement.length - suffix.length);
    }, 10);
  };

  // Floating Bubble Formatting Action Handler (Froala / Quill / SunEditor / RoosterJS)
  const handleApplyBubbleFormat = (formatType: string, value?: string) => {
    if (note.isTrashed) return;
    const selectedText = activeSelectionRange?.selectedText || '';

    let prefix = '';
    let suffix = '';

    switch (formatType) {
      case 'bold':
        prefix = '**';
        suffix = '**';
        break;
      case 'italic':
        prefix = '*';
        suffix = '*';
        break;
      case 'strikethrough':
        prefix = '~~';
        suffix = '~~';
        break;
      case 'underline':
        prefix = '<u>';
        suffix = '</u>';
        break;
      case 'code':
        prefix = '`';
        suffix = '`';
        break;
      case 'highlight':
        prefix = value ? `<mark style="background-color: ${value}; padding: 1px 4px; border-radius: 3px;">` : '<mark>';
        suffix = '</mark>';
        break;
      case 'color':
        prefix = `<span style="color: ${value || 'inherit'};">`;
        suffix = '</span>';
        break;
      case 'superscript':
        prefix = '<sup>';
        suffix = '</sup>';
        break;
      case 'subscript':
        prefix = '<sub>';
        suffix = '</sub>';
        break;
      case 'kbd':
        prefix = '<kbd>';
        suffix = '</kbd>';
        break;
      case 'wikilink':
        prefix = '[[';
        suffix = ']]';
        break;
      case 'cloze':
        prefix = '==';
        suffix = '==';
        break;
      case 'quote':
        prefix = '> ';
        suffix = '';
        break;
      case 'flashcard': {
        const cardTitle = selectedText.trim() || 'Key Concept';
        flashcardService.addManualCard({
          noteId: note.id,
          noteTitle: note.title || 'Untitled Note',
          question: cardTitle,
          answer: `Key concept highlighted from note: "${note.title || 'Untitled'}"`,
          type: 'concept',
          tags: note.tags || []
        });
        setFlashcardToast(`Flashcard created: "${cardTitle.slice(0, 24)}${cardTitle.length > 24 ? '...' : ''}" added to SM-2 Deck`);
        setTimeout(() => setFlashcardToast(null), 3200);
        setBubblePosition((prev) => ({ ...prev, visible: false }));
        return;
      }
      case 'link':
        setLinkInitialText(selectedText);
        setIsLinkModalOpen(true);
        setBubblePosition((prev) => ({ ...prev, visible: false }));
        return;
      case 'align-left':
        prefix = '\n<div align="left">\n';
        suffix = '\n</div>\n';
        break;
      case 'align-center':
        prefix = '\n<div align="center">\n';
        suffix = '\n</div>\n';
        break;
      case 'align-right':
        prefix = '\n<div align="right">\n';
        suffix = '\n</div>\n';
        break;
      default:
        break;
    }

    if (activeSelectionRange && activeSelectionRange.start !== -1 && textareaRef.current) {
      // Direct textarea replacement
      const { start, end } = activeSelectionRange;
      const current = note.content;
      const targetText = current.substring(start, end) || selectedText;
      const replaced = `${prefix}${targetText}${suffix}`;
      const newContent = current.substring(0, start) + replaced + current.substring(end);
      onUpdateNote({
        ...note,
        content: newContent,
        updatedAt: new Date().toISOString()
      });
    } else if (selectedText) {
      // Live preview DOM selection replacement
      const current = note.content;
      const idx = current.indexOf(selectedText);
      if (idx !== -1) {
        const replaced = `${prefix}${selectedText}${suffix}`;
        const newContent = current.slice(0, idx) + replaced + current.slice(idx + selectedText.length);
        onUpdateNote({
          ...note,
          content: newContent,
          updatedAt: new Date().toISOString()
        });
      }
    }

    setBubblePosition((prev) => ({ ...prev, visible: false }));
  };

  // Editor.js-Style Block Actions (Move, Duplicate, Delete, Convert)
  const handleMoveBlock = (startLine: number, endLine: number, direction: 'up' | 'down') => {
    if (note.isTrashed) return;
    const lines = note.content.split('\n');
    const blockCount = endLine - startLine + 1;
    const blockLines = lines.splice(startLine, blockCount);

    if (direction === 'up' && startLine > 0) {
      let targetIdx = startLine - 1;
      while (targetIdx > 0 && lines[targetIdx].trim() === '') {
        targetIdx--;
      }
      lines.splice(targetIdx, 0, ...blockLines);
    } else if (direction === 'down' && startLine < lines.length) {
      let targetIdx = startLine + 1;
      while (targetIdx < lines.length && lines[targetIdx].trim() === '') {
        targetIdx++;
      }
      lines.splice(Math.min(targetIdx + 1, lines.length), 0, ...blockLines);
    } else {
      // Re-insert if unable to move
      lines.splice(startLine, 0, ...blockLines);
      return;
    }

    onUpdateNote({
      ...note,
      content: lines.join('\n'),
      updatedAt: new Date().toISOString()
    });
  };

  const handleDuplicateBlock = (startLine: number, endLine: number) => {
    if (note.isTrashed) return;
    const lines = note.content.split('\n');
    const blockLines = lines.slice(startLine, endLine + 1);
    lines.splice(endLine + 1, 0, ...blockLines);

    onUpdateNote({
      ...note,
      content: lines.join('\n'),
      updatedAt: new Date().toISOString()
    });
  };

  const handleDeleteBlock = (startLine: number, endLine: number) => {
    if (note.isTrashed) return;
    const lines = note.content.split('\n');
    lines.splice(startLine, endLine - startLine + 1);

    onUpdateNote({
      ...note,
      content: lines.join('\n'),
      updatedAt: new Date().toISOString()
    });
  };

  const handleConvertBlockType = (startLine: number, endLine: number, newType: string) => {
    if (note.isTrashed) return;
    const lines = note.content.split('\n');
    for (let i = startLine; i <= endLine; i++) {
      const raw = lines[i];
      // strip existing prefixes
      const clean = raw
        .replace(/^#+\s*/, '')
        .replace(/^-\s\[[ x]\]\s*/, '')
        .replace(/^-\s*/, '')
        .replace(/^>\s*/, '');

      switch (newType) {
        case 'h1':
          lines[i] = `# ${clean}`;
          break;
        case 'h2':
          lines[i] = `## ${clean}`;
          break;
        case 'h3':
          lines[i] = `### ${clean}`;
          break;
        case 'task':
          lines[i] = `- [ ] ${clean}`;
          break;
        case 'list':
          lines[i] = `- ${clean}`;
          break;
        case 'quote':
          lines[i] = `> ${clean}`;
          break;
        case 'callout':
          lines[i] = `> [!NOTE]\n> ${clean}`;
          break;
        case 'paragraph':
        default:
          lines[i] = clean;
          break;
      }
    }

    onUpdateNote({
      ...note,
      content: lines.join('\n'),
      updatedAt: new Date().toISOString()
    });
  };

  // Insert Template into Note
  const handleInsertTemplate = (templateContent: string) => {
    if (note.isTrashed) return;
    const newContent = note.content ? `${note.content}\n\n${templateContent}` : templateContent;
    onUpdateNote({
      ...note,
      content: newContent,
      updatedAt: new Date().toISOString()
    });
    setIsTemplateMenuOpen(false);
  };

  // Handle Slash Command Selection
  const handleSelectSlashCommand = (snippet: string) => {
    const textarea = textareaRef.current;
    const currentText = note.content;
    const triggerIdx = suggestionState.triggerIndex;
    const cursor = textarea?.selectionStart || triggerIdx + 1;

    const newContent = currentText.slice(0, triggerIdx) + snippet + currentText.slice(cursor);
    onUpdateNote({
      ...note,
      content: newContent,
      updatedAt: new Date().toISOString()
    });

    setSuggestionState((prev) => ({ ...prev, isOpen: false }));
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const nextCursor = triggerIdx + snippet.length;
        textarea.setSelectionRange(nextCursor, nextCursor);
      }
    }, 10);
  };

  // Handle Wiki-Link Selection
  const handleSelectWikiLink = (noteTitle: string) => {
    const textarea = textareaRef.current;
    const currentText = note.content;
    const triggerIdx = suggestionState.triggerIndex;
    const cursor = textarea?.selectionStart || triggerIdx + 2;

    const replacement = `[[${noteTitle}]] `;
    const newContent = currentText.slice(0, triggerIdx) + replacement + currentText.slice(cursor);
    onUpdateNote({
      ...note,
      content: newContent,
      updatedAt: new Date().toISOString()
    });

    setSuggestionState((prev) => ({ ...prev, isOpen: false }));
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const nextCursor = triggerIdx + replacement.length;
        textarea.setSelectionRange(nextCursor, nextCursor);
      }
    }, 10);
  };

  // Checkbox toggle in interactive preview mode
  const handleToggleChecklist = (lineIndex: number) => {
    if (note.isTrashed) return;
    const lines = note.content.split('\n');
    const targetLine = lines[lineIndex];

    if (targetLine.includes('- [ ]')) {
      lines[lineIndex] = targetLine.replace('- [ ]', '- [x]');
    } else if (targetLine.includes('- [x]')) {
      lines[lineIndex] = targetLine.replace('- [x]', '- [ ]');
    }

    onUpdateNote({
      ...note,
      content: lines.join('\n'),
      updatedAt: new Date().toISOString()
    });
  };

  // Table update handler
  const handleUpdateTableLines = (startIndex: number, oldLength: number, newLines: string[]) => {
    if (note.isTrashed) return;
    const allLines = note.content.split('\n');
    allLines.splice(startIndex, oldLength, ...newLines);
    onUpdateNote({
      ...note,
      content: allLines.join('\n'),
      updatedAt: new Date().toISOString()
    });
  };

  // Task add & delete handlers
  const handleAddTask = (afterLineIndex: number, taskText: string) => {
    if (note.isTrashed) return;
    const allLines = note.content.split('\n');
    allLines.splice(afterLineIndex + 1, 0, `- [ ] ${taskText}`);
    onUpdateNote({
      ...note,
      content: allLines.join('\n'),
      updatedAt: new Date().toISOString()
    });
  };

  const handleDeleteTask = (lineIndex: number) => {
    if (note.isTrashed) return;
    const allLines = note.content.split('\n');
    allLines.splice(lineIndex, 1);
    onUpdateNote({
      ...note,
      content: allLines.join('\n'),
      updatedAt: new Date().toISOString()
    });
  };

  // Image properties updater (alignment, size, custom pixel width)
  const handleUpdateImageProps = (
    lineIndex: number, 
    newAlign: ImageAlignMode, 
    newSize: ImageSizeMode, 
    customWidth?: number
  ) => {
    if (note.isTrashed) return;
    const allLines = note.content.split('\n');
    const line = allLines[lineIndex] || '';
    const match = line.match(/^!\[(.*?)\]\((.*?)\)/);
    if (match) {
      const rawAlt = match[1];
      const cleanAlt = rawAlt.split('|')[0].trim();
      const url = match[2];
      let meta = `${cleanAlt}|${newAlign}|${newSize}`;
      if (newSize === 'custom' && customWidth) {
        meta += `|${customWidth}px`;
      }
      allLines[lineIndex] = `![${meta}](${url})`;
      onUpdateNote({
        ...note,
        content: allLines.join('\n'),
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Move image up or down across paragraphs
  const handleMoveImage = (lineIndex: number, direction: 'up' | 'down') => {
    if (note.isTrashed) return;
    const allLines = note.content.split('\n');
    const targetLine = allLines[lineIndex];
    if (!targetLine) return;

    if (direction === 'up' && lineIndex > 0) {
      let prevIdx = lineIndex - 1;
      while (prevIdx > 0 && allLines[prevIdx].trim() === '') {
        prevIdx--;
      }
      allLines.splice(lineIndex, 1);
      allLines.splice(prevIdx, 0, targetLine);
    } else if (direction === 'down' && lineIndex < allLines.length - 1) {
      let nextIdx = lineIndex + 1;
      while (nextIdx < allLines.length - 1 && allLines[nextIdx].trim() === '') {
        nextIdx++;
      }
      allLines.splice(lineIndex, 1);
      allLines.splice(nextIdx, 0, targetLine);
    }

    onUpdateNote({
      ...note,
      content: allLines.join('\n'),
      updatedAt: new Date().toISOString()
    });
  };

  // Diagram Toolbar & Scanner Handler
  const handleToolbarDiagramClick = () => {
    if (note.isTrashed) return;
    const textarea = textareaRef.current;
    let selected = '';
    if (textarea) {
      selected = note.content.slice(textarea.selectionStart, textarea.selectionEnd).trim();
    }

    if (selected) {
      const result = scanTextToDiagram(selected);
      setMermaidInitialCode(result.chartCode);
    } else {
      setMermaidInitialCode('');
    }
    setActiveMermaidBlock(null);
    setIsMermaidModalOpen(true);
  };

  // Save Diagram (either insert new block or update existing block)
  const handleSaveMermaidDiagram = (chartCode: string) => {
    if (note.isTrashed) return;

    // Case 1: Editing existing block in note
    if (activeMermaidBlock) {
      const { startLine, endLine } = activeMermaidBlock;
      const allLines = note.content.split('\n');
      allLines.splice(startLine + 1, endLine - startLine - 1, ...chartCode.split('\n'));
      onUpdateNote({
        ...note,
        content: allLines.join('\n'),
        updatedAt: new Date().toISOString()
      });
      setActiveMermaidBlock(null);
      return;
    }

    // Case 2: Inserting new diagram at cursor position
    const textarea = textareaRef.current;
    const block = `\n\`\`\`mermaid\n${chartCode}\n\`\`\`\n`;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = note.content.slice(0, start) + block + note.content.slice(end);
      onUpdateNote({
        ...note,
        content: newContent,
        updatedAt: new Date().toISOString()
      });
    } else {
      onUpdateNote({
        ...note,
        content: note.content + block,
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Smart Link Toolbar Handler
  const handleToolbarLinkClick = () => {
    if (note.isTrashed) return;
    const textarea = textareaRef.current;
    let selected = '';
    if (textarea) {
      selected = note.content.slice(textarea.selectionStart, textarea.selectionEnd).trim();
    }
    setLinkInitialText(selected);
    setIsLinkModalOpen(true);
  };

  const handleInsertLink = (markdownLink: string) => {
    if (note.isTrashed) return;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = note.content.slice(0, start) + markdownLink + note.content.slice(end);
      onUpdateNote({
        ...note,
        content: newContent,
        updatedAt: new Date().toISOString()
      });
    } else {
      onUpdateNote({
        ...note,
        content: note.content + ' ' + markdownLink,
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Insert image tag handler
  const handleInsertImageTag = (tag: string) => {
    if (note.isTrashed) return;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = note.content.slice(0, start) + '\n' + tag + '\n' + note.content.slice(end);
      onUpdateNote({
        ...note,
        content: newContent,
        updatedAt: new Date().toISOString()
      });
    } else {
      onUpdateNote({
        ...note,
        content: note.content + '\n\n' + tag,
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Attachment operations
  const handleAddAttachment = (att: Attachment) => {
    if (note.isTrashed) return;
    onUpdateNote({
      ...note,
      attachments: [...(note.attachments || []), att],
      updatedAt: new Date().toISOString()
    });
  };

  const handleDeleteAttachment = (attId: string) => {
    if (note.isTrashed) return;
    onUpdateNote({
      ...note,
      attachments: note.attachments.filter((a) => a.id !== attId),
      updatedAt: new Date().toISOString()
    });
  };

  // Scroll to heading from Outline
  const handleScrollToHeading = (lineIndex: number) => {
    const headingEl = document.getElementById(`heading-${lineIndex}`);
    if (headingEl) {
      headingEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (textareaRef.current && (mode === 'source' || mode === 'split')) {
      const lines = note.content.split('\n');
      let charCount = 0;
      for (let i = 0; i < lineIndex; i++) {
        charCount += lines[i].length + 1;
      }
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(charCount, charCount + (lines[lineIndex]?.length || 0));
    }
  };

  // Copy Code snippet helper
  const handleCopyCode = (codeText: string, blockId: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(blockId);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Calculate Backlinks
  const currentTitleClean = note.title.trim().toLowerCase();
  const backlinks = allNotes.filter((otherNote) => {
    if (otherNote.id === note.id || otherNote.isTrashed) return false;
    const pattern = `[[${currentTitleClean}]]`;
    return otherNote.content.toLowerCase().includes(pattern);
  });

  const wordCount = note.content.trim() ? note.content.trim().split(/\s+/).length : 0;
  const charCount = note.content.length;

  // Book pages lookup
  const currentBook = note.bookId ? books.find((b) => b.id === note.bookId) : null;
  const allBookPages = note.bookId ? allNotes.filter((n) => n.bookId === note.bookId && !n.isTrashed) : [];

  // Custom Markdown Parser
  const renderMarkdownPreview = (text: string) => {
    const lines = text.split('\n');
    let insideCodeBlock = false;
    let codeLanguage = 'code';
    let codeBuffer: string[] = [];

    let insideTable = false;
    let tableStartIndex = 0;
    let tableBuffer: string[] = [];

    let insideCallout = false;
    let calloutType: 'note' | 'tip' | 'warning' | 'important' = 'note';
    let calloutBuffer: string[] = [];

    let insideTasks = false;
    let taskBuffer: TaskItem[] = [];

    const elements: React.ReactNode[] = [];

    const parseInlineSpans = (str: string) => {
      // Regex splitting on WikiLinks, LaTeX, Highlights, Del/Strikethrough, Sub/Sup, Underline, Kbd, and HTML tags
      const parts = str.split(/(\[\[.*?\]\]|\$[^$]+\$|==.*?==|~~.*?~~|<mark[\s\S]*?<\/mark>|<kbd>.*?<\/kbd>|<sub>.*?<\/sub>|<sup>.*?<\/sup>|<u>.*?<\/u>|<span[\s\S]*?<\/span>)/g);
      return parts.map((part, i) => {
        if (!part) return null;

        // Wiki-link
        if (part.startsWith('[[') && part.endsWith(']]')) {
          const targetTitle = part.slice(2, -2).trim();
          return (
            <button
              key={i}
              className="wiki-link"
              onClick={() => onNavigateToNote(targetTitle)}
              title={`Jump to note: ${targetTitle}`}
            >
              <Link size={11} />
              <span>{targetTitle}</span>
            </button>
          );
        }

        // Inline LaTeX Math
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const mathExpr = part.slice(1, -1);
          return <MathRenderer key={i} math={mathExpr} />;
        }

        // Markdown Highlight ==text==
        if (part.startsWith('==') && part.endsWith('==') && part.length > 4) {
          const textContent = part.slice(2, -2);
          return (
            <mark key={i} className="editor-text-highlight">
              {textContent}
            </mark>
          );
        }

        // Markdown Strikethrough ~~text~~
        if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
          const textContent = part.slice(2, -2);
          return <del key={i}>{textContent}</del>;
        }

        // HTML <mark ...>...</mark>
        if (part.startsWith('<mark') && part.endsWith('</mark>')) {
          const innerMatch = part.match(/<mark(?:\s+style="([^"]*)")?>(.*?)<\/mark>/i);
          if (innerMatch) {
            const inlineStyle = innerMatch[1];
            const textContent = innerMatch[2];
            return (
              <mark
                key={i}
                className="editor-text-highlight"
                style={inlineStyle ? { backgroundColor: inlineStyle.replace(/.*background-color:\s*([^;]+).*/, '$1') } : {}}
              >
                {textContent}
              </mark>
            );
          }
        }

        // HTML <kbd>...</kbd>
        if (part.startsWith('<kbd>') && part.endsWith('</kbd>')) {
          return <kbd key={i} className="editor-inline-kbd">{part.slice(5, -6)}</kbd>;
        }

        // HTML <sub>...</sub>
        if (part.startsWith('<sub>') && part.endsWith('</sub>')) {
          return <sub key={i}>{part.slice(5, -6)}</sub>;
        }

        // HTML <sup>...</sup>
        if (part.startsWith('<sup>') && part.endsWith('</sup>')) {
          return <sup key={i}>{part.slice(5, -6)}</sup>;
        }

        // HTML <u>...</u>
        if (part.startsWith('<u>') && part.endsWith('</u>')) {
          return <u key={i}>{part.slice(3, -4)}</u>;
        }

        // HTML <span style="...">...</span>
        if (part.startsWith('<span') && part.endsWith('</span>')) {
          const spanMatch = part.match(/<span(?:\s+style="([^"]*)")?>(.*?)<\/span>/i);
          if (spanMatch) {
            const inlineStyle = spanMatch[1] || '';
            const textContent = spanMatch[2];
            const colorMatch = inlineStyle.match(/color:\s*([^;]+)/i);
            const colorHex = colorMatch ? colorMatch[1].trim() : undefined;
            return (
              <span key={i} style={{ color: colorHex }}>
                {textContent}
              </span>
            );
          }
        }

        return <span key={i}>{part}</span>;
      });
    };

    const flushTable = (keyIdx: number) => {
      if (tableBuffer.length < 2) {
        tableBuffer = [];
        insideTable = false;
        return;
      }
      elements.push(
        <div key={`table-wrap-${keyIdx}`} className="editorjs-block-row">
          <BlockActionsMenu
            target={{
              startLine: tableStartIndex,
              endLine: tableStartIndex + tableBuffer.length - 1,
              blockType: 'table',
              rawContent: tableBuffer.join('\n')
            }}
            onMoveBlock={handleMoveBlock}
            onDuplicateBlock={handleDuplicateBlock}
            onDeleteBlock={handleDeleteBlock}
            onConvertBlockType={handleConvertBlockType}
            isReadOnly={note.isTrashed}
          />
          <div className="editorjs-block-content">
            <InteractiveTable
              tableLines={tableBuffer}
              startIndex={tableStartIndex}
              onUpdateTableLines={handleUpdateTableLines}
              isReadOnly={note.isTrashed}
            />
          </div>
        </div>
      );
      tableBuffer = [];
      insideTable = false;
    };

    const flushTasks = (keyIdx: number) => {
      if (taskBuffer.length === 0) return;
      const startLine = taskBuffer[0].lineIndex;
      const endLine = taskBuffer[taskBuffer.length - 1].lineIndex;
      elements.push(
        <div key={`tasks-wrap-${keyIdx}`} className="editorjs-block-row">
          <BlockActionsMenu
            target={{
              startLine,
              endLine,
              blockType: 'task',
              rawContent: taskBuffer.map(t => `- [${t.isCompleted ? 'x' : ' '}] ${t.text}`).join('\n')
            }}
            onMoveBlock={handleMoveBlock}
            onDuplicateBlock={handleDuplicateBlock}
            onDeleteBlock={handleDeleteBlock}
            onConvertBlockType={handleConvertBlockType}
            isReadOnly={note.isTrashed}
          />
          <div className="editorjs-block-content">
            <InteractiveTasks
              tasks={[...taskBuffer]}
              onToggleTask={handleToggleChecklist}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              isReadOnly={note.isTrashed}
            />
          </div>
        </div>
      );
      taskBuffer = [];
      insideTasks = false;
    };

    const flushCallout = (keyIdx: number) => {
      const iconMap = {
        note: <Info size={16} color="var(--color-info)" />,
        tip: <Lightbulb size={16} color="var(--color-success)" />,
        warning: <AlertTriangle size={16} color="var(--color-warning)" />,
        important: <Zap size={16} color="var(--color-purple)" />
      };

      elements.push(
        <div key={`callout-${keyIdx}`} className="editorjs-block-row">
          <div className={`callout-box callout-${calloutType} editorjs-block-content`}>
            <div className="callout-title-row">
              {iconMap[calloutType]}
              <span>{calloutType.toUpperCase()}</span>
            </div>
            <div className="callout-content-text">
              {calloutBuffer.map((line, idx) => (
                <p key={idx}>{parseInlineSpans(line)}</p>
              ))}
            </div>
          </div>
        </div>
      );
      calloutBuffer = [];
      insideCallout = false;
    };

    let codeBlockStartIndex = 0;

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];

      // Code Block parsing
      if (line.startsWith('```')) {
        if (insideTable) flushTable(index);
        if (insideCallout) flushCallout(index);
        if (insideTasks) flushTasks(index);

        if (insideCodeBlock) {
          const codeText = codeBuffer.join('\n');
          const blockId = `code-block-${index}`;
          const isCopied = copiedCodeId === blockId;

          // Mermaid Diagram with interactive Edit callback
          if (codeLanguage === 'mermaid') {
            const startLine = codeBlockStartIndex;
            const endLine = index;
            elements.push(
              <ErrorBoundary key={blockId} name="Mermaid Diagram">
                <MermaidRenderer 
                  chart={codeText} 
                  id={blockId}
                  onEditChart={(newChart) => {
                    setActiveMermaidBlock({ startLine, endLine });
                    setMermaidInitialCode(newChart);
                    setIsMermaidModalOpen(true);
                  }}
                />
              </ErrorBoundary>
            );
          } else if (codeLanguage === 'math' || codeLanguage === 'latex') {
            elements.push(
              <ErrorBoundary key={blockId} name="Math Formula">
                <MathRenderer math={codeText} block />
              </ErrorBoundary>
            );
          } else {
            elements.push(
              <div key={blockId} className="editorjs-block-row">
                <BlockActionsMenu
                  target={{
                    startLine: codeBlockStartIndex,
                    endLine: index,
                    blockType: 'code',
                    rawContent: codeText
                  }}
                  onMoveBlock={handleMoveBlock}
                  onDuplicateBlock={handleDuplicateBlock}
                  onDeleteBlock={handleDeleteBlock}
                  onConvertBlockType={handleConvertBlockType}
                  isReadOnly={note.isTrashed}
                />
                <div className="code-block-container editorjs-block-content">
                  <div className="code-block-header">
                    <span>{codeLanguage || 'code'}</span>
                    <button 
                      className="btn-copy-code"
                      onClick={() => handleCopyCode(codeText, blockId)}
                      title="Copy code to clipboard"
                    >
                      {isCopied ? <Check size={12} color="var(--color-success)" /> : <Copy size={12} />}
                      <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre style={{ margin: 0, padding: '12px 14px' }}>
                    <code>{codeText}</code>
                  </pre>
                </div>
              </div>
            );
          }
          codeBuffer = [];
          insideCodeBlock = false;
        } else {
          insideCodeBlock = true;
          codeBlockStartIndex = index;
          codeLanguage = line.slice(3).trim().toLowerCase() || 'code';
        }
        continue;
      }

      if (insideCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // Standalone Block Math ($$ ... $$)
      if (line.startsWith('$$') && line.endsWith('$$') && line.length > 4) {
        if (insideTable) flushTable(index);
        if (insideCallout) flushCallout(index);
        if (insideTasks) flushTasks(index);

        elements.push(
          <MathRenderer key={`math-block-${index}`} math={line.slice(2, -2)} block />
        );
        continue;
      }

      // Embedded Video Card / iFrame detection (<div class="embedded-video-card"> or <video ...>)
      if (line.includes('embedded-video-card') || line.includes('<video controls')) {
        if (insideTable) flushTable(index);
        if (insideCallout) flushCallout(index);
        if (insideTasks) flushTasks(index);

        // Gather HTML until closing tag
        let videoHtml = line;
        let endIdx = index;
        if (!line.includes('</div>') && !line.includes('</video>')) {
          while (endIdx + 1 < lines.length && !lines[endIdx].includes('</div>') && !lines[endIdx].includes('</video>')) {
            endIdx++;
            videoHtml += '\n' + lines[endIdx];
          }
          index = endIdx;
        }

        elements.push(
          <div 
            key={`video-${index}`} 
            className="editor-embedded-video-wrapper"
            dangerouslySetInnerHTML={{ __html: videoHtml }} 
          />
        );
        continue;
      }

      // Collapsible / Spoiler Details (<details><summary>...</summary>...)
      if (line.startsWith('<details>')) {
        if (insideTable) flushTable(index);
        if (insideCallout) flushCallout(index);
        if (insideTasks) flushTasks(index);

        let detailsContent: string[] = [];
        let endIdx = index + 1;
        while (endIdx < lines.length && !lines[endIdx].includes('</details>')) {
          detailsContent.push(lines[endIdx]);
          endIdx++;
        }
        index = endIdx;

        let summaryText = 'Click to expand';
        if (detailsContent[0]?.startsWith('<summary>')) {
          summaryText = detailsContent[0].replace(/<\/?summary>/g, '').trim();
          detailsContent.shift();
        }

        elements.push(
          <details key={`details-${index}`} className="editor-collapsible-spoiler">
            <summary className="spoiler-summary">
              <ChevronRight size={14} className="summary-chevron" />
              <span>{summaryText}</span>
            </summary>
            <div className="spoiler-body">
              {renderMarkdownPreview(detailsContent.join('\n'))}
            </div>
          </details>
        );
        continue;
      }

      // Image with optional text wrap & sizing: ![caption|align|size|width](url)
      const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)/);
      if (imgMatch) {
        if (insideTable) flushTable(index);
        if (insideCallout) flushCallout(index);
        if (insideTasks) flushTasks(index);

        const rawAlt = imgMatch[1];
        const url = imgMatch[2];
        let align: ImageAlignMode = 'center';
        let size: ImageSizeMode = 'normal';
        let customWidth: number | undefined = undefined;
        let caption = rawAlt;

        if (rawAlt.includes('|')) {
          const parts = rawAlt.split('|');
          caption = parts[0].trim();
          for (let p = 1; p < parts.length; p++) {
            const part = parts[p].trim().toLowerCase();
            if (['left', 'right', 'center', 'full'].includes(part)) {
              align = part as ImageAlignMode;
            } else if (['small', 'normal', 'large', 'original', 'custom'].includes(part)) {
              size = part as ImageSizeMode;
            } else if (part.endsWith('px')) {
              customWidth = parseInt(part, 10) || undefined;
              if (customWidth) size = 'custom';
            }
          }
        }

        elements.push(
          <div key={`img-wrap-${index}`} className="editorjs-block-row">
            <BlockActionsMenu
              target={{
                startLine: index,
                endLine: index,
                blockType: 'image',
                rawContent: line
              }}
              onMoveBlock={handleMoveBlock}
              onDuplicateBlock={handleDuplicateBlock}
              onDeleteBlock={handleDeleteBlock}
              onConvertBlockType={handleConvertBlockType}
              isReadOnly={note.isTrashed}
            />
            <div className="editorjs-block-content" style={{ width: '100%' }}>
              <WrappedImage
                src={url}
                alt={caption}
                align={align}
                size={size}
                customWidth={customWidth}
                lineIndex={index}
                onUpdateImageProps={handleUpdateImageProps}
                onMoveImage={handleMoveImage}
                isReadOnly={note.isTrashed}
              />
            </div>
          </div>
        );
        continue;
      }

      // Markdown Tables
      if (line.startsWith('|') && line.endsWith('|')) {
        if (insideTasks) flushTasks(index);
        if (!insideTable) {
          insideTable = true;
          tableStartIndex = index;
          tableBuffer = [];
        }
        tableBuffer.push(line);
        continue;
      } else if (insideTable) {
        flushTable(index);
      }

      // Callout Boxes (> [!NOTE])
      const calloutMatch = line.match(/^>\s\[!(NOTE|TIP|WARNING|IMPORTANT)\]/i);
      if (calloutMatch) {
        if (insideTasks) flushTasks(index);
        if (insideCallout) flushCallout(index);
        insideCallout = true;
        calloutType = calloutMatch[1].toLowerCase() as any;
        continue;
      }

      if (insideCallout) {
        if (line.startsWith('>')) {
          calloutBuffer.push(line.replace(/^>\s?/, ''));
          continue;
        } else {
          flushCallout(index);
        }
      }

      // Interactive Tasks / Checklists: - [ ] or - [x]
      const checkMatch = line.match(/^-\s\[([ x])\]\s(.*)/);
      if (checkMatch) {
        if (!insideTasks) {
          insideTasks = true;
          taskBuffer = [];
        }
        const isCompleted = checkMatch[1] === 'x';
        const itemText = checkMatch[2];
        taskBuffer.push({ lineIndex: index, text: itemText, isCompleted });
        continue;
      } else if (insideTasks) {
        flushTasks(index);
      }

      // Center-aligned div wrapper
      if (line.startsWith('<div align="center">') || line.startsWith('<div align="right">')) {
        const alignMode = line.includes('center') ? 'center' : 'right';
        let innerCenterLines: string[] = [];
        let endIdx = index + 1;
        while (endIdx < lines.length && !lines[endIdx].includes('</div>')) {
          innerCenterLines.push(lines[endIdx]);
          endIdx++;
        }
        index = endIdx;
        elements.push(
          <div key={`align-${index}`} style={{ textAlign: alignMode, margin: '8px 0' }}>
            {renderMarkdownPreview(innerCenterLines.join('\n'))}
          </div>
        );
        continue;
      }

      // Headings with Editor.js Tune Handles
      if (line.startsWith('# ')) {
        elements.push(
          <div key={`h1-row-${index}`} className="editorjs-block-row">
            <BlockActionsMenu
              target={{ startLine: index, endLine: index, blockType: 'heading1', rawContent: line }}
              onMoveBlock={handleMoveBlock}
              onDuplicateBlock={handleDuplicateBlock}
              onDeleteBlock={handleDeleteBlock}
              onConvertBlockType={handleConvertBlockType}
              isReadOnly={note.isTrashed}
            />
            <h1 id={`heading-${index}`} className="editorjs-block-content">{parseInlineSpans(line.slice(2))}</h1>
          </div>
        );
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <div key={`h2-row-${index}`} className="editorjs-block-row">
            <BlockActionsMenu
              target={{ startLine: index, endLine: index, blockType: 'heading2', rawContent: line }}
              onMoveBlock={handleMoveBlock}
              onDuplicateBlock={handleDuplicateBlock}
              onDeleteBlock={handleDeleteBlock}
              onConvertBlockType={handleConvertBlockType}
              isReadOnly={note.isTrashed}
            />
            <h2 id={`heading-${index}`} className="editorjs-block-content">{parseInlineSpans(line.slice(3))}</h2>
          </div>
        );
        continue;
      }
      if (line.startsWith('### ')) {
        elements.push(
          <div key={`h3-row-${index}`} className="editorjs-block-row">
            <BlockActionsMenu
              target={{ startLine: index, endLine: index, blockType: 'heading3', rawContent: line }}
              onMoveBlock={handleMoveBlock}
              onDuplicateBlock={handleDuplicateBlock}
              onDeleteBlock={handleDeleteBlock}
              onConvertBlockType={handleConvertBlockType}
              isReadOnly={note.isTrashed}
            />
            <h3 id={`heading-${index}`} className="editorjs-block-content">{parseInlineSpans(line.slice(4))}</h3>
          </div>
        );
        continue;
      }

      if (line.startsWith('> ')) {
        elements.push(
          <div key={`quote-row-${index}`} className="editorjs-block-row">
            <BlockActionsMenu
              target={{ startLine: index, endLine: index, blockType: 'quote', rawContent: line }}
              onMoveBlock={handleMoveBlock}
              onDuplicateBlock={handleDuplicateBlock}
              onDeleteBlock={handleDeleteBlock}
              onConvertBlockType={handleConvertBlockType}
              isReadOnly={note.isTrashed}
            />
            <blockquote className="editorjs-block-content">
              {parseInlineSpans(line.slice(2))}
            </blockquote>
          </div>
        );
        continue;
      }

      if (line.trim() === '---' || line.trim() === '***') {
        elements.push(<hr key={`hr-${index}`} style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '16px 0' }} />);
        continue;
      }

      if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <div key={`ul-row-${index}`} className="editorjs-block-row">
            <BlockActionsMenu
              target={{ startLine: index, endLine: index, blockType: 'list', rawContent: line }}
              onMoveBlock={handleMoveBlock}
              onDuplicateBlock={handleDuplicateBlock}
              onDeleteBlock={handleDeleteBlock}
              onConvertBlockType={handleConvertBlockType}
              isReadOnly={note.isTrashed}
            />
            <ul className="editorjs-block-content" style={{ margin: '3px 0' }}>
              <li>{parseInlineSpans(line.slice(2))}</li>
            </ul>
          </div>
        );
        continue;
      }

      if (!line.trim()) {
        elements.push(<div key={`br-${index}`} style={{ height: '8px' }} />);
        continue;
      }

      // Paragraph with block handle
      elements.push(
        <div key={`p-row-${index}`} className="editorjs-block-row">
          <BlockActionsMenu
            target={{ startLine: index, endLine: index, blockType: 'paragraph', rawContent: line }}
            onMoveBlock={handleMoveBlock}
            onDuplicateBlock={handleDuplicateBlock}
            onDeleteBlock={handleDeleteBlock}
            onConvertBlockType={handleConvertBlockType}
            isReadOnly={note.isTrashed}
          />
          <p className="editorjs-block-content">{parseInlineSpans(line)}</p>
        </div>
      );
    }

    if (insideTable) flushTable(lines.length);
    if (insideCallout) flushCallout(lines.length);
    if (insideTasks) flushTasks(lines.length);

    return elements;
  };

  return (
    <main className="note-editor-pane active-mobile selectable-text">
      {/* Mac-Style Note Tabs Bar with Inline Double-Click Rename & Drag-and-Drop + Integrated Row Toggles */}
      <NoteTabs
        openNoteIds={openNoteIds}
        activeNoteId={activeNoteId}
        allNotes={allNotes}
        paneSide={paneSide}
        isSplitView={isSplitView}
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
        onNewTab={onNewTab}
        onMoveTabToOtherPane={onMoveTabToOtherPane}
        onReorderTabs={onReorderTabs}
        onDropTabFromOtherPane={onDropTabFromOtherPane}
        rightToolbar={
          <div className="tabs-embedded-toolbar-strip">
            {/* Quick Row Toggle Pills */}
            <div className="tab-row-pill-group">
              <button
                type="button"
                className={`tab-row-pill ${isRow1Open ? 'active' : ''}`}
                onClick={() => toggleRow(1)}
                title="Toggle Row 1: Actions & Meta"
              >
                <Sliders size={11} />
                <span>Actions</span>
              </button>
              <button
                type="button"
                className={`tab-row-pill ${isRow2Open ? 'active' : ''}`}
                onClick={() => toggleRow(2)}
                title="Toggle Row 2: Typography & Styling"
              >
                <Type size={11} />
                <span>Typography</span>
              </button>
              <button
                type="button"
                className={`tab-row-pill ${isRow3Open ? 'active' : ''}`}
                onClick={() => toggleRow(3)}
                title="Toggle Row 3: Format & Page Setup (A4, Lists, Tables)"
              >
                <LayoutTemplate size={11} />
                <span>Format</span>
              </button>
              <button
                type="button"
                className={`tab-row-pill ${isRow4Open ? 'active' : ''}`}
                onClick={() => toggleRow(4)}
                title="Toggle Row 4: Media, Links & Studios"
              >
                <Sparkles size={11} />
                <span>Media</span>
              </button>

              {/* Share & Export Dropdown Button right next to Media */}
              <div className="tab-share-menu-container" style={{ position: 'relative' }}>
                <button
                  type="button"
                  className={`tab-row-pill tab-share-pill ${isShareMenuOpen ? 'active' : ''}`}
                  onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
                  title="Share & Export Note (PDF, Markdown, HTML, Link)"
                >
                  <Share2 size={11} color="var(--accent-primary)" />
                  <span>Share</span>
                  <ChevronDown size={10} />
                </button>

                {isShareMenuOpen && (
                  <>
                    <div className="dropdown-backdrop" onClick={() => setIsShareMenuOpen(false)} />
                    <div className="tab-share-dropdown-menu">
                      <div className="share-menu-header">
                        <span>Export & Share Note</span>
                      </div>
                      <button
                        type="button"
                        className="share-menu-item"
                        onClick={() => {
                          setIsShareMenuOpen(false);
                          window.print();
                        }}
                        title="Print Document or Save as PDF"
                      >
                        <Printer size={13} color="var(--accent-primary)" />
                        <div className="share-item-details">
                          <strong>Export PDF / Print</strong>
                          <span>Printable document with A4 styling</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="share-menu-item"
                        onClick={() => {
                          setIsShareMenuOpen(false);
                          handleExportFile('md');
                        }}
                        title="Download Markdown file (.md)"
                      >
                        <Download size={13} color="#10b981" />
                        <div className="share-item-details">
                          <strong>Export Markdown (.md)</strong>
                          <span>Standard GFM format with frontmatter</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="share-menu-item"
                        onClick={() => {
                          setIsShareMenuOpen(false);
                          handleExportFile('html');
                        }}
                        title="Download standalone HTML file"
                      >
                        <FileCode size={13} color="#f59e0b" />
                        <div className="share-item-details">
                          <strong>Export HTML (.html)</strong>
                          <span>Self-contained standalone webpage</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="share-menu-item"
                        onClick={() => {
                          setIsShareMenuOpen(false);
                          handleExportFile('txt');
                        }}
                        title="Download plain text file (.txt)"
                      >
                        <FileText size={13} color="var(--text-muted)" />
                        <div className="share-item-details">
                          <strong>Export Plain Text (.txt)</strong>
                          <span>Clean unformatted text</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="share-menu-item"
                        onClick={() => {
                          setIsShareMenuOpen(false);
                          handleCopyNoteLink();
                        }}
                        title="Copy Markdown Link [[Note Title]]"
                      >
                        <Link size={13} color="#8b5cf6" />
                        <div className="share-item-details">
                          <strong>Copy Wiki-Link</strong>
                          <span>[[{note?.title || 'Untitled'}]]</span>
                        </div>
                      </button>
                      <div className="share-menu-divider" />
                      <button
                        type="button"
                        className="share-menu-item studio-trigger"
                        onClick={() => {
                          setIsShareMenuOpen(false);
                          setIsExportModalOpen(true);
                        }}
                        title="Open Full Export Studio"
                      >
                        <Sparkles size={13} color="var(--accent-primary)" />
                        <div className="share-item-details">
                          <strong>All Export Options...</strong>
                          <span>EPUB, JSON backup & styling</span>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Save Pill */}
            <button
              type="button"
              className={`editor-save-btn tab-save-btn ${saveStatus}`}
              onClick={handleManualSave}
              disabled={note.isTrashed || saveStatus === 'saving'}
              title="Save Note (Cmd+S / Ctrl+S)"
            >
              <Save size={12} />
              <span>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'unsaved' ? 'Save' : 'Saved'}</span>
            </button>
          </div>
        }
        onRenameTab={(noteId, newTitle) => {
          const target = allNotes.find((n) => n.id === noteId);
          if (target && !target.isTrashed) {
            onUpdateNote({
              ...target,
              title: newTitle,
              updatedAt: new Date().toISOString()
            });
          }
        }}
      />

      {/* Trash Recovery Warning Banner */}
      {note.isTrashed && (
        <div className="trash-warning-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={16} color="#ef4444" />
            <span>This note is in the Trash. Editing is disabled.</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn-small-primary" 
              onClick={() => onRestoreNote(note.id)}
            >
              <RotateCcw size={12} />
              <span>Restore Note</span>
            </button>
            <button 
              className="btn-small-ghost danger"
              onClick={() => {
                if (confirm('Permanently delete this note? This action cannot be undone.')) {
                  onPermanentDeleteNote(note.id);
                }
              }}
            >
              Delete Forever
            </button>
          </div>
        </div>
      )}

      {/* In-Note Find & Replace Bar */}
      <FindReplaceBar
        isOpen={isFindReplaceOpen}
        content={note.content}
        onClose={() => setIsFindReplaceOpen(false)}
        onUpdateContent={(newContent) => {
          onUpdateNote({
            ...note,
            content: newContent,
            updatedAt: new Date().toISOString()
          });
        }}
      />

      {/* 4-ROW COLLAPSIBLE SYSTEMATIC TOOLBAR */}
      <EditorToolbar
        note={note}
        folders={folders}
        books={books}
        isZenMode={isZenMode}
        mode={mode}
        setMode={setMode}
        isRow1Open={isRow1Open}
        isRow2Open={isRow2Open}
        isRow3Open={isRow3Open}
        isRow4Open={isRow4Open}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        fontSize={fontSize}
        setFontSize={setFontSize}
        lineHeight={lineHeight}
        setLineHeight={setLineHeight}
        textAlign={textAlign}
        setTextAlign={setTextAlign}
        pageFormat={pageFormat}
        setPageFormat={setPageFormat}
        pageMargin={pageMargin}
        setPageMargin={setPageMargin}
        isTemplateMenuOpen={isTemplateMenuOpen}
        setIsTemplateMenuOpen={setIsTemplateMenuOpen}
        wordCount={wordCount}
        charCount={charCount}
        isFindReplaceOpen={isFindReplaceOpen}
        onToggleFindReplace={() => setIsFindReplaceOpen((prev) => !prev)}
        isDrawingModalOpen={isDrawingModalOpen}
        setIsDrawingModalOpen={setIsDrawingModalOpen}
        isOutlineOpen={isOutlineOpen}
        onToggleOutline={() => setIsOutlineOpen((prev) => !prev)}
        isMicEnabled={isMicEnabled}
        isVoiceRecorderOpen={isVoiceRecorderOpen}
        onToggleVoiceRecorder={() => setIsVoiceRecorderOpen((prev) => !prev)}
        isSplitView={isSplitView}
        onOpenSplit={onOpenSplit}
        onCloseSplit={onCloseSplit}
        onUpdateNote={onUpdateNote}
        onDeleteNote={onDeleteNote}
        onToggleZenMode={onToggleZenMode}
        onDuplicateNote={onDuplicateNote}
        onMoveNote={onMoveNote}
        onToggleArchiveNote={onToggleArchiveNote}
        onCloseNote={onCloseNote}
        onBackMobile={onBackMobile}
        insertFormatting={insertFormatting}
        handleToolbarLinkClick={handleToolbarLinkClick}
        handleToolbarDiagramClick={handleToolbarDiagramClick}
        handleInsertTemplate={handleInsertTemplate}
        handleFolderChange={handleFolderChange}
        handleBookChange={handleBookChange}
        setIsMoveModalOpen={setIsMoveModalOpen}
        setMoveFolderChoice={setMoveFolderChoice}
        setMoveBookChoice={setMoveBookChoice}
        setIsExportModalOpen={setIsExportModalOpen}
        setIsCryptoModalOpen={setIsCryptoModalOpen}
        setCryptoModalMode={setCryptoModalMode}
        setIsInteractiveFlowOpen={setIsInteractiveFlowOpen}
        setIsMathGraphStudioOpen={setIsMathGraphStudioOpen}
        setIsBlocklyStudioOpen={setIsBlocklyStudioOpen}
        setIsThreeStudioOpen={setIsThreeStudioOpen}
        setIsCitationStudioOpen={setIsCitationStudioOpen}
        setIsSlideDeckOpen={setIsSlideDeckOpen}
        setIsOcrScannerOpen={setIsOcrScannerOpen}
        setIsFlashcardQuizOpen={setIsFlashcardQuizOpen}
        setIsNoteCanvasOpen={setIsNoteCanvasOpen}
        setIsInsertImageOpen={setIsInsertImageOpen}
        setIsVideoModalOpen={setIsVideoModalOpen}
      />

      {/* Voice Recorder Bar (if active and mic enabled) */}
      {isMicEnabled && (
        <VoiceRecorder
          isOpen={isVoiceRecorderOpen}
          onClose={() => setIsVoiceRecorderOpen(false)}
          onSaveVoiceNote={handleAddAttachment}
        />
      )}

      {/* Visual Studios Orchestrator Container */}
      <EditorStudioModals
        note={note}
        allNotes={allNotes}
        activeWorkspace={activeWorkspace}
        onSelectTab={onSelectTab}
        onInsertIntoNote={insertFormatting}
        onSaveAttachment={handleAddAttachment}
        isDrawingModalOpen={isDrawingModalOpen}
        onCloseDrawingModal={() => setIsDrawingModalOpen(false)}
        isInteractiveFlowOpen={isInteractiveFlowOpen}
        onCloseInteractiveFlow={() => setIsInteractiveFlowOpen(false)}
        isMathGraphStudioOpen={isMathGraphStudioOpen}
        onCloseMathGraphStudio={() => setIsMathGraphStudioOpen(false)}
        isBlocklyStudioOpen={isBlocklyStudioOpen}
        onCloseBlocklyStudio={() => setIsBlocklyStudioOpen(false)}
        isThreeStudioOpen={isThreeStudioOpen}
        onCloseThreeStudio={() => setIsThreeStudioOpen(false)}
        isCitationStudioOpen={isCitationStudioOpen}
        onCloseCitationStudio={() => setIsCitationStudioOpen(false)}
        isExportModalOpen={isExportModalOpen}
        onCloseExportModal={() => setIsExportModalOpen(false)}
        isNoteCanvasOpen={isNoteCanvasOpen}
        onCloseNoteCanvas={() => setIsNoteCanvasOpen(false)}
        isFlashcardQuizOpen={isFlashcardQuizOpen}
        onCloseFlashcardQuiz={() => setIsFlashcardQuizOpen(false)}
        isOcrScannerOpen={isOcrScannerOpen}
        onCloseOcrScanner={() => setIsOcrScannerOpen(false)}
        isSlideDeckOpen={isSlideDeckOpen}
        onCloseSlideDeck={() => setIsSlideDeckOpen(false)}
        isVideoModalOpen={isVideoModalOpen}
        onCloseVideoModal={() => setIsVideoModalOpen(false)}
      />

      {/* Outline Drawer (Table of Contents) */}
      <NoteOutline
        content={note.content}
        isOpen={isOutlineOpen}
        onClose={() => setIsOutlineOpen(false)}
        onScrollToHeading={handleScrollToHeading}
      />

      {/* Suggestions Popup (Slash & Wiki-link) */}
      {suggestionState.isOpen && (
        <EditorSuggestions
          type={suggestionState.type}
          query={suggestionState.query}
          allNotes={allNotes}
          position={suggestionState.position}
          isMicEnabled={isMicEnabled}
          onSelectSlashCommand={handleSelectSlashCommand}
          onSelectWikiLink={handleSelectWikiLink}
          onTriggerVoiceRecorder={() => {
            if (isMicEnabled) {
              setSuggestionState((prev) => ({ ...prev, isOpen: false }));
              setIsVoiceRecorderOpen(true);
            }
          }}
          onTriggerDrawing={() => {
            setSuggestionState((prev) => ({ ...prev, isOpen: false }));
            setIsDrawingModalOpen(true);
          }}
          onTriggerVideoEmbed={() => {
            setSuggestionState((prev) => ({ ...prev, isOpen: false }));
            setIsVideoModalOpen(true);
          }}
          onTriggerCitationStudio={() => {
            setSuggestionState((prev) => ({ ...prev, isOpen: false }));
            setIsCitationStudioOpen(true);
          }}
          onClose={() => setSuggestionState((prev) => ({ ...prev, isOpen: false }))}
        />
      )}

      {/* Main Canvas Area: Locked State OR Single View OR Side-by-Side Split View */}
      {note.isLocked ? (
        <div className="locked-note-view">
          <div className="locked-note-card">
            <div className="locked-note-shield">
              <Lock size={44} color="var(--color-warning)" />
            </div>
            <h2>Protected Note</h2>
            <p className="locked-note-desc">
              This note is encrypted with zero-knowledge <strong>AES-256-GCM</strong> authenticated encryption.
              Plaintext is withheld from persistent storage until unlocked with your passphrase.
            </p>

            {note.encryptedData?.hint && (
              <div className="locked-note-hint">
                <span>Hint: <strong>{note.encryptedData.hint}</strong></span>
              </div>
            )}

            <div className="locked-note-actions">
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  setCryptoModalMode('unlock');
                  setIsCryptoModalOpen(true);
                }}
                leftIcon={<Unlock size={18} />}
              >
                Unlock Note
              </Button>
            </div>

            <div className="locked-note-specs">
              <span>PBKDF2-SHA256 (600K iterations)</span>
              <span>•</span>
              <span>AES-256-GCM AEAD Tag</span>
              <span>•</span>
              <span>Anti-MITM Bound</span>
            </div>
          </div>
        </div>
      ) : mode === 'split' ? (
        <div className={`split-view-container page-format-${pageFormat} page-margin-${pageMargin}`}>
          {/* Left Pane: Raw Markdown Editor */}
          <div className="split-pane-editor">
            <input
              type="text"
              className="editor-title-input"
              placeholder="Untitled Note..."
              value={note.title}
              disabled={note.isTrashed}
              onChange={handleTitleChange}
            />
            <div className="editor-tags-bar">
              {note.tags?.map((tag) => (
                <span key={tag} className="tag-pill">
                  <span>#{tag}</span>
                  {!note.isTrashed && (
                    <button className="tag-delete-btn" onClick={() => handleRemoveTag(tag)}>×</button>
                  )}
                </span>
              ))}
              {!note.isTrashed && (
                <input
                  type="text"
                  className="new-tag-input"
                  placeholder="+ Add tag..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                />
              )}
            </div>
            <textarea
              ref={textareaRef}
              className="editor-content-textarea selectable-text"
              placeholder="Type markdown, / for commands, or [[ for note links..."
              value={note.content}
              disabled={note.isTrashed}
              onChange={handleContentChange}
              style={{ minHeight: '600px' }}
            />
          </div>

          {/* Right Pane: Live Rendered Output */}
          <div className="split-pane-preview">
            <div className="markdown-body selectable-text">
              {renderMarkdownPreview(note.content)}
            </div>
          </div>
        </div>
      ) : (
        <div 
          className={`editor-scroll-area ${mode === 'live' ? 'live-document-mode' : ''} page-format-${pageFormat} page-margin-${pageMargin}`} 
          ref={scrollAreaRef}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (
              target === e.currentTarget || 
              target.classList.contains('editor-scroll-area') || 
              target.classList.contains('live-document-wrapper') ||
              target.classList.contains('live-empty-canvas-prompt') ||
              target.closest('.live-empty-canvas-prompt') ||
              target.closest('.live-empty-trailing-space')
            ) {
              if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(note.content.length, note.content.length);
              }
            }
          }}
        >
          {/* Hierarchy Breadcrumb Trail */}
          <nav className="editor-hierarchy-breadcrumbs" aria-label="Hierarchy">
            {activeWorkspace && (
              <span className="crumb-item ws" title={`Workspace: ${activeWorkspace.name}`}>
                <span className="crumb-icon">{activeWorkspace.icon}</span>
                <span>{activeWorkspace.name}</span>
              </span>
            )}
            {currentBook ? (
              <>
                <span className="crumb-sep">/</span>
                <span className="crumb-item crumb-book-item" title={`Book: ${currentBook.title}`}>
                  <span>{currentBook.icon}</span>
                  <span>{currentBook.title}</span>
                </span>
                {typeof note.pageOrder === 'number' && (
                  <>
                    <span className="crumb-sep">/</span>
                    <span className="crumb-item chapter">Chapter {note.pageOrder + 1}</span>
                  </>
                )}
              </>
            ) : folders.find((f) => f.id === note.folderId) ? (
              <>
                <span className="crumb-sep">/</span>
                <span className="crumb-item folder" style={{ color: folders.find((f) => f.id === note.folderId)?.color }}>
                  <FolderIcon size={11} />
                  <span>{folders.find((f) => f.id === note.folderId)?.name}</span>
                </span>
              </>
            ) : (
              <>
                <span className="crumb-sep">/</span>
                <span className="crumb-item root">Root Notes</span>
              </>
            )}
            <span className="crumb-sep">/</span>
            <span className="crumb-item current">{note.title || 'Untitled Note'}</span>
          </nav>

          {/* Title Field */}
          <input
            type="text"
            className="editor-title-input"
            placeholder="Untitled Note..."
            value={note.title}
            disabled={note.isTrashed}
            onChange={handleTitleChange}
          />

          {/* Tags Bar */}
          <div className="editor-tags-bar">
            {note.tags?.map((tag) => (
              <span key={tag} className="tag-pill">
                <span>#{tag}</span>
                {!note.isTrashed && (
                  <button 
                    className="tag-delete-btn" 
                    onClick={() => handleRemoveTag(tag)}
                    title="Remove tag"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            {!note.isTrashed && (
              <input
                type="text"
                className="new-tag-input"
                placeholder="+ Add tag..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
            )}
          </div>

          {/* Content Field: Live Interactive Document vs Raw Source Editor */}
          {mode === 'source' ? (
            <textarea
              ref={textareaRef}
              className="editor-content-textarea selectable-text"
              placeholder="Write markdown, type / for commands, or [[ for note links..."
              value={note.content}
              disabled={note.isTrashed}
              onChange={handleContentChange}
            />
          ) : (
            <div className="live-document-wrapper">
              {(!note.content || !note.content.trim()) && !note.isTrashed && (
                <div 
                  className="live-empty-canvas-prompt"
                  onClick={() => {
                    setMode('source');
                    setTimeout(() => {
                      if (textareaRef.current) {
                        textareaRef.current.focus();
                      }
                    }, 50);
                  }}
                  title="Click to write or edit"
                >
                  <Edit3 size={15} color="var(--accent-primary)" />
                  <span>Click here or anywhere in this space to type, or type <code>/</code> for templates & commands</span>
                </div>
              )}
              <div className={`markdown-body live-rich-document font-${fontFamily} size-${fontSize} leading-${lineHeight} align-${textAlign} selectable-text`}>
                {renderMarkdownPreview(
                  (() => {
                    const trimmedContent = note.content.trim();
                    const cleanTitle = (note.title || '').trim().toLowerCase();
                    if (trimmedContent.startsWith('# ')) {
                      const firstLine = trimmedContent.split('\n')[0].replace(/^#\s+/, '').trim().toLowerCase();
                      if (firstLine === cleanTitle) {
                        return note.content.replace(/^#\s+[^\n]*\n?/, '');
                      }
                    }
                    return note.content;
                  })()
                )}
              </div>
              {/* Trailing click-to-type area for adding text below existing content */}
              {!note.isTrashed && (
                <div 
                  className="live-empty-trailing-space"
                  onClick={() => {
                    setMode('source');
                    setTimeout(() => {
                      if (textareaRef.current) {
                        textareaRef.current.focus();
                        textareaRef.current.setSelectionRange(note.content.length, note.content.length);
                      }
                    }, 50);
                  }}
                  title="Click here to continue typing at the end of the note"
                >
                  <span className="trailing-prompt-hint">Click here to continue writing...</span>
                </div>
              )}
            </div>
          )}

          {/* Book Reader Page Navigation Bar (if note is part of a book) */}
          {currentBook && allBookPages.length > 0 && (
            <BookPageNavigator
              currentNote={note}
              book={currentBook}
              allBookPages={allBookPages}
              onSelectPage={onNavigateToNote}
              onAddPageToBook={onAddPageToBook}
            />
          )}

          {/* Multimedia & Attachments Section */}
          <AttachmentManager
            attachments={note.attachments || []}
            onAddAttachment={handleAddAttachment}
            onDeleteAttachment={handleDeleteAttachment}
          />

          {/* Backlinks & Connected References */}
          {backlinks.length > 0 && (
            <div className="backlinks-section">
              <span className="backlinks-header">
                <Share2 size={13} />
                <span>Referenced in {backlinks.length} other note{backlinks.length > 1 ? 's' : ''}</span>
              </span>
              <div className="backlinks-list">
                {backlinks.map((bn) => (
                  <div 
                    key={bn.id} 
                    className="backlink-card"
                    onClick={() => onNavigateToNote(bn.title)}
                    title={`Open ${bn.title}`}
                  >
                    <Link size={12} color="var(--accent-primary)" />
                    <span>{bn.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Zero-Knowledge Note Encryption / Unlock Modal */}
      <LockNoteModal
        isOpen={isCryptoModalOpen}
        note={note}
        mode={cryptoModalMode}
        onClose={() => setIsCryptoModalOpen(false)}
        onLockSuccess={(payload) => {
          onUpdateNote({
            ...note,
            isLocked: true,
            encryptedData: payload,
            content: '', // wipes plaintext from storage
            updatedAt: new Date().toISOString()
          });
        }}
        onUnlockSuccess={(decryptedContent) => {
          onUpdateNote({
            ...note,
            isLocked: false,
            content: decryptedContent,
            updatedAt: new Date().toISOString()
          });
        }}
        onRemoveLock={() => {
          onUpdateNote({
            ...note,
            isLocked: false,
            encryptedData: null,
            updatedAt: new Date().toISOString()
          });
          setIsCryptoModalOpen(false);
        }}
      />

      {/* Insert & Wrap Image Modal */}
      <InsertImageModal
        isOpen={isInsertImageOpen}
        onClose={() => setIsInsertImageOpen(false)}
        onInsert={handleInsertImageTag}
      />

      {/* Move Note Modal */}
      {isMoveModalOpen && (
        <div className="library-submodal-backdrop" onClick={() => setIsMoveModalOpen(false)}>
          <div className="library-submodal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="submodal-title">Move Note: {note.title || 'Untitled'}</h3>
            
            <div className="form-group">
              <label>Destination Folder</label>
              <select 
                value={moveFolderChoice} 
                onChange={(e) => setMoveFolderChoice(e.target.value)}
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
                value={moveBookChoice} 
                onChange={(e) => setMoveBookChoice(e.target.value)}
              >
                <option value="">(Not in a Book)</option>
                {books.map(b => (
                  <option key={b.id} value={b.id}>{b.icon} {b.title}</option>
                ))}
              </select>
            </div>

            <div className="submodal-btn-row">
              <button type="button" className="btn-cancel" onClick={() => setIsMoveModalOpen(false)}>Cancel</button>
              <button 
                type="button" 
                className="btn-confirm" 
                onClick={() => {
                  if (onMoveNote) onMoveNote(note.id, moveFolderChoice || null, moveBookChoice || null);
                  setIsMoveModalOpen(false);
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Web Link Insertion Modal */}
      <LinkInsertModal
        isOpen={isLinkModalOpen}
        initialSelectedText={linkInitialText}
        onClose={() => setIsLinkModalOpen(false)}
        onInsert={handleInsertLink}
      />

      {/* Interactive Mermaid Diagram Studio Modal */}
      <MermaidEditorModal
        isOpen={isMermaidModalOpen}
        initialCode={mermaidInitialCode}
        onClose={() => {
          setIsMermaidModalOpen(false);
          setActiveMermaidBlock(null);
        }}
        onSave={handleSaveMermaidDiagram}
      />

      {/* Floating Bubble Contextual Formatting Toolbar (Froala / Quill / SunEditor / RoosterJS) */}
      <FloatingBubbleToolbar
        position={bubblePosition}
        onApplyFormat={handleApplyBubbleFormat}
        onClose={() => setBubblePosition((prev) => ({ ...prev, visible: false }))}
        onCreateFlashcard={() => handleApplyBubbleFormat('flashcard')}
      />

      {/* Instant Flashcard Creation Toast */}
      {flashcardToast && (
        <div
          className="flashcard-created-toast"
          style={{
            position: 'fixed',
            bottom: '28px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-surface-elevated, #1e293b)',
            color: 'var(--text-primary, #fff)',
            padding: '8px 18px',
            borderRadius: '24px',
            boxShadow: 'var(--shadow-modal, 0 10px 30px rgba(0,0,0,0.35))',
            border: '1px solid var(--border-active, #8b5cf6)',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 99999,
            pointerEvents: 'none'
          }}
        >
          <span style={{ fontSize: '15px' }}>🎴</span>
          <span>{flashcardToast}</span>
        </div>
      )}

      {/* Floating Autosave & Word / Character Metrics Badge (Bottom-Right Corner) */}
      <EditorFooterStatus
        saveStatus={saveStatus}
        content={note.content || ''}
      />
    </main>
  );
};
