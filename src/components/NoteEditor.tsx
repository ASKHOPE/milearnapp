import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { 
  Note, 
  Folder as FolderType, 
  Attachment,
  Book,
  Workspace
} from '../types';
import { 
  Star, 
  Pin, 
  Trash2, 
  Bold, 
  Italic, 
  List, 
  CheckSquare, 
  Heading1, 
  Heading2, 
  Heading3, 
  Code, 
  Link, 
  ExternalLink,
  Edit3, 
  Columns, 
  ArrowLeft,
  Share2,
  Folder as FolderIcon,
  Mic,
  ListTree,
  Maximize2,
  Minimize2,
  Table as TableIcon,
  Copy,
  Check,
  Info,
  Lightbulb,
  AlertTriangle,
  Zap,
  PenTool,
  Search,
  LayoutTemplate,
  ChevronDown,
  Archive,
  RotateCcw,
  BookOpen,
  Lock,
  Unlock,
  KeyRound,
  Sigma,
  GitBranch,
  Columns2,
  Move,
  LogOut,
  XCircle,
  Video as VideoIcon,
  Highlighter as HighlighterIcon,
  Strikethrough as StrikethroughIcon,
  Underline as UnderlineIcon,
  ChevronRight,
  Save,
  Sliders,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Subscript,
  Superscript,
  Code2,
  GitFork,
  TrendingUp,
  Puzzle,
  Box,
  Printer,
  Download,
  Scissors,
  Presentation,
  ScanText,
  GraduationCap,
  Network,
  FileCode,
  FileText,
  Quote
} from 'lucide-react';
import { AttachmentManager } from './AttachmentManager';
import { VoiceRecorder } from './VoiceRecorder';
import { EditorSuggestions } from './EditorSuggestions';
import type { SuggestionType } from './EditorSuggestions';
import { NoteOutline } from './NoteOutline';
import { NoteTabs } from './NoteTabs';
import { FindReplaceBar } from './FindReplaceBar';
import { EditorStudioModals } from './editor/EditorStudioModals';
import { EditorFooterStatus } from './editor/EditorFooterStatus';
import { ErrorBoundary } from './common/ErrorBoundary';
import { BookPageNavigator } from './BookPageNavigator';
import { MathRenderer } from './MathRenderer';
import { MermaidRenderer } from './MermaidRenderer';
import { LockNoteModal } from './LockNoteModal';
import { Button } from './ui/Button';
import { NOTE_TEMPLATES } from '../services/templates';
import { Image as ImageIcon, Sparkles } from 'lucide-react';
import { InteractiveTable } from './editor/InteractiveTable';
import { InteractiveTasks, type TaskItem } from './editor/InteractiveTasks';
import { WrappedImage, type ImageAlignMode, type ImageSizeMode } from './editor/WrappedImage';
import { InsertImageModal } from './editor/InsertImageModal';
import { LinkInsertModal } from './editor/LinkInsertModal';
import { MermaidEditorModal } from './editor/MermaidEditorModal';
import { scanTextToDiagram } from '../services/textToDiagram';
import { FloatingBubbleToolbar, type FloatingBubblePosition } from './editor/FloatingBubbleToolbar';
import { BlockActionsMenu } from './editor/BlockActionsMenu';

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
      setMoveFolderChoice(note.folderId || '');
      setMoveBookChoice(note.bookId || '');
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
      <div className="editor-systematic-toolbar">
        
        {/* ROW 1: ACTIONS & META (Rendered when Actions pill is active) */}
        {isRow1Open && (
          <div className="toolbar-row-body row-1-actions">
            {/* Folder Selector */}
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

            {/* Book Selector */}
            <div className="toolbar-inline-select">
              <BookOpen size={13} color="var(--accent-primary)" />
              <select
                className="editor-folder-select"
                value={note.bookId || ''}
                onChange={handleBookChange}
                disabled={note.isTrashed}
                title="Organize note into a Book / Notebook"
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
              className={`toolbar-btn ${isFindReplaceOpen ? 'active' : ''}`}
              onClick={() => setIsFindReplaceOpen(!isFindReplaceOpen)}
              title="Find & Replace in note (Cmd+F)"
            >
              <Search size={13} />
              <span>Find</span>
            </button>

            {/* Drawing */}
            <button
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
              className={`toolbar-btn ${isOutlineOpen ? 'active' : ''}`}
              onClick={() => setIsOutlineOpen(!isOutlineOpen)}
              title="Document Outline"
            >
              <ListTree size={13} />
              <span>Outline</span>
            </button>

            {/* Voice memo */}
            {isMicEnabled && (
              <button
                className={`toolbar-btn ${isVoiceRecorderOpen ? 'active' : ''}`}
                onClick={() => setIsVoiceRecorderOpen(!isVoiceRecorderOpen)}
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

            {/* Duplicate */}
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

            {/* Move */}
            {onMoveNote && (
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => setIsMoveModalOpen(true)}
                title="Move Note"
              >
                <Move size={13} />
              </button>
            )}

            {/* Export */}
            <button
              className="toolbar-btn"
              onClick={() => setIsExportModalOpen(true)}
              title="Export & Share"
            >
              <Share2 size={13} color="var(--accent-primary)" />
              <span>Export</span>
            </button>

            {/* Pin */}
            <button
              className={`toolbar-btn ${note.isPinned ? 'active' : ''}`}
              onClick={() => onUpdateNote({ ...note, isPinned: !note.isPinned })}
              disabled={note.isTrashed}
              title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
            >
              <Pin size={13} />
            </button>

            {/* Favorite */}
            <button
              className={`toolbar-btn ${note.isFavorite ? 'active' : ''}`}
              onClick={() => onUpdateNote({ ...note, isFavorite: !note.isFavorite })}
              disabled={note.isTrashed}
              title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star size={13} fill={note.isFavorite ? '#f59e0b' : 'none'} color={note.isFavorite ? '#f59e0b' : undefined} />
            </button>

            {/* Lock */}
            <button
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

            {/* Zen Mode */}
            <button
              className={`toolbar-btn ${isZenMode ? 'active' : ''}`}
              onClick={onToggleZenMode}
              title={isZenMode ? 'Exit Zen Mode' : 'Zen Focus Mode'}
            >
              {isZenMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>

            {/* Mobile Back button */}
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

            {/* Archive */}
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

            {/* Trash */}
            <button
              className="toolbar-btn danger"
              onClick={() => onDeleteNote(note.id)}
              title={note.isTrashed ? 'Delete Forever' : 'Move note to Trash'}
            >
              <Trash2 size={13} />
            </button>

            {/* Exit Note */}
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

        {/* ROW 2: TYPOGRAPHY (Rendered when Typography pill is active) */}
        {isRow2Open && (
          <div className="toolbar-row-body row-2-typography">
            <button className="toolbar-btn" onClick={() => insertFormatting('# ')} disabled={note.isTrashed} title="Heading 1">
              <Heading1 size={14} />
              <span>H1</span>
            </button>
            <button className="toolbar-btn" onClick={() => insertFormatting('## ')} disabled={note.isTrashed} title="Heading 2">
              <Heading2 size={14} />
              <span>H2</span>
            </button>
            <button className="toolbar-btn" onClick={() => insertFormatting('### ')} disabled={note.isTrashed} title="Heading 3">
              <Heading3 size={14} />
              <span>H3</span>
            </button>

            <div className="toolbar-divider" />

            {/* Font Family Selector */}
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

            {/* Font Size Selector */}
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

            {/* Line Height Selector */}
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

            {/* Alignment Buttons */}
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

            {/* Text Styling */}
            <button className="toolbar-btn" onClick={() => insertFormatting('**', '**')} disabled={note.isTrashed} title="Bold (**text**)">
              <Bold size={14} />
            </button>
            <button className="toolbar-btn" onClick={() => insertFormatting('*', '*')} disabled={note.isTrashed} title="Italic (*text*)">
              <Italic size={14} />
            </button>
            <button className="toolbar-btn" onClick={() => insertFormatting('<u>', '</u>')} disabled={note.isTrashed} title="Underline (<u>text</u>)">
              <UnderlineIcon size={14} />
            </button>
            <button className="toolbar-btn" onClick={() => insertFormatting('~~', '~~')} disabled={note.isTrashed} title="Strikethrough (~~text~~)">
              <StrikethroughIcon size={14} />
            </button>
            <button className="toolbar-btn" onClick={() => insertFormatting('`', '`')} disabled={note.isTrashed} title="Inline Code (`code`)">
              <Code2 size={14} />
            </button>
            <button className="toolbar-btn" onClick={() => insertFormatting('<sub>', '</sub>')} disabled={note.isTrashed} title="Subscript (<sub>text</sub>)">
              <Subscript size={14} />
            </button>
            <button className="toolbar-btn" onClick={() => insertFormatting('<sup>', '</sup>')} disabled={note.isTrashed} title="Superscript (<sup>text</sup>)">
              <Superscript size={14} />
            </button>
            <button className="toolbar-btn" onClick={() => insertFormatting('<mark>', '</mark>')} disabled={note.isTrashed} title="Highlight (<mark>text</mark>)">
              <HighlighterIcon size={14} color="#f59e0b" />
              <span>Highlight</span>
            </button>
          </div>
        )}

        {/* ROW 3: FORMAT & PAGE SETUP (Rendered when Format pill is active) */}
        {isRow3Open && (
          <div className="toolbar-row-body row-3-blocks row-3-format">
            {/* Page Setup Format Selector */}
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

            {/* Page Margin Selector (when A4 or US Letter is active) */}
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

            {/* Page Break / Divider */}
            <button 
              className="toolbar-btn" 
              onClick={() => insertFormatting('\n\n---\n\n')} 
              disabled={note.isTrashed} 
              title="Insert Page Break / Slide Separator (---)"
            >
              <Scissors size={14} />
              <span>Page Break</span>
            </button>

            <div className="toolbar-divider" />

            <button className="toolbar-btn" onClick={() => insertFormatting('- [ ] ')} disabled={note.isTrashed} title="Task checklist">
              <CheckSquare size={14} />
              <span>Checklist Task</span>
            </button>
            <button className="toolbar-btn" onClick={() => insertFormatting('- ')} disabled={note.isTrashed} title="Bullet List">
              <List size={14} />
              <span>Bullet List</span>
            </button>
            <button className="toolbar-btn" onClick={() => insertFormatting('1. ')} disabled={note.isTrashed} title="Numbered List">
              <span style={{ fontSize: '12px', fontWeight: 600 }}>1.</span>
              <span>Numbered</span>
            </button>
            <button className="toolbar-btn" onClick={() => insertFormatting('\n| Header 1 | Header 2 |\n| :--- | :--- |\n| Item 1 | Item 2 |\n\n')} disabled={note.isTrashed} title="Insert Table">
              <TableIcon size={14} />
              <span>Table Grid</span>
            </button>
            <button className="toolbar-btn" onClick={() => insertFormatting('> [!NOTE]\n> ')} disabled={note.isTrashed} title="Callout Card">
              <Info size={14} />
              <span>Callout Box</span>
            </button>
            <button className="toolbar-btn" onClick={() => insertFormatting('```typescript\n', '\n```')} disabled={note.isTrashed} title="Code Block">
              <Code size={14} />
              <span>Code Block</span>
            </button>
            <button className="toolbar-btn" onClick={() => insertFormatting('> ')} disabled={note.isTrashed} title="Quote Block">
              <span style={{ fontSize: '14px', fontWeight: 700, fontStyle: 'italic' }}>“</span>
              <span>Blockquote</span>
            </button>
          </div>
        )}

        {/* ROW 4: MEDIA, ADVANCED & STUDIOS (Rendered when Media pill is active) */}
        {isRow4Open && (
          <div className="toolbar-row-body row-4-advanced">
            <button 
              className="toolbar-btn" 
              onClick={() => insertFormatting('[[', ']]')} 
              disabled={note.isTrashed} 
              title="Internal Note Link ([[Wiki-Link]])"
            >
              <Link size={14} />
              <span>[[Wiki]]</span>
            </button>
            <button 
              className="toolbar-btn" 
              onClick={handleToolbarLinkClick} 
              disabled={note.isTrashed} 
              title="Insert Web Link"
            >
              <ExternalLink size={14} />
              <span>[Web Link]</span>
            </button>
            <button 
              className="toolbar-btn" 
              onClick={() => insertFormatting('$$ ', ' $$')} 
              disabled={note.isTrashed} 
              title="Insert Mathematical Formula"
            >
              <Sigma size={14} />
              <span>Math Formula</span>
            </button>
            <button 
              className="toolbar-btn" 
              onClick={handleToolbarDiagramClick} 
              disabled={note.isTrashed} 
              title="Mermaid Diagram Studio"
            >
              <GitBranch size={14} color="#8b5cf6" />
              <span>Diagram</span>
            </button>
            <button 
              className="toolbar-btn" 
              onClick={() => setIsInteractiveFlowOpen(true)} 
              disabled={note.isTrashed} 
              title="Interactive Flow & Concept Canvas (@xyflow/react)"
            >
              <GitFork size={14} color="#818cf8" />
              <span>Flow Canvas</span>
            </button>
            <button 
              className="toolbar-btn" 
              onClick={() => setIsMathGraphStudioOpen(true)} 
              disabled={note.isTrashed} 
              title="2D Function Grapher & Scientific Calculator (Desmos & Advanced-Calculator)"
            >
              <TrendingUp size={14} color="#10b981" />
              <span>Graph/Calc</span>
            </button>
            <button 
              className="toolbar-btn" 
              onClick={() => setIsBlocklyStudioOpen(true)} 
              disabled={note.isTrashed} 
              title="Visual Logic & Block Programming (Google Blockly)"
            >
              <Puzzle size={14} color="#f59e0b" />
              <span>Blockly Code</span>
            </button>
            <button 
              className="toolbar-btn" 
              onClick={() => setIsThreeStudioOpen(true)} 
              disabled={note.isTrashed} 
              title="3D Interactive Geometry & Models (Three.js WebGL)"
            >
              <Box size={14} color="#06b6d4" />
              <span>3D Model</span>
            </button>
            <button 
              className="toolbar-btn" 
              onClick={() => setIsCitationStudioOpen(true)} 
              disabled={note.isTrashed} 
              title="Academic Citations & Bibliography Studio (Citation.js)"
            >
              <Quote size={14} color="#ec4899" />
              <span>Citations</span>
            </button>
            <button 
              className="toolbar-btn" 
              onClick={() => setIsSlideDeckOpen(true)} 
              disabled={note.isTrashed} 
              title="Present as Fullscreen Slide Deck (splits on ---)"
            >
              <Presentation size={14} color="#ec4899" />
              <span>Slide Deck</span>
            </button>
            <button 
              className="toolbar-btn" 
              onClick={() => setIsOcrScannerOpen(true)} 
              disabled={note.isTrashed} 
              title="OCR Scanner: Extract text from photos or textbook pages"
            >
              <ScanText size={14} color="#10b981" />
              <span>Scan Text</span>
            </button>
            <button 
              className="toolbar-btn" 
              onClick={() => setIsFlashcardQuizOpen(true)} 
              disabled={note.isTrashed} 
              title="Active Recall Flashcards & Spaced Repetition Quiz"
            >
              <GraduationCap size={14} color="var(--accent-primary)" />
              <span>Study Cards</span>
            </button>
            <button 
              className="toolbar-btn" 
              onClick={() => setIsNoteCanvasOpen(true)} 
              disabled={note.isTrashed} 
              title="Infinite Note Canvas: Map knowledge & connections (@xyflow/react)"
            >
              <Network size={14} color="#0ea5e9" />
              <span>Note Canvas</span>
            </button>
            <button 
              className="toolbar-btn" 
              onClick={() => setIsInsertImageOpen(true)} 
              disabled={note.isTrashed} 
              title="Insert Image"
            >
              <ImageIcon size={14} color="var(--accent-primary)" />
              <span>Image</span>
            </button>
            <button 
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
                  className={`mode-btn ${mode === 'live' ? 'active' : ''}`}
                  onClick={() => setMode('live')}
                  title="Interactive Live Document (WYSIWYG)"
                >
                  <Sparkles size={11} style={{ marginRight: '3px' }} />
                  <span>Live</span>
                </button>
                <button 
                  className={`mode-btn ${mode === 'split' ? 'active' : ''}`}
                  onClick={() => setMode('split')}
                  title="Side-by-Side Split View"
                >
                  <Columns size={11} style={{ marginRight: '3px' }} />
                  <span>Split</span>
                </button>
                <button 
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
      />

      {/* Floating Autosave & Word / Character Metrics Badge (Bottom-Right Corner) */}
      <EditorFooterStatus
        saveStatus={saveStatus}
        content={note.content || ''}
      />
    </main>
  );
};
